import { apiFetch } from "@/lib/apiClient";

import type { RegistrationRacer } from "../types/registration.types";

export type CreateRegistrationRacerInput = {
  firstName: string;
  lastName: string;

  nickname?: string;

  city: string;
  stateCode?: string;
  countryCode: string;
};

type CreateAthleteResponse = {
  message?: string;

  athlete: {
    id: string;

    name: string;

    nickname?: string | null;

    imageUrl?: string | null;
    image?: string | null;

    origin?: string | null;

    city?: string | null;
    stateCode?: string | null;
    countryCode?: string | null;

    formattedAddress?: string | null;
  };
};

type RacerSearchRecord = {
  id?: string | number;
  uuid?: string;

  athleteId?: string;

  boatManufacturers?: string | null;
  teamName?: string | null;

  athlete?: {
    id?: string;

    name?: string | null;
    nickname?: string | null;

    image?: string | null;
    imageUrl?: string | null;
    profilePicture?: string | null;

    origin?: string | null;

    city?: string | null;
    stateCode?: string | null;
    countryCode?: string | null;

    formattedAddress?: string | null;
  };
};

function getErrorMessage(body: any, fallback: string) {
  const message =
    body?.message ?? body?.error ?? body?.result?.response?.message ?? fallback;

  return Array.isArray(message) ? message.join(", ") : String(message);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  let body: any = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(body, response.statusText || "Request failed."),
    );
  }

  return (body?.data ?? body) as T;
}

function getApiArray(body: any): RacerSearchRecord[] {
  const candidates = [
    body,
    body?.data,
    body?.items,
    body?.results,
    body?.racers,
    body?.data?.data,
    body?.data?.items,
    body?.data?.results,
    body?.data?.racers,
  ];

  const list = candidates.find(Array.isArray);

  return Array.isArray(list) ? list : [];
}

function mapRacerRecord(record: RacerSearchRecord): RegistrationRacer | null {
  const athlete = record.athlete;

  if (!athlete) {
    return null;
  }

  /**
   * IMPORTANT:
   *
   * RegistrationSubmission expects an Athlete UUID as racerId.
   * record.id can be the JetSkiRacerDetails UUID, so athlete.id
   * must always be preferred.
   */
  const athleteId = athlete.id ?? record.athleteId;

  if (!athleteId) {
    return null;
  }

  const name = athlete.name?.trim() || "";

  if (!name) {
    return null;
  }

  const formattedLocation =
    athlete.formattedAddress?.trim() ||
    athlete.origin?.trim() ||
    [athlete.city, athlete.stateCode, athlete.countryCode]
      .filter(Boolean)
      .join(", ") ||
    null;

  return {
    id: String(athleteId),

    name,

    nickname: athlete.nickname?.trim() || null,

    imageUrl:
      athlete.imageUrl ?? athlete.image ?? athlete.profilePicture ?? null,

    city: athlete.city ?? null,

    stateCode: athlete.stateCode ?? null,

    countryCode: athlete.countryCode ?? null,

    formattedLocation,

    raceNumber: null,

    teamName: record.boatManufacturers ?? record.teamName ?? null,

    isDemoCreated: false,
  };
}

export async function createRegistrationRacer(
  input: CreateRegistrationRacerInput,
): Promise<RegistrationRacer> {
  const firstName = input.firstName.trim();

  const lastName = input.lastName.trim();

  const name = `${firstName} ${lastName}`.trim();

  const city = input.city.trim();

  const stateCode = input.stateCode?.trim() || undefined;

  const countryCode = input.countryCode.trim().toUpperCase();

  const formattedAddress = [city, stateCode, countryCode]
    .filter(Boolean)
    .join(", ");

  const response = await apiFetch("/athletes", {
    method: "POST",

    body: {
      name,

      nickname: input.nickname?.trim() || undefined,

      origin: formattedAddress,

      city,

      stateCode,

      countryCode,

      formattedAddress,
    },
  });

  const result = await parseResponse<CreateAthleteResponse>(response);

  const athlete = result.athlete;

  return {
    id: String(athlete.id),

    name: athlete.name,

    nickname: athlete.nickname ?? null,

    imageUrl: athlete.imageUrl ?? athlete.image ?? null,

    city: athlete.city ?? city,

    stateCode: athlete.stateCode ?? stateCode ?? null,

    countryCode: athlete.countryCode ?? countryCode,

    formattedLocation:
      athlete.formattedAddress ?? athlete.origin ?? formattedAddress,

    raceNumber: null,

    teamName: null,

    isDemoCreated: false,
  };
}

export async function searchRegistrationRacers(
  query: string,
): Promise<RegistrationRacer[]> {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length < 2) {
    return [];
  }

  /**
   * The existing Corner League RacerSearchModal already proves this
   * endpoint is paginated and performs search filtering client-side.
   *
   * Fetch several pages so registration search is useful without
   * introducing an unsupported backend search parameter.
   */
  const pageLimit = 100;
  const maximumPages = 5;

  const racers: RegistrationRacer[] = [];

  for (let page = 1; page <= maximumPages; page += 1) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageLimit),
      order: "DESC",
      sortBy: "createdAt",
    });

    const response = await apiFetch(
      `/jet-ski-racer-details?${params.toString()}`,
      {
        skipAuth: true,
      },
    );

    const body = await parseResponse<any>(response);

    const records = getApiArray(body);

    if (!records.length) {
      break;
    }

    for (const record of records) {
      const racer = mapRacerRecord(record);

      if (!racer) {
        continue;
      }

      const searchableText = [
        racer.name,
        racer.nickname,
        racer.formattedLocation,
        racer.teamName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (searchableText.includes(normalizedQuery)) {
        racers.push(racer);
      }
    }

    if (records.length < pageLimit) {
      break;
    }
  }

  const deduplicated = new Map<string, RegistrationRacer>();

  for (const racer of racers) {
    deduplicated.set(racer.id, racer);
  }

  return [...deduplicated.values()].slice(0, 25);
}
