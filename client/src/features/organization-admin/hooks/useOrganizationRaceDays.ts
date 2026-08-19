import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getRegistrationEventConfiguration,
  updateRegistrationEventClass,
  updateRegistrationEventDay,
} from "../api/organizationRaceDayApi";

import type {
  UpdateRegistrationClassInput,
  UpdateRegistrationDayInput,
} from "../types/organizationRaceDay";

export function useRegistrationEventConfiguration(
  eventId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["organization-registration-configuration", eventId],

    enabled: !!eventId,

    queryFn: async () => {
      if (!eventId) {
        throw new Error("Event ID is required.");
      }

      return getRegistrationEventConfiguration(eventId);
    },

    staleTime: 30 * 1000,

    retry: false,
  });
}

export function useUpdateRegistrationDay(eventId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dayId,
      input,
    }: {
      dayId: string;

      input: UpdateRegistrationDayInput;
    }) => updateRegistrationEventDay(dayId, input),

    onSuccess: async () => {
      if (!eventId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["organization-registration-configuration", eventId],
      });
    },
  });
}

export function useUpdateRegistrationClass(eventId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      input,
    }: {
      classId: string;

      input: UpdateRegistrationClassInput;
    }) => updateRegistrationEventClass(classId, input),

    onSuccess: async () => {
      if (!eventId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["organization-registration-configuration", eventId],
      });
    },
  });
}
