import { apiRequest } from "@/lib/apiClient";

import type {
  OrganizationEventSummary,
  OrganizationRegistrationList,
  RegistrationAdminEntry,
} from "../types/organizationRegistration";

type ApiEnvelope<T> = {
  status?: boolean;

  statusCode?: number;

  path?: string;

  message?: string;

  data?: T;

  result?: T;

  timestamp?: string;
};

function unwrap<T>(value: T | ApiEnvelope<T>): T {
  if (value && typeof value === "object") {
    const envelope = value as ApiEnvelope<T>;

    if (envelope.data !== undefined) {
      return envelope.data;
    }

    if (envelope.result !== undefined) {
      return envelope.result;
    }
  }

  return value as T;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getOrganizationEvents(
  organizationId: string,
): Promise<OrganizationEventSummary[]> {
  const response = await apiRequest<any>(
    "GET",
    `/sport-event/organization/${encodeURIComponent(
      organizationId,
    )}?page=1&limit=25&order=ASC`,
    undefined,
    {
      refreshOn401: false,

      logoutOn401: false,
    },
  );

  const body = unwrap<any>(response);

  const candidates =
    body?.sportEvents ??
    body?.events ??
    body?.data?.sportEvents ??
    body?.data?.events ??
    body?.data ??
    body;

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.map(
    (event: any): OrganizationEventSummary => ({
      id: String(event.id),

      name: String(event.name ?? "Untitled Event"),

      description: event.description ?? null,

      location: event.location ?? null,

      startDate: event.startDate ?? event.start_date ?? null,

      endDate: event.endDate ?? event.end_date ?? null,

      organizer: event.organizer
        ? {
            id: String(event.organizer.id),

            name: event.organizer.name ?? null,

            abbreviation: event.organizer.abbreviation ?? null,
          }
        : null,
    }),
  );
}

export async function getAdminEventRegistrations(
  eventId: string,
): Promise<OrganizationRegistrationList> {
  const response = await apiRequest<any>(
    "GET",
    `/registration/admin/events/${encodeURIComponent(
      eventId,
    )}/registrations?page=1&limit=50`,
    undefined,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  const body = unwrap<any>(response);

  const possibleItems =
    body?.registrations ?? body?.items ?? body?.data ?? body?.results ?? body;

  const registrations: RegistrationAdminEntry[] = Array.isArray(possibleItems)
    ? possibleItems
    : [];

  const total = asNumber(
    body?.total ??
      body?.itemCount ??
      body?.meta?.itemCount ??
      body?.pagination?.total ??
      registrations.length,
    registrations.length,
  );

  const page = asNumber(
    body?.page ?? body?.meta?.page ?? body?.pagination?.page ?? 1,
    1,
  );

  const limit = asNumber(
    body?.limit ?? body?.meta?.limit ?? body?.pagination?.limit ?? 50,
    50,
  );

  const pageCount = asNumber(
    body?.pageCount ??
      body?.meta?.pageCount ??
      body?.pagination?.pageCount ??
      Math.max(1, Math.ceil(total / Math.max(limit, 1))),
    1,
  );

  return {
    registrations,

    total,

    page,

    limit,

    pageCount,
  };
}
