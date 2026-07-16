import {
  demoEventRegistrations,
  demoRegistrationRacers,
} from "../data/registrationMockData";
import type {
  DemoRegistration,
  RegistrationDraft,
  RegistrationRacer,
} from "../types/registration.types";

const STORAGE_KEYS = {
  registrations: "cornerLeague.registrationDemo.registrations.v1",
  racers: "cornerLeague.registrationDemo.racers.v1",
  draftPrefix: "cornerLeague.registrationDemo.draft.v1",
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

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function loadDemoRegistrations(): DemoRegistration[] {
  if (!canUseStorage()) {
    return cloneValue(demoEventRegistrations);
  }

  const stored = safelyParseJson<DemoRegistration[] | null>(
    localStorage.getItem(STORAGE_KEYS.registrations),
    null,
  );

  if (Array.isArray(stored)) {
    return stored;
  }

  const initial = cloneValue(demoEventRegistrations);

  localStorage.setItem(STORAGE_KEYS.registrations, JSON.stringify(initial));

  return initial;
}

export function saveDemoRegistrations(registrations: DemoRegistration[]): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEYS.registrations,
    JSON.stringify(registrations),
  );
}

export function addDemoRegistration(
  registration: DemoRegistration,
): DemoRegistration[] {
  const current = loadDemoRegistrations();

  const next = [
    registration,
    ...current.filter((item) => item.id !== registration.id),
  ];

  saveDemoRegistrations(next);

  return next;
}

export function loadDemoRacers(): RegistrationRacer[] {
  if (!canUseStorage()) {
    return cloneValue(demoRegistrationRacers);
  }

  const stored = safelyParseJson<RegistrationRacer[] | null>(
    localStorage.getItem(STORAGE_KEYS.racers),
    null,
  );

  if (Array.isArray(stored)) {
    return stored;
  }

  const initial = cloneValue(demoRegistrationRacers);

  localStorage.setItem(STORAGE_KEYS.racers, JSON.stringify(initial));

  return initial;
}

export function saveDemoRacers(racers: RegistrationRacer[]): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.racers, JSON.stringify(racers));
}

export function addDemoRacer(racer: RegistrationRacer): RegistrationRacer[] {
  const current = loadDemoRacers();

  const next = [racer, ...current.filter((item) => item.id !== racer.id)];

  saveDemoRacers(next);

  return next;
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

export function resetRegistrationDemoData(): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.registrations);
  localStorage.removeItem(STORAGE_KEYS.racers);

  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (key?.startsWith(STORAGE_KEYS.draftPrefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
