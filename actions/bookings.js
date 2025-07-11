"use server";

import { db } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";

export async function createBooking(bookingData) {
  try {
    // Fetch the event and its creator
    const event = await db.event.findUnique({
      where: { id: bookingData.eventId },
      include: { user: true },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    let meetLink = null;
    let googleEventId = null;

    // Handle different event types
    if (event.eventType === "IN_PERSON") {
      // For in-person events, create a simple calendar event without video
      const { data } = await clerkClient.users.getUserOauthAccessToken(
        event.user.clerkUserId,
        "oauth_google"
      );

      const token = data[0]?.token;

      if (token) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: token });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const calendarResponse = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: `${bookingData.name} - ${event.title}`,
            description: `${bookingData.additionalInfo}\n\nLocation: ${event.address}\nContact: ${event.contactNumber}`,
            start: { dateTime: bookingData.startTime },
            end: { dateTime: bookingData.endTime },
            attendees: [{ email: bookingData.email }, { email: event.user.email }],
            location: event.address,
          },
        });

        googleEventId = calendarResponse.data.id;
        meetLink = `In-person meeting at: ${event.address}`;
      }
    } else if (event.hasVideo) {
      // Handle video meetings (Google Meet or Zoom)
      const { data } = await clerkClient.users.getUserOauthAccessToken(
        event.user.clerkUserId,
        "oauth_google"
      );

      const token = data[0]?.token;

      if (!token) {
        throw new Error("Event creator has not connected Google Calendar");
      }

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: token });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      if (event.videoProvider === "google-meet") {
        const meetResponse = await calendar.events.insert({
          calendarId: "primary",
          conferenceDataVersion: 1,
          requestBody: {
            summary: `${bookingData.name} - ${event.title}`,
            description: bookingData.additionalInfo,
            start: { dateTime: bookingData.startTime },
            end: { dateTime: bookingData.endTime },
            attendees: [{ email: bookingData.email }, { email: event.user.email }],
            conferenceData: {
              createRequest: { requestId: `${event.id}-${Date.now()}` },
            },
          },
        });

        meetLink = meetResponse.data.hangoutLink;
        googleEventId = meetResponse.data.id;
      } else {
        // For Zoom, create calendar event and provide Zoom placeholder
        const calendarResponse = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: `${bookingData.name} - ${event.title}`,
            description: `${bookingData.additionalInfo}\n\nZoom meeting details will be provided separately.`,
            start: { dateTime: bookingData.startTime },
            end: { dateTime: bookingData.endTime },
            attendees: [{ email: bookingData.email }, { email: event.user.email }],
          },
        });

        googleEventId = calendarResponse.data.id;
        meetLink = "Zoom meeting link will be provided via email";
      }
    } else {
      // Handle chat-based meetings
      const { data } = await clerkClient.users.getUserOauthAccessToken(
        event.user.clerkUserId,
        "oauth_google"
      );

      const token = data[0]?.token;

      if (token) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: token });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const calendarResponse = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: `${bookingData.name} - ${event.title}`,
            description: `${bookingData.additionalInfo}\n\nChat via ${event.chatProvider === "teams" ? "Microsoft Teams" : "WhatsApp"}`,
            start: { dateTime: bookingData.startTime },
            end: { dateTime: bookingData.endTime },
            attendees: [{ email: bookingData.email }, { email: event.user.email }],
          },
        });

        googleEventId = calendarResponse.data.id;
        meetLink = `Chat meeting via ${event.chatProvider === "teams" ? "Microsoft Teams" : "WhatsApp"}`;
      }
    }

    // Create booking in database
    const booking = await db.booking.create({
      data: {
        eventId: event.id,
        userId: event.userId,
        name: bookingData.name,
        email: bookingData.email,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        additionalInfo: bookingData.additionalInfo,
        meetLink: meetLink || "Meeting details will be provided",
        googleEventId: googleEventId || `manual-${Date.now()}`,
      },
    });

    // Send emails to participants for public events
    if (event.eventType === "PUBLIC" && event.participants) {
      // Here you would implement email sending logic
      // For now, we'll just log the participants
      console.log("Sending emails to participants:", event.participants);
    }

    return { success: true, booking, meetLink };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: error.message };
  }
}
