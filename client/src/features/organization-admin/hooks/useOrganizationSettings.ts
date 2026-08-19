import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getRaceScheduleSettings,
  getRegistrationEventConfiguration,
  updateRaceScheduleSettings,
  updateRegistrationEventSettings,
} from "../api/organizationSettingsApi";

import type {
  UpdateRaceScheduleSettingsInput,
  UpdateRegistrationEventSettingsInput,
} from "../types/organizationSettings";

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
  });
}

export function useRaceScheduleSettings(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["race-schedule-settings", eventId],

    enabled: !!eventId,

    queryFn: async () => {
      if (!eventId) {
        throw new Error("Event ID is required.");
      }

      return getRaceScheduleSettings(eventId);
    },
  });
}

export function useUpdateRegistrationEventSettings(
  eventId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRegistrationEventSettingsInput) => {
      if (!eventId) {
        throw new Error("Event ID is required.");
      }

      return updateRegistrationEventSettings(eventId, input);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["organization-registration-configuration", eventId],
      });
    },
  });
}

export function useUpdateRaceScheduleSettings(
  eventId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRaceScheduleSettingsInput) => {
      if (!eventId) {
        throw new Error("Event ID is required.");
      }

      return updateRaceScheduleSettings(eventId, input);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["race-schedule-settings", eventId],
      });
    },
  });
}
