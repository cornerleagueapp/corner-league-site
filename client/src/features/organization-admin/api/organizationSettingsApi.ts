import { apiRequest } from "@/lib/apiClient";

import type {
  RaceScheduleSettings,
  RegistrationEventSettings,
  UpdateRaceScheduleSettingsInput,
  UpdateRegistrationEventSettingsInput,
} from "../types/organizationSettings";

type ApiEnvelope<T> = {
  status?: boolean;
  statusCode?: number;
  data?: T;
  result?: T;
  message?: string;
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

export async function getRegistrationEventConfiguration(eventId: string) {
  const response = await apiRequest(
    "GET",
    `/registration/admin/events/${encodeURIComponent(eventId)}/configuration`,
  );

  return unwrap<any>(response);
}

export async function updateRegistrationEventSettings(
  eventId: string,
  input: UpdateRegistrationEventSettingsInput,
): Promise<RegistrationEventSettings> {
  const response = await apiRequest(
    "PATCH",
    `/registration/admin/events/${encodeURIComponent(eventId)}/settings`,
    input,
  );

  return unwrap(response);
}

export async function getRaceScheduleSettings(
  eventId: string,
): Promise<RaceScheduleSettings> {
  const response = await apiRequest(
    "GET",
    `/race-scheduling/admin/events/${encodeURIComponent(eventId)}/settings`,
  );

  return unwrap(response);
}

export async function updateRaceScheduleSettings(
  eventId: string,
  input: UpdateRaceScheduleSettingsInput,
): Promise<RaceScheduleSettings> {
  const response = await apiRequest(
    "PATCH",
    `/race-scheduling/admin/events/${encodeURIComponent(eventId)}/settings`,
    input,
  );

  return unwrap(response);
}
