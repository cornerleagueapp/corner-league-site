import { useQuery } from "@tanstack/react-query";
import {
  getPublishedRaceScheduleDay,
  getPublishedRaceScheduleEvent,
} from "../api/publicRaceScheduleApi";

export function usePublicRaceSchedule(dayId: string | null | undefined) {
  return useQuery({
    queryKey: ["public-race-schedule", dayId],

    enabled: !!dayId,

    queryFn: async () => {
      if (!dayId) {
        throw new Error("Race day ID is required.");
      }

      return getPublishedRaceScheduleDay(dayId);
    },

    staleTime: 15 * 1000,

    refetchInterval: 30 * 1000,

    retry: false,
  });
}

export function usePublicEventRaceSchedule(
  eventSlug: string | null | undefined,
) {
  return useQuery({
    queryKey: ["public-event-race-schedule", eventSlug],

    enabled: !!eventSlug,

    queryFn: async () => {
      if (!eventSlug) {
        throw new Error("Event slug is required.");
      }

      return getPublishedRaceScheduleEvent(eventSlug);
    },

    /**
     * Race control may republish an updated official order.
     *
     * Keep this responsive without excessively polling Cloud Run.
     */
    staleTime: 15 * 1000,

    refetchInterval: 30 * 1000,

    refetchIntervalInBackground: false,

    refetchOnWindowFocus: true,

    retry: false,
  });
}
