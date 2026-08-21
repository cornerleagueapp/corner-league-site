import { apiRequest } from "@/lib/apiClient";
import type {
  AddRaceScheduleBreakInput,
  MergeRaceScheduleSlotsInput,
  MoveRaceScheduleSlotInput,
  RaceScheduleDayResponse,
  RaceScheduleGenerationResult,
  RaceSchedulePublishResult,
  RaceScheduleSettings,
  RaceScheduleUnpublishResult,
  RaceScheduleValidationResult,
  SetRaceScheduleSlotLockInput,
  SplitRaceScheduleSlotInput,
  UpdateRaceScheduleClassConfigInput,
  UpdateRaceScheduleSettingsInput,
  SaveRaceScheduleOrderInput,
} from "../types/organizationRaceSchedule";

type ApiEnvelope<T> = {
  status?: boolean;
  statusCode?: number;
  path?: string;
  message?: string;
  data?: T;
  result?: T;
  timestamp?: string;
};

function unwrap<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === "object") {
    const envelope = response as ApiEnvelope<T>;

    if (envelope.data !== undefined) {
      return envelope.data;
    }

    if (envelope.result !== undefined) {
      return envelope.result;
    }
  }

  return response as T;
}

/**
 * The race-scheduling backend currently returns schedule details as the
 * root object rather than:
 *
 * {
 *   schedule: {...},
 *   eventDay: {...},
 *   classConfigs: [...]
 * }
 *
 * Normalize both response formats here so every frontend consumer receives
 * the same RaceScheduleDayResponse shape.
 */
function normalizeRaceScheduleDayResponse(
  response: unknown,
): RaceScheduleDayResponse {
  const data: any = unwrap<any>(response as any);

  /**
   * Support either:
   *
   * 1. Wrapped schedule response
   *    {
   *      schedule: {...},
   *      eventDay: {...},
   *      classConfigs: [...]
   *    }
   *
   * 2. Schedule returned directly
   *    {
   *      id: "...",
   *      eventDay: {...},
   *      classConfigs: [...],
   *      slots: [...]
   *    }
   */
  const schedule =
    data?.schedule ??
    (data?.id
      ? {
          ...data,
          /**
           * Avoid recursively embedding the entire response if a future
           * backend response contains its own schedule property.
           */
          schedule: undefined,
        }
      : null);

  return {
    eventDay: data?.eventDay ?? data?.day ?? schedule?.eventDay ?? null,

    schedule,

    classConfigs:
      data?.classConfigs ?? data?.classes ?? schedule?.classConfigs ?? [],

    settings: data?.settings ?? schedule?.settings ?? null,

    minimumRestRaceGap:
      data?.minimumRestRaceGap ?? schedule?.minimumRestRaceGap,
  };
}

export async function getRaceScheduleSettings(
  eventId: string,
): Promise<RaceScheduleSettings> {
  const response = await apiRequest<
    RaceScheduleSettings | ApiEnvelope<RaceScheduleSettings>
  >(
    "GET",
    `/race-scheduling/admin/events/${encodeURIComponent(eventId)}/settings`,
    undefined,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function updateRaceScheduleSettings(
  eventId: string,
  input: UpdateRaceScheduleSettingsInput,
): Promise<RaceScheduleSettings> {
  const response = await apiRequest<
    RaceScheduleSettings | ApiEnvelope<RaceScheduleSettings>
  >(
    "PATCH",
    `/race-scheduling/admin/events/${encodeURIComponent(eventId)}/settings`,
    input,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function initializeRaceScheduleDay(
  dayId: string,
): Promise<RaceScheduleDayResponse> {
  const response = await apiRequest<any>(
    "POST",
    `/race-scheduling/admin/days/${encodeURIComponent(dayId)}/initialize`,
    {},
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return normalizeRaceScheduleDayResponse(response);
}

export async function getRaceScheduleDay(
  dayId: string,
): Promise<RaceScheduleDayResponse> {
  const response = await apiRequest<any>(
    "GET",
    `/race-scheduling/admin/days/${encodeURIComponent(dayId)}`,
    undefined,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return normalizeRaceScheduleDayResponse(response);
}

export async function updateRaceScheduleClassConfig(
  classConfigId: string,
  input: UpdateRaceScheduleClassConfigInput,
) {
  const response = await apiRequest(
    "PATCH",
    `/race-scheduling/admin/class-configs/${encodeURIComponent(classConfigId)}`,
    input,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function generateRaceSchedule(
  scheduleId: string,
): Promise<RaceScheduleGenerationResult> {
  const response = await apiRequest<
    RaceScheduleGenerationResult | ApiEnvelope<RaceScheduleGenerationResult>
  >(
    "POST",
    `/race-scheduling/admin/schedules/${encodeURIComponent(
      scheduleId,
    )}/generate`,
    {},
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function validateRaceSchedule(scheduleId: string) {
  const response = await apiRequest(
    "POST",
    `/race-scheduling/admin/schedules/${encodeURIComponent(
      scheduleId,
    )}/validate`,
    {},
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function moveRaceScheduleSlot(
  slotId: string,
  input: MoveRaceScheduleSlotInput,
) {
  const response = await apiRequest(
    "PATCH",
    `/race-scheduling/admin/slots/${encodeURIComponent(slotId)}/move`,
    input,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function saveRaceScheduleOrder(
  scheduleId: string,
  input: SaveRaceScheduleOrderInput,
) {
  const response = await apiRequest(
    "PATCH",
    `/race-scheduling/admin/schedules/${encodeURIComponent(scheduleId)}/order`,
    input,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function setRaceScheduleSlotLock(
  slotId: string,
  input: SetRaceScheduleSlotLockInput,
) {
  const response = await apiRequest(
    "PATCH",
    `/race-scheduling/admin/slots/${encodeURIComponent(slotId)}/lock`,
    input,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function mergeRaceScheduleSlots(
  targetSlotId: string,
  input: MergeRaceScheduleSlotsInput,
) {
  const response = await apiRequest(
    "POST",
    `/race-scheduling/admin/slots/${encodeURIComponent(targetSlotId)}/merge`,
    input,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function splitRaceScheduleSlot(
  slotId: string,
  input: SplitRaceScheduleSlotInput,
) {
  const response = await apiRequest(
    "POST",
    `/race-scheduling/admin/slots/${encodeURIComponent(slotId)}/split`,
    input,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function addRaceScheduleBreak(
  scheduleId: string,
  input: AddRaceScheduleBreakInput,
) {
  const response = await apiRequest(
    "POST",
    `/race-scheduling/admin/schedules/${encodeURIComponent(scheduleId)}/breaks`,
    input,
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function validateRaceScheduleDetailed(
  scheduleId: string,
): Promise<RaceScheduleValidationResult> {
  const response = await apiRequest<
    RaceScheduleValidationResult | ApiEnvelope<RaceScheduleValidationResult>
  >(
    "POST",
    `/race-scheduling/admin/schedules/${encodeURIComponent(
      scheduleId,
    )}/validate`,
    {},
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function publishRaceSchedule(
  scheduleId: string,
): Promise<RaceSchedulePublishResult> {
  const response = await apiRequest<
    RaceSchedulePublishResult | ApiEnvelope<RaceSchedulePublishResult>
  >(
    "POST",
    `/race-scheduling/admin/schedules/${encodeURIComponent(
      scheduleId,
    )}/publish`,
    {},
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function unpublishRaceSchedule(
  scheduleId: string,
): Promise<RaceScheduleUnpublishResult> {
  const response = await apiRequest<
    RaceScheduleUnpublishResult | ApiEnvelope<RaceScheduleUnpublishResult>
  >(
    "POST",
    `/race-scheduling/admin/schedules/${encodeURIComponent(
      scheduleId,
    )}/unpublish`,
    {},
    {
      refreshOn401: true,
      logoutOn401: true,
    },
  );

  return unwrap(response);
}
