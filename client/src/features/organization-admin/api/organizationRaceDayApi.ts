import { apiRequest } from "@/lib/apiClient";

import type {
  RegistrationAdminEventConfiguration,
  UpdateRegistrationClassInput,
  UpdateRegistrationDayInput,
} from "../types/organizationRaceDay";

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

export async function getRegistrationEventConfiguration(
  eventId: string,
): Promise<RegistrationAdminEventConfiguration> {
  const response = await apiRequest<
    | RegistrationAdminEventConfiguration
    | ApiEnvelope<RegistrationAdminEventConfiguration>
  >(
    "GET",
    `/registration/admin/events/${encodeURIComponent(eventId)}/configuration`,
    undefined,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function updateRegistrationEventDay(
  dayId: string,
  input: UpdateRegistrationDayInput,
) {
  const response = await apiRequest(
    "PATCH",
    `/registration/admin/days/${encodeURIComponent(dayId)}`,
    input,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function updateRegistrationEventClass(
  classId: string,
  input: UpdateRegistrationClassInput,
) {
  const response = await apiRequest(
    "PATCH",
    `/registration/admin/classes/${encodeURIComponent(classId)}`,
    input,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}
