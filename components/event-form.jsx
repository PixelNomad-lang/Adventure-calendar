import React, { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventSchema } from "@/app/lib/validators";
import { createEvent } from "@/actions/events";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { Plus, Trash2, Video, MessageCircle, MapPin, Phone } from "lucide-react";

const EventForm = ({ onSubmitForm, initialData = {} }) => {
  const router = useRouter();
  const [eventType, setEventType] = useState(initialData.eventType || "private");
  const [hasVideo, setHasVideo] = useState(initialData.hasVideo || false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData.title || "",
      description: initialData.description || "",
      duration: initialData.duration || 30,
      eventType: initialData.eventType || "private",
      participants: initialData.participants || [{ name: "", email: "" }],
      hasVideo: initialData.hasVideo || false,
      videoProvider: initialData.videoProvider || "google-meet",
      chatProvider: initialData.chatProvider || "whatsapp",
      address: initialData.address || "",
      contactNumber: initialData.contactNumber || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const { loading, error, fn: fnCreateEvent } = useFetch(createEvent);

  const onSubmit = async (data) => {
    // Clean up data based on event type
    const cleanedData = {
      ...data,
      participants: data.eventType === "public" ? data.participants : undefined,
      videoProvider: data.hasVideo ? data.videoProvider : undefined,
      chatProvider: !data.hasVideo ? data.chatProvider : undefined,
      address: data.eventType === "in-person" ? data.address : undefined,
      contactNumber: data.eventType === "in-person" ? data.contactNumber : undefined,
    };

    await fnCreateEvent(cleanedData);
    if (!loading && !error) onSubmitForm();
    router.refresh();
  };

  const watchedEventType = watch("eventType");
  const watchedHasVideo = watch("hasVideo");

  return (
    <form
      className="px-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Basic Event Details */}
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Event Title
          </label>
          <Input id="title" {...register("title")} className="mt-1" />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Textarea {...register("description")} id="description" className="mt-1" />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <Input
            id="duration"
            {...register("duration", { valueAsNumber: true })}
            type="number"
            className="mt-1"
          />
          {errors.duration && (
            <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>
          )}
        </div>
      </div>

      {/* Event Type Selection */}
      <div>
        <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">
          Event Type
        </label>
        <Controller
          name="eventType"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                setEventType(value);
              }}
              value={field.value}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="in-person">In-Person</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.eventType && (
          <p className="text-red-500 text-xs mt-1">{errors.eventType.message}</p>
        )}
      </div>

      {/* Public Event - Participants */}
      {watchedEventType === "public" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    {...register(`participants.${index}.name`)}
                    placeholder={`Person ${index + 1} Name`}
                  />
                  {errors.participants?.[index]?.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.participants[index].name.message}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    {...register(`participants.${index}.email`)}
                    type="email"
                    placeholder={`Person ${index + 1} Email`}
                  />
                  {errors.participants?.[index]?.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.participants[index].email.message}
                    </p>
                  )}
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ name: "", email: "" })}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add More Person
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Video/Chat Options */}
      {(watchedEventType === "public" || watchedEventType === "private") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Meeting Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="hasVideo"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      setHasVideo(checked);
                    }}
                  />
                )}
              />
              <label className="text-sm font-medium">Enable Video Meeting</label>
            </div>

            {watchedHasVideo ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Provider
                </label>
                <Controller
                  name="videoProvider"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select video provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google-meet">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            Google Meet
                          </div>
                        </SelectItem>
                        <SelectItem value="zoom">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            Zoom
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat Provider
                </label>
                <Controller
                  name="chatProvider"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select chat provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="teams">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Microsoft Teams
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* In-Person Event Details */}
      {watchedEventType === "in-person" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Meeting Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <Textarea
                {...register("address")}
                id="address"
                placeholder="Enter the meeting address"
                className="mt-1"
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <Input
                {...register("contactNumber")}
                id="contactNumber"
                placeholder="Contact number for the meeting"
                className="mt-1"
              />
              {errors.contactNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.contactNumber.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-red-500 text-sm">{error.message}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create Event"}
      </Button>
    </form>
  );
};

export default EventForm;