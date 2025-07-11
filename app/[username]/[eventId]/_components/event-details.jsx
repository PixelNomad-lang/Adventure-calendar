import { Calendar, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EventDetails({ event }) {
  const { user } = event;
  
  const getEventTypeDisplay = () => {
    switch (event.eventType) {
      case "PUBLIC":
        return "Public Event";
      case "IN_PERSON":
        return "In-Person Meeting";
      default:
        return "Private Event";
    }
  };

  const getMeetingTypeDisplay = () => {
    if (event.eventType === "IN_PERSON") {
      return "In-Person Meeting";
    }
    if (event.hasVideo) {
      return event.videoProvider === "zoom" ? "Zoom Meeting" : "Google Meet";
    }
    return event.chatProvider === "teams" ? "Microsoft Teams Chat" : "WhatsApp Chat";
  };

  return (
    <div className="p-10 lg:w-1/3 bg-white">
      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <div className="flex items-center mb-4">
        <Avatar className="w-12 h-12 mr-4">
          <AvatarImage src={user.imageUrl} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center mb-2">
        <Clock className="mr-2" />
        <span>{event.duration} minutes</span>
      </div>
      <div className="flex items-center mb-4">
        <Calendar className="mr-2" />
        <span>{getMeetingTypeDisplay()}</span>
      </div>
      <div className="mb-4">
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          {getEventTypeDisplay()}
        </span>
      </div>
      {event.eventType === "IN_PERSON" && event.address && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Meeting Location:</h3>
          <p className="text-gray-700">{event.address}</p>
          {event.contactNumber && (
            <p className="text-gray-700 mt-1">Contact: {event.contactNumber}</p>
          )}
        </div>
      )}
      <p className="text-gray-700">{event.description}</p>
    </div>
  );
}
