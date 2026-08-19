export type RegistrationEventSettings = {
  id?: string;

  publicSlug: string;

  isRegistrationEnabled?: boolean;

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

export type UpdateRegistrationEventSettingsInput =
  Partial<RegistrationEventSettings>;

export type RaceScheduleSettings = {
  id?: string;

  defaultRacesPerClass?: number;

  minimumRestRaceGap?: number;

  suggestClassMerges?: boolean;

  smallClassRacerThreshold?: number;

  maximumCombinedRacerCount?: number;

  maximumClassesPerCombinedRace?: number;

  insertLunchBreak?: boolean;

  lunchBreakLabel?: string;

  lunchBreakDurationMinutes?: number;

  allowConflictOverride?: boolean;
};

export type UpdateRaceScheduleSettingsInput = Partial<RaceScheduleSettings>;
