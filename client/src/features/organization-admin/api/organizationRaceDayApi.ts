import { apiRequest } from "@/lib/apiClient";
import type {
  CreateRegistrationClassInput,
  CreateRegistrationDayInput,
  RegistrationAdminEventConfiguration,
  RegistrationDivisionOption,
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

export async function getRegistrationEventDivisions(
  eventId: string,
): Promise<RegistrationDivisionOption[]> {
  const response = await apiRequest(
    "GET",
    `/sport-event/division/event/${encodeURIComponent(eventId)}?page=1&limit=100`,
    undefined,
    {
      refreshOn401: true,
      logoutOn401: false,
    },
  );

  const body: any = unwrap(response);

  const divisions =
    body?.divisions ?? body?.data?.divisions ?? body?.data ?? body;

  return Array.isArray(divisions) ? divisions : [];
}

export async function createRegistrationEventDay(
  eventId: string,
  input: CreateRegistrationDayInput,
) {
  const response = await apiRequest(
    "POST",
    `/registration/admin/events/${encodeURIComponent(eventId)}/days`,
    input,
    {
      refreshOn401: true,
      logoutOn401: false,
    },
  );

  return unwrap(response);
}

export async function createRegistrationEventClass(
  eventId: string,
  input: CreateRegistrationClassInput,
) {
  const response = await apiRequest(
    "POST",
    `/registration/admin/events/${encodeURIComponent(eventId)}/classes`,
    input,
    {
      refreshOn401: true,
      logoutOn401: false,
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
