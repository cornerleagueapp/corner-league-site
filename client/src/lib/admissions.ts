import { apiFetch } from "./apiClient";
import { unwrapSportData } from "./sportRegistration";
export type AdmissionType = {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  capacity: number;
  issued: number;
  priceCents: number;
  currency: string;
  salesStart: string;
  salesEnd: string;
  entryStart: string;
  entryEnd: string;
};
export type AdmissionEvent = {
  key: string;
  name: string;
  location: string;
  startsAt: string;
  endsAt: string;
  organizationName: string;
};
export type Ticket = {
  id: string;
  status: "valid" | "checked_in" | "cancelled";
  checkedInAt: string | null;
  createdAt: string;
  snapshot: {
    eventName: string;
    location: string;
    organizationName: string;
    typeName: string;
    description: string;
    coverUrl: string | null;
    startsAt: string;
    endsAt: string;
    eventKey: string;
  };
  qr?: string | null;
  entryStart?: string | null;
  entryEnd?: string | null;
  entryState?: string;
};
export function admissionRequestId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const a = crypto.getRandomValues(new Uint8Array(16));
  a[6] = (a[6] & 15) | 64;
  a[8] = (a[8] & 63) | 128;
  const h = Array.from(a, (v) => v.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export async function admissionData<T>(
  path: string,
  body?: unknown,
  sandboxId?: string,
) {
  const requestPath = sandboxId
    ? `/sandbox/organizations/${encodeURIComponent(sandboxId)}/request`
    : path;
  const res = await apiFetch(requestPath, {
    method: sandboxId || body ? "POST" : "GET",
    ...(sandboxId
      ? { body: { path, method: body ? "POST" : "GET", body } }
      : body
        ? { body }
        : {}),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(
      typeof json?.message === "string"
        ? json.message
        : "Tickets could not load. Please try again.",
    );
  return unwrapSportData(json) as T;
}
export function admissionAvailability(t: AdmissionType, now = Date.now()) {
  if (t.priceCents > 0) return "Paid checkout coming soon";
  if (t.issued >= t.capacity) return "Sold out";
  if (now < Date.parse(t.salesStart)) return "Reservations open soon";
  if (now > Date.parse(t.salesEnd)) return "Reservations closed";
  return "Reserve free pass";
}
export const admissionKey = (key: string) => encodeURIComponent(key);
