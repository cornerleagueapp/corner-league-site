import type { RegistrationDraft } from "../types/registration.types";

const STORAGE_KEYS = {
  draftPrefix: "cornerLeague.registration.draft.v2",
} as const;

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safelyParseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getDraftStorageKey(eventSlug: string) {
  return `${STORAGE_KEYS.draftPrefix}.${eventSlug}`;
}

export function loadRegistrationDraft(
  eventSlug: string,
): RegistrationDraft | null {
  if (!canUseStorage()) {
    return null;
  }

  return safelyParseJson<RegistrationDraft | null>(
    localStorage.getItem(getDraftStorageKey(eventSlug)),
    null,
  );
}

export function saveRegistrationDraft(draft: RegistrationDraft): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(
    getDraftStorageKey(draft.eventSlug),
    JSON.stringify(draft),
  );
}

export function clearRegistrationDraft(eventSlug: string): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(getDraftStorageKey(eventSlug));
}
