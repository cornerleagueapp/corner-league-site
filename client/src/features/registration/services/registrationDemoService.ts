import {
  demoRegistrationEvents,
  demoRegistrationOrganizations,
} from "../data/registrationMockData";
import {
  addDemoRacer,
  addDemoRegistration,
  loadDemoRacers,
  loadDemoRegistrations,
} from "../utils/registrationStorage";
import type {
  DemoRegistration,
  NewRegistrationRacerInput,
  PublicRegisteredRacer,
  RegistrationEvent,
  RegistrationOrganization,
  RegistrationPricingSummary,
  RegistrationRacer,
} from "../types/registration.types";

const DEMO_DELAY_MS = 250;

function wait(ms = DEMO_DELAY_MS) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function normalizeSearchValue(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function createDemoId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getRegistrationOrganizations(): Promise<
  RegistrationOrganization[]
> {
  await wait();

  return [...demoRegistrationOrganizations];
}

export async function getRegistrationOrganizationBySlug(
  slug: string,
): Promise<RegistrationOrganization | null> {
  await wait();

  const normalizedSlug = normalizeSearchValue(slug);

  return (
    demoRegistrationOrganizations.find(
      (organization) =>
        normalizeSearchValue(organization.slug) === normalizedSlug,
    ) ?? null
  );
}

export async function searchRegistrationOrganizations(
  query: string,
): Promise<RegistrationOrganization[]> {
  await wait();

  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return [...demoRegistrationOrganizations];
  }

  return demoRegistrationOrganizations.filter((organization) => {
    return [
      organization.name,
      organization.abbreviation,
      organization.city,
      organization.stateCode,
      organization.countryCode,
    ].some((value) => normalizeSearchValue(value).includes(normalizedQuery));
  });
}

export async function getRegistrationEvents(): Promise<RegistrationEvent[]> {
  await wait();

  return [...demoRegistrationEvents].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

export async function getRegistrationEventBySlug(
  eventSlug: string,
): Promise<RegistrationEvent | null> {
  await wait();

  const normalizedSlug = normalizeSearchValue(eventSlug);

  return (
    demoRegistrationEvents.find(
      (event) => normalizeSearchValue(event.slug) === normalizedSlug,
    ) ?? null
  );
}

export async function getRegistrationEventsForOrganization(
  organizationId: string,
): Promise<RegistrationEvent[]> {
  await wait();

  return demoRegistrationEvents
    .filter((event) => event.organizationId === organizationId)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
}

export async function searchRegistrationEvents(
  query: string,
): Promise<RegistrationEvent[]> {
  await wait();

  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return getRegistrationEvents();
  }

  return demoRegistrationEvents.filter((event) => {
    return [
      event.name,
      event.organizationName,
      event.organizationAbbreviation,
      event.city,
      event.stateCode,
      event.countryCode,
      event.formattedLocation,
    ].some((value) => normalizeSearchValue(value).includes(normalizedQuery));
  });
}

export async function searchRegistrationRacers(
  query: string,
): Promise<RegistrationRacer[]> {
  await wait(150);

  const racers = loadDemoRacers();
  const normalizedQuery = normalizeSearchValue(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return racers
    .filter((racer) => {
      return [
        racer.name,
        racer.nickname,
        racer.raceNumber,
        racer.teamName,
        racer.city,
        racer.stateCode,
        racer.countryCode,
        racer.formattedLocation,
      ].some((value) => normalizeSearchValue(value).includes(normalizedQuery));
    })
    .slice(0, 20);
}

export async function createDemoRegistrationRacer(
  input: NewRegistrationRacerInput,
): Promise<RegistrationRacer> {
  await wait();

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required.");
  }

  if (!input.city.trim() || !input.countryCode.trim()) {
    throw new Error("City and country are required.");
  }

  const racer: RegistrationRacer = {
    id: createDemoId("demo-racer"),
    name: `${firstName} ${lastName}`.trim(),
    nickname: input.nickname?.trim() || null,
    imageUrl: null,

    city: input.city.trim(),
    stateCode: input.stateCode?.trim() || null,
    countryCode: input.countryCode.trim().toUpperCase(),

    formattedLocation: [
      input.city.trim(),
      input.stateCode?.trim(),
      input.countryCode.trim().toUpperCase(),
    ]
      .filter(Boolean)
      .join(", "),

    raceNumber: input.raceNumber?.trim() || null,
    teamName: null,

    isDemoCreated: true,
  };

  addDemoRacer(racer);

  return racer;
}

export function calculateRegistrationPricing(
  event: RegistrationEvent,
  selectedClassPrices: number[],
): RegistrationPricingSummary {
  const classSubtotal = selectedClassPrices.reduce(
    (total, amount) => total + Number(amount || 0),
    0,
  );

  const platformFee = selectedClassPrices.length > 0 ? event.platformFee : 0;

  const processingFee =
    selectedClassPrices.length > 0 ? event.processingFee : 0;

  return {
    classSubtotal,
    platformFee,
    processingFee,
    total: classSubtotal + platformFee + processingFee,
  };
}

export async function submitDemoRegistration(
  input: Omit<DemoRegistration, "id" | "createdAt" | "updatedAt">,
): Promise<DemoRegistration> {
  await wait(900);

  const now = new Date().toISOString();

  const registration: DemoRegistration = {
    ...input,
    id: createDemoId("demo-registration"),
    createdAt: now,
    updatedAt: now,
  };

  addDemoRegistration(registration);

  return registration;
}

export async function getPublicRegisteredRacers(
  eventId: string,
): Promise<PublicRegisteredRacer[]> {
  await wait();

  return loadDemoRegistrations()
    .filter(
      (registration) =>
        registration.eventId === eventId && registration.status === "confirmed",
    )
    .map((registration) => ({
      registrationId: registration.id,
      racer: registration.racer,
      selectedClasses: registration.selectedClasses,
      status: "confirmed" as const,
      registeredAt: registration.createdAt,
    }))
    .sort((a, b) => a.racer.name.localeCompare(b.racer.name));
}

export async function getDemoRegistrationsForUser(
  userId?: string | null,
): Promise<DemoRegistration[]> {
  await wait();

  if (!userId) {
    return [];
  }

  return loadDemoRegistrations()
    .filter((registration) => registration.registeredByUserId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getDemoRegistrationById(
  registrationId: string,
): Promise<DemoRegistration | null> {
  await wait();

  return (
    loadDemoRegistrations().find(
      (registration) => registration.id === registrationId,
    ) ?? null
  );
}
