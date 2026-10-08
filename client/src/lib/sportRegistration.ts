import { apiFetch, apiRequest } from "./apiClient";
export const racingSportKeys = [
  "motocross",
  "boat-racing",
  "onewheel-racing",
  "rc-racing",
  "track-running",
  "marathon",
] as const;
export function isRacingSport(key: string): boolean {
  return (racingSportKeys as readonly string[]).includes(key);
}
export const sportEquipmentLabels: Record<string, string> = {
  "track-running": "Footwear or accessibility needs (optional)",
  marathon: "Footwear or accessibility needs (optional)",
  motocross: "Motorcycle make, model and engine size",
  "boat-racing": "Boat make, model and engine",
  "onewheel-racing": "Board model and setup",
  "rc-racing": "RC vehicle, scale and power system",
};
export const sportLabels: Record<string, string> = {
  "track-running": "Track & running",
  marathon: "Marathon",
  motocross: "Motocross",
  "boat-racing": "Boat racing",
  "onewheel-racing": "Onewheel racing",
  "rc-racing": "RC racing",
};
export type SportAthlete = {
  id: string;
  sportKey: string;
  name: string;
  nickname: string;
  skillLevel: string;
  bio: string;
  location: string;
  competitorNumber: string;
  equipmentDescription?: string;
  dateOfBirth?: string;
  ownerId?: string;
  ownerUsername?: string;
  ownershipVerified?: boolean;
  profileUrl?: string;
};
export type AthleteInput = {
  sportKey: string;
  name: string;
  nickname: string;
  dateOfBirth: string;
  skillLevel: string;
  bio: string;
  location: string;
  competitorNumber: string;
  equipmentDescription: string;
};
export type SportEntry = { classId: string; dates: string[] };
export type RacingClass = {
  id: string;
  name: string;
  description: string;
  dates: string[];
  priceCents: number;
  pricePerDay: boolean;
  capacity: number | null;
  reservedCount: number;
  minimumAge: number | null;
  maximumAge: number | null;
  skillLevels: string[];
  enabled: boolean;
  distanceMeters?: number | null;
};
export type SportConfig = {
  eventId: string;
  sportKey: string;
  open: boolean;
  settings: {
    termsText: string;
    version: number;
    currency: string;
    allowCash: boolean;
    publicRoster: boolean;
    opensAt: string | null;
    closesAt: string | null;
  } | null;
  classes: RacingClass[];
};
export type RacingRegistration = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  entries: {
    classId: string;
    name: string;
    dates: string[];
    totalCents: number;
  }[];
  event?: {
    id: string;
    name: string;
    sportKey: string;
    organizationId: string;
  };
};
export function unwrapSportData<T>(json: unknown): T {
  if (!json || typeof json !== "object")
    throw new Error("Invalid registration response.");
  const value = json as { data?: T; status?: boolean };
  if (value.status === false) throw new Error("Registration request failed.");
  return (value.data ?? json) as T;
}
export async function publicSportData<T>(path: string): Promise<T> {
  const response = await apiFetch(path, { skipAuth: true, noRefresh: true });
  if (!response.ok) throw new Error("This sport information is unavailable.");
  return unwrapSportData<T>(await response.json());
}
export async function mySportAthletes(): Promise<SportAthlete[]> {
  const profiles = unwrapSportData<SportAthlete[]>(
    await apiRequest("GET", "/sport-registration/profiles/me"),
  );
  if (
    !Array.isArray(profiles) ||
    profiles.some((p) => !isRacingSport(p.sportKey) || typeof p.id !== "string")
  )
    throw new Error("Invalid athlete profile response.");
  return profiles;
}
export async function getSportConfig(
  eventId: string,
  sportKey: string,
): Promise<SportConfig> {
  const config = await publicSportData<SportConfig>(
    `/sport-registration/events/${encodeURIComponent(eventId)}`,
  );
  if (
    config.eventId !== eventId ||
    config.sportKey !== sportKey ||
    !Array.isArray(config.classes)
  )
    throw new Error("Registration does not match this event and sport.");
  return config;
}
export function estimateSportTotal(
  classes: RacingClass[],
  entries: SportEntry[],
): number {
  return entries.reduce((sum, e) => {
    const row = classes.find((c) => c.id === e.classId);
    if (!row || !e.dates.length || e.dates.some((d) => !row.dates.includes(d)))
      throw new Error("Select valid class dates.");
    return sum + row.priceCents * (row.pricePerDay ? e.dates.length : 1);
  }, 0);
}
export async function submitSportRegistration(
  eventId: string,
  input: {
    quotedTotalCents: number;
    clientRequestId: string;
    profileId: string;
    contactEmail: string;
    contactPhone: string;
    termsAccepted: boolean;
    termsVersion: number;
    entries: SportEntry[];
  },
): Promise<RacingRegistration> {
  return unwrapSportData<RacingRegistration>(
    await apiRequest(
      "POST",
      `/sport-registration/events/${encodeURIComponent(eventId)}/registrations`,
      input,
      { refreshOn401: true },
    ),
  );
}
export async function saveSportAthlete(
  input: AthleteInput,
): Promise<SportAthlete> {
  return unwrapSportData<SportAthlete>(
    await apiRequest("POST", "/sport-registration/profiles/me", input, {
      refreshOn401: true,
    }),
  );
}
export async function sandboxSportData<T>(
  id: string,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await apiFetch(
    `/sandbox/organizations/${encodeURIComponent(id)}/request`,
    {
      method: "POST",
      noRefresh: true,
      cache: "no-store",
      body: { path, method, body },
    },
  );
  const json = await response.json();
  if (!response.ok) throw new Error(json.message ?? "Sandbox request failed.");
  return unwrapSportData<T>(json);
}
export function registrationReturnPath(
  path: string | null,
): string | undefined {
  return path &&
    /^\/sports\/(motocross|boat-racing|onewheel-racing|rc-racing|track-running|marathon)\/organizations\/[a-zA-Z0-9-]+\?event=[a-zA-Z0-9-]+$/.test(
      path,
    )
    ? path
    : undefined;
}
