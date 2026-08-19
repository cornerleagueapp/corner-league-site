import { useQuery } from "@tanstack/react-query";

import { getPublishedRaceScheduleDay } from "../api/publicRaceScheduleApi";

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
