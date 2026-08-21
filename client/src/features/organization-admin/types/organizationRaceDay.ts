import type { RegistrationEventSettings } from "./organizationSettings";
export type { RegistrationEventSettings } from "./organizationSettings";

export type RegistrationEventDay = {
  id: string;

  dayKey: string;

  label: string;

  eventDate: string;

  startsAt?: string | null;

  endsAt?: string | null;

  isRegistrationEnabled: boolean;

  displayOrder: number;
};

export type RegistrationEventClass = {
  id: string;

  displayName?: string | null;

  description?: string | null;

  pricingModel?: string;

  basePriceCents?: number;

  currency?: string;

  capacity?: number | null;

  allowWaitlist?: boolean;

  minimumSelectedDays?: number | null;

  maximumSelectedDays?: number | null;

  isRegistrationOpen: boolean;

  displayOrder: number;

  division: {
    id: string;

    name: string;
  };
};

export type RegistrationAdminEventConfiguration = {
  event: {
    id: string;

    name: string;

    description?: string | null;

    location?: string | null;

    startDate?: string | null;

    endDate?: string | null;

    organizer?: {
      id: string;

      name?: string | null;

      abbreviation?: string | null;
    } | null;
  };

  settings:
    | (RegistrationEventSettings & {
        eventDays: RegistrationEventDay[];

        eventClasses: RegistrationEventClass[];
      })
    | null;
};

export type UpdateRegistrationDayInput = {
  label?: string;

  dayKey?: string;

  eventDate?: string;

  startsAt?: string | null;

  endsAt?: string | null;

  isRegistrationEnabled?: boolean;

  displayOrder?: number;
};

export type UpdateRegistrationClassInput = {
  displayName?: string | null;

  description?: string | null;

  isRegistrationOpen?: boolean;

  capacity?: number | null;

  allowWaitlist?: boolean;

  minimumSelectedDays?: number | null;

  maximumSelectedDays?: number | null;

  displayOrder?: number;
};

export type RegistrationDivisionOption = {
  id: string;

  name: string;

  isWorldFinal?: boolean;
};

export type CreateRegistrationDayInput = {
  dayKey: string;

  label: string;

  eventDate: string;

  startsAt?: string | null;

  endsAt?: string | null;

  isRegistrationEnabled?: boolean;

  displayOrder?: number;
};

export type CreateRegistrationClassInput = {
  divisionId: string;

  displayName?: string | null;

  description?: string | null;

  pricingModel?: string;

  basePriceCents?: number;

  currency?: string;

  capacity?: number | null;

  allowWaitlist?: boolean;

  minimumSelectedDays?: number;

  maximumSelectedDays?: number | null;

  isRegistrationOpen?: boolean;

  displayOrder?: number;
};
