import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRegistrationEventClass,
  createRegistrationEventDay,
  getRegistrationEventConfiguration,
  getRegistrationEventDivisions,
  updateRegistrationEventClass,
  updateRegistrationEventDay,
} from "../api/organizationRaceDayApi";
import type {
  CreateRegistrationClassInput,
  CreateRegistrationDayInput,
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

export function useRegistrationEventDivisions(
  eventId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["organization-registration-divisions", eventId],

    enabled: enabled && !!eventId,

    queryFn: async () => {
      if (!eventId) {
        throw new Error("Event ID is required.");
      }

      return getRegistrationEventDivisions(eventId);
    },

    staleTime: 30 * 1000,

    retry: false,
  });
}

export function useCreateRegistrationDay(eventId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRegistrationDayInput) => {
      if (!eventId) {
        throw new Error("Event ID is required.");
      }

      return createRegistrationEventDay(eventId, input);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["organization-registration-configuration", eventId],
      });
    },
  });
}

export function useCreateRegistrationClass(eventId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRegistrationClassInput) => {
      if (!eventId) {
        throw new Error("Event ID is required.");
      }

      return createRegistrationEventClass(eventId, input);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["organization-registration-configuration", eventId],
      });
    },
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
