export type PublicRaceScheduleSlotClass = {
  id?: string;

  roundNumber: number;

  displayOrder?: number;

  eventClass: {
    id: string;

    displayName?: string | null;

    division?: {
      id?: string;

      name?: string | null;
    } | null;
  };
};

export type PublicRaceScheduleSlot = {
  id: string;

  slotType: "race" | "break" | string;

  displayOrder: number;

  raceNumber: number | null;

  label?: string | null;

  durationMinutes?: number | null;

  isCombinedRace?: boolean;

  analysisMetadata?: {
    racerCount?: number;

    roundNumber?: number;

    [key: string]: unknown;
  } | null;

  classes: PublicRaceScheduleSlotClass[];
};

export type PublicRaceSchedule = {
  id: string;

  status: string;

  version: number;

  publishedAt?: string | null;

  slots: PublicRaceScheduleSlot[];
};

export type PublicRaceScheduleDayResponse = {
  event?: {
    id: string;

    name: string;

    location?: string | null;

    startDate?: string | null;

    endDate?: string | null;

    organizer?: {
      id?: string;

      name?: string | null;

      abbreviation?: string | null;

      logoUrl?: string | null;
    } | null;
  };

  eventDay: {
    id: string;

    dayKey?: string;

    label: string;

    eventDate?: string;

    startsAt?: string | null;

    endsAt?: string | null;
  };

  schedule: PublicRaceSchedule;
};

export type PublicRaceScheduleEventResponse = {
  event: {
    id: string;

    slug: string;

    name: string;

    location?: string | null;

    startDate?: string | null;

    endDate?: string | null;

    organizer?: {
      id?: string;

      name?: string | null;

      abbreviation?: string | null;

      logoUrl?: string | null;
    } | null;
  };

  days: PublicRaceScheduleDayResponse[];
};
