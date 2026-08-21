import { apiRequest } from "@/lib/apiClient";

import type {
  RaceScheduleSettings,
  RegistrationAvailabilityOverride,
  RegistrationEventSettings,
  UpdateRaceScheduleSettingsInput,
  UpdateRegistrationEventSettingsInput,
} from "../types/organizationSettings";

type ApiEnvelope<T> = {
  status?: boolean;

  statusCode?: number;

  data?: T;

  result?: T;

  message?: string;
};

function unwrap<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === "object") {
    const envelope = response as ApiEnvelope<T>;

    if (envelope.data !== undefined) {
      return envelope.data;
    }

    if (envelope.result !== undefined) {
      return envelope.result;
    }
  }

  return response as T;
}

export type CreateRegistrationEventSettingsInput = {
  publicSlug: string;

  isRegistrationEnabled?: boolean;

  registrationAvailabilityOverride?: RegistrationAvailabilityOverride;

  registrationOpensAt?: string | null;

  registrationClosesAt?: string | null;

  allowOnlinePayment?: boolean;

  allowCashPayment?: boolean;

  allowManualPayment?: boolean;

  allowCoupons?: boolean;

  allowWaitlist?: boolean;

  showPublicEntryList?: boolean;

  showPendingCashEntries?: boolean;

  requireAccount?: boolean;

  maxClassesPerRegistration?: number;

  platformFeeFixedCents?: number;

  platformFeeBasisPoints?: number;

  currency?: string;

  termsText?: string | null;

  refundPolicyText?: string | null;

  confirmationMessage?: string | null;
};

export function createRegistrationEventSettings(
  eventId: string,
  input: CreateRegistrationEventSettingsInput,
) {
  return apiRequest(
    "POST",
    `/registration/admin/events/${encodeURIComponent(eventId)}/settings`,
    input,
    {
      refreshOn401: true,
      logoutOn401: false,
    },
  );
}

export async function getRegistrationEventConfiguration(eventId: string) {
  const response = await apiRequest(
    "GET",
    `/registration/admin/events/${encodeURIComponent(eventId)}/configuration`,
    undefined,
    {
      refreshOn401: true,
      logoutOn401: false,
    },
  );

  return unwrap<any>(response);
}

export async function updateRegistrationEventSettings(
  eventId: string,
  input: UpdateRegistrationEventSettingsInput,
): Promise<RegistrationEventSettings> {
  const response = await apiRequest(
    "PATCH",
    `/registration/admin/events/${encodeURIComponent(eventId)}/settings`,
    input,
    {
      refreshOn401: true,
      logoutOn401: false,
    },
  );

  return unwrap<RegistrationEventSettings>(response);
}

export async function getRaceScheduleSettings(
  eventId: string,
): Promise<RaceScheduleSettings> {
  const response = await apiRequest(
    "GET",
    `/race-scheduling/admin/events/${encodeURIComponent(eventId)}/settings`,
    undefined,
    {
      refreshOn401: true,
      logoutOn401: false,
    },
  );

  return unwrap<RaceScheduleSettings>(response);
}

export async function updateRaceScheduleSettings(
  eventId: string,
  input: UpdateRaceScheduleSettingsInput,
): Promise<RaceScheduleSettings> {
  const response = await apiRequest(
    "PATCH",
    `/race-scheduling/admin/events/${encodeURIComponent(eventId)}/settings`,
    input,
    {
      refreshOn401: true,
      logoutOn401: false,
    },
  );

  return unwrap<RaceScheduleSettings>(response);
}
