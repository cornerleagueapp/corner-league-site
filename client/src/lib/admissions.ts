import type { StudioDesign } from "./ticket-design";
export type PassDesign = StudioDesign;
import { apiFetch } from "./apiClient";
import { unwrapSportData } from "./sportRegistration";
export type AdmissionType = {
  coverage?: { key: string; startsAt: string; endsAt: string }[] | null;
  design?: PassDesign | null;
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  revision: number;
  taxBps?: number;
  reserved?: number;
  paidCheckoutReady?: boolean;
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
  organizationId?: string;
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
    guestName?: string;
    design?: PassDesign | null;
    accentColor?: string;
    passLabel?: string;
    passInstructions?: string;
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
  if (t.priceCents > 0 && !t.paidCheckoutReady)
    return "Online payments unavailable";
  if (t.issued + (t.reserved || 0) >= t.capacity) return "Sold out";
  if (now < Date.parse(t.salesStart)) return "Reservations open soon";
  if (now > Date.parse(t.salesEnd)) return "Reservations closed";
  return t.priceCents > 0 ? "Buy tickets" : "Reserve free pass";
}
export function isAdmissionBookable(t: AdmissionType, now = Date.now()) {
  const status = admissionAvailability(t, now);
  return status === "Reserve free pass" || status === "Buy tickets";
}
export const admissionKey = (key: string) => encodeURIComponent(key);

export async function saveAdmissionWallet(
  id: string,
  provider: "apple" | "google",
  popup?: Window | null,
) {
  const response = await apiFetch(
    `/admissions/me/tickets/${encodeURIComponent(id)}/wallet/${provider}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.message || "Unable to save your pass. Please try again.",
    );
  }
  if (provider === "google") {
    const data = unwrapSportData(await response.json()) as { url?: string };
    if (!data.url?.startsWith("https://pay.google.com/gp/v/save/"))
      throw new Error("Wallet link is unavailable.");
    if (popup) popup.location.replace(data.url);
    else window.location.assign(data.url);
  } else {
    const blob = await response.blob();
    if (
      !blob.size ||
      !response.headers
        .get("content-type")
        ?.includes("application/vnd.apple.pkpass")
    )
      throw new Error("Wallet pass is unavailable.");
    const href = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = href;
    a.download = `cornerleague-${id}.pkpass`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60000);
  }
}
