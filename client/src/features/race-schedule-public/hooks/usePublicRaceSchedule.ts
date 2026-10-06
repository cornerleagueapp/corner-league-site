import { useOrganizationPageApi } from "@/pages/organizations/SandboxContext";
import type {
  PublicRaceScheduleDayResponse,
  PublicRaceScheduleEventResponse,
} from "../types/publicRaceSchedule";
import { useQuery } from "@tanstack/react-query";
import {
  getPublishedRaceScheduleDay,
  getPublishedRaceScheduleEvent,
} from "../api/publicRaceScheduleApi";

export function usePublicRaceSchedule(dayId: string | null | undefined) {
  const { sandbox, fetch: pageFetch } = useOrganizationPageApi();
  return useQuery<PublicRaceScheduleDayResponse>({
    queryKey: [
      "public-race-schedule",
      dayId,
      ...(sandbox ? [sandbox.account] : []),
    ],

    enabled: !!dayId,

    queryFn: async () => {
      if (!dayId) {
        throw new Error("Race day ID is required.");
      }

      if (sandbox) {
        const res = await pageFetch(`/race-scheduling/public/days/${dayId}`);
        if (!res.ok) throw new Error("Private schedule unavailable");
        const json = await res.json();
        return json.data ?? json;
      }
      return getPublishedRaceScheduleDay(dayId);
    },

    gcTime: sandbox ? 0 : undefined,
    staleTime: 15 * 1000,

    refetchInterval: 30 * 1000,

    retry: false,
  });
}

export function usePublicEventRaceSchedule(
  eventSlug: string | null | undefined,
) {
  const { sandbox, fetch: pageFetch } = useOrganizationPageApi();
  return useQuery<PublicRaceScheduleEventResponse>({
    queryKey: [
      "public-event-race-schedule",
      eventSlug,
      ...(sandbox ? [sandbox.account] : []),
    ],

    enabled: !!eventSlug,

    queryFn: async () => {
      if (!eventSlug) {
        throw new Error("Event slug is required.");
      }

      if (sandbox) {
        const res = await pageFetch(
          `/race-scheduling/public/events/${eventSlug}`,
        );
        if (!res.ok) throw new Error("Private schedule unavailable");
        const json = await res.json();
        return json.data ?? json;
      }
      return getPublishedRaceScheduleEvent(eventSlug);
    },

    /**
     * Race control may republish an updated official order.
     *
     * Keep this responsive without excessively polling Cloud Run.
     */
    gcTime: sandbox ? 0 : undefined,
    staleTime: 15 * 1000,

    refetchInterval: 30 * 1000,

    refetchIntervalInBackground: false,

    refetchOnWindowFocus: true,

    retry: false,
  });
}
