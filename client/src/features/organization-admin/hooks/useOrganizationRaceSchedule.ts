import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addRaceScheduleBreak,
  generateRaceSchedule,
  getRaceScheduleDay,
  getRaceScheduleSettings,
  initializeRaceScheduleDay,
  mergeRaceScheduleSlots,
  moveRaceScheduleSlot,
  publishRaceSchedule,
  setRaceScheduleSlotLock,
  splitRaceScheduleSlot,
  unpublishRaceSchedule,
  updateRaceScheduleClassConfig,
  updateRaceScheduleSettings,
  validateRaceSchedule,
  validateRaceScheduleDetailed,
  saveRaceScheduleOrder,
} from "../api/organizationRaceScheduleApi";
import type {
  UpdateRaceScheduleClassConfigInput,
  UpdateRaceScheduleSettingsInput,
  SaveRaceScheduleOrderInput,
} from "../types/organizationRaceSchedule";

export function useRaceScheduleSettings(
  eventId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["race-schedule-settings", eventId],

    enabled: enabled && !!eventId,

    queryFn: async () => {
      if (!eventId) {
        throw new Error("Event ID is required.");
      }

      return getRaceScheduleSettings(eventId);
    },

    staleTime: 30 * 1000,

    retry: false,
  });
}

export function useRaceScheduleDay(dayId: string | null | undefined) {
  return useQuery({
    queryKey: ["race-schedule-day", dayId],

    enabled: !!dayId,

    queryFn: async () => {
      if (!dayId) {
        throw new Error("Race day ID is required.");
      }

      return getRaceScheduleDay(dayId);
    },

    staleTime: 10 * 1000,

    retry: false,
  });
}

export function useSaveRaceScheduleOrder(dayId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      input,
    }: {
      scheduleId: string;
      input: SaveRaceScheduleOrderInput;
    }) => saveRaceScheduleOrder(scheduleId, input),

    onSuccess: async () => {
      if (!dayId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["race-schedule-day", dayId],
      });
    },
  });
}

export function useInitializeRaceScheduleDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dayId: string) => initializeRaceScheduleDay(dayId),

    onSuccess: async (data, dayId) => {
      /**
       * Initialization already returns the complete normalized race-day
       * schedule response, so seed the cache immediately.
       */
      queryClient.setQueryData(["race-schedule-day", dayId], data);

      /**
       * Still invalidate afterward so the server remains the final source
       * of truth if anything changed during initialization.
       */
      await queryClient.invalidateQueries({
        queryKey: ["race-schedule-day", dayId],
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
      if (!eventId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["race-schedule-settings", eventId],
      });
    },
  });
}

export function useUpdateRaceScheduleClassConfig(
  dayId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classConfigId,
      input,
    }: {
      classConfigId: string;
      input: UpdateRaceScheduleClassConfigInput;
    }) => updateRaceScheduleClassConfig(classConfigId, input),

    onSuccess: async () => {
      if (!dayId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["race-schedule-day", dayId],
      });
    },
  });
}

export function useGenerateRaceSchedule(dayId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) => generateRaceSchedule(scheduleId),

    onSuccess: async () => {
      if (!dayId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["race-schedule-day", dayId],
      });
    },
  });
}

export function useValidateRaceSchedule() {
  return useMutation({
    mutationFn: (scheduleId: string) => validateRaceSchedule(scheduleId),
  });
}

function useInvalidateRaceScheduleDay(dayId: string | null | undefined) {
  const queryClient = useQueryClient();

  return async () => {
    if (!dayId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ["race-schedule-day", dayId],
    });
  };
}

export function useMoveRaceScheduleSlot(dayId: string | null | undefined) {
  const invalidate = useInvalidateRaceScheduleDay(dayId);

  return useMutation({
    mutationFn: ({
      slotId,
      displayOrder,
    }: {
      slotId: string;
      displayOrder: number;
    }) =>
      moveRaceScheduleSlot(slotId, {
        displayOrder,
      }),

    onSuccess: invalidate,
  });
}

export function useSetRaceScheduleSlotLock(dayId: string | null | undefined) {
  const invalidate = useInvalidateRaceScheduleDay(dayId);

  return useMutation({
    mutationFn: ({ slotId, isLocked }: { slotId: string; isLocked: boolean }) =>
      setRaceScheduleSlotLock(slotId, {
        isLocked,
      }),

    onSuccess: invalidate,
  });
}

export function useMergeRaceScheduleSlots(dayId: string | null | undefined) {
  const invalidate = useInvalidateRaceScheduleDay(dayId);

  return useMutation({
    mutationFn: ({
      targetSlotId,
      sourceSlotId,
    }: {
      targetSlotId: string;
      sourceSlotId: string;
    }) =>
      mergeRaceScheduleSlots(targetSlotId, {
        sourceSlotId,
      }),

    onSuccess: invalidate,
  });
}

export function useSplitRaceScheduleSlot(dayId: string | null | undefined) {
  const invalidate = useInvalidateRaceScheduleDay(dayId);

  return useMutation({
    mutationFn: ({
      slotId,
      slotClassId,
    }: {
      slotId: string;
      slotClassId: string;
    }) =>
      splitRaceScheduleSlot(slotId, {
        slotClassId,
      }),

    onSuccess: invalidate,
  });
}

export function useAddRaceScheduleBreak(dayId: string | null | undefined) {
  const invalidate = useInvalidateRaceScheduleDay(dayId);

  return useMutation({
    mutationFn: ({
      scheduleId,
      displayOrder,
      label,
      durationMinutes,
    }: {
      scheduleId: string;
      displayOrder: number;
      label: string;
      durationMinutes: number;
    }) =>
      addRaceScheduleBreak(scheduleId, {
        displayOrder,
        label,
        durationMinutes,
      }),

    onSuccess: invalidate,
  });
}

export function useValidateRaceScheduleDetailed() {
  return useMutation({
    mutationFn: (scheduleId: string) =>
      validateRaceScheduleDetailed(scheduleId),
  });
}

export function usePublishRaceSchedule(dayId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) => publishRaceSchedule(scheduleId),

    onSuccess: async () => {
      if (!dayId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["race-schedule-day", dayId],
      });
    },
  });
}

export function useUnpublishRaceSchedule(dayId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) => unpublishRaceSchedule(scheduleId),

    onSuccess: async () => {
      if (!dayId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["race-schedule-day", dayId],
      });
    },
  });
}
