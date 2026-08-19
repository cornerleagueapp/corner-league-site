export type RegistrationStatus =
  | "pending_payment"
  | "pending_cash"
  | "confirmed"
  | "waitlisted"
  | "cancelled"
  | "partially_refunded"
  | "refunded";

export type RegistrationPaymentMethod = "online" | "cash" | "manual" | "waived";

export type RegistrationPaymentStatus =
  | "not_required"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "partially_refunded"
  | "refunded";

export type RegistrationEventStatus = "upcoming" | "open" | "closed";

export type RegistrationOrganization = {
  id: string;
  slug?: string;
  name: string;
  abbreviation?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  city?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;
  websiteUrl?: string | null;
};

export type RegistrationEventDay = {
  id: string;
  key: string;
  label: string;
  date: string;
  startsAt?: string | null;
  endsAt?: string | null;
  isRegistrationEnabled: boolean;
  displayOrder: number;
};

export type RegistrationPriceRule = {
  id: string;
  name: string;
  description?: string | null;
  pricingModel: string;
  amountCents: number;
  currency: string;
  validFrom?: string | null;
  validUntil?: string | null;
  priority: number;
  primaryEventDayId?: string | null;
  eventDayIds: string[];
};

export type RegistrationEventClass = {
  id: string;
  eventId?: string;
  divisionId: string;

  name: string;
  code?: string | null;
  description?: string | null;

  pricingModel?: string;
  basePriceCents: number;
  currency: string;

  capacity?: number | null;
  allowWaitlist: boolean;

  minimumSelectedDays: number;
  maximumSelectedDays?: number | null;

  isRegistrationOpen: boolean;
  displayOrder: number;

  confirmedRacerCount: number;

  priceRules?: RegistrationPriceRule[];
};

export type RegistrationEvent = {
  id: string;
  registrationSettingsId?: string;

  slug: string;

  name: string;
  description: string;

  sport?: string | null;
  imageUrl?: string | null;

  location?: string | null;
  formattedLocation: string;
  latitude?: number | null;
  longitude?: number | null;

  startDate: string;
  endDate: string;

  registrationStatus: RegistrationEventStatus;

  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;

  confirmedRacerCount: number;
  classCount?: number;
  dayCount?: number;

  organization: {
    id: string;
    name: string;
    abbreviation?: string | null;
    logoUrl?: string | null;
  };

  allowOnlinePayment: boolean;
  allowCashPayment: boolean;
  allowManualPayment?: boolean;
  allowCoupons?: boolean;
  allowWaitlist?: boolean;

  requireAccount?: boolean;
  showPublicEntryList?: boolean;

  currency: string;

  termsText?: string | null;
  refundPolicyText?: string | null;
  confirmationMessage?: string | null;

  eventDays: RegistrationEventDay[];
  classes: RegistrationEventClass[];
};

export type RegistrationRacer = {
  id: string;
  name: string;
  nickname?: string | null;
  imageUrl?: string | null;

  city?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;
  formattedLocation?: string | null;

  raceNumber?: string | null;
  teamName?: string | null;

  isDemoCreated?: boolean;
};

export type NewRegistrationRacerInput = {
  firstName: string;
  lastName: string;
  nickname?: string;

  city: string;
  stateCode?: string;
  countryCode: string;

  raceNumber?: string;
};

export type RegistrationContact = {
  email: string;
  phone: string;

  city: string;
  stateCode?: string;
  countryCode: string;
};

export type RegistrationClassSelection = {
  classId: string;
  className: string;

  selectedEventDayIds: string[];
  selectedEventDays: RegistrationEventDay[];

  /**
   * Display-only estimate.
   *
   * The backend remains authoritative for final pricing.
   */
  estimatedPriceCents: number;
};

export type RegistrationWatercraft = {
  boatNumber: string;
  make: string;
  model: string;
  year?: string;

  useForAllClasses: boolean;

  hullIdentificationNumber?: string;
  engineDescription?: string;
  notes?: string;
};

export type RegistrationPricingSummary = {
  classSubtotalCents: number;
  platformFeeCents: number;
  processingFeeCents: number;
  totalCents: number;
  currency: string;
};

export type RegistrationDraft = {
  eventId: string;
  eventSlug: string;

  registeredByUserId?: string | null;

  racer?: RegistrationRacer | null;

  newRacer?: NewRegistrationRacerInput | null;

  contact: RegistrationContact;

  selectedClasses: RegistrationClassSelection[];

  watercraft: RegistrationWatercraft;

  paymentMethod?: RegistrationPaymentMethod | null;

  pricing: RegistrationPricingSummary;

  termsAccepted: boolean;
  couponCode?: string;

  currentStep: number;

  updatedAt: string;
};

export type PublicRegistrationEntry = {
  registrationId: string;
  confirmationNumber: string;

  registrationStatus: RegistrationStatus;

  registeredAt: string;

  racer: {
    id: string;
    name: string;
    nickname?: string | null;
    imageUrl?: string | null;

    formattedLocation?: string | null;
    city?: string | null;
    stateCode?: string | null;
    countryCode?: string | null;

    teamName?: string | null;
  };

  classEntry: {
    id: string;

    eventClassId: string;
    divisionId: string;

    className: string;
    status: string;

    selectedDays: Array<{
      id: string;
      key: string;
      label: string;
      date: string;
    }>;
  };
};

export type PublicRegisteredRacer = {
  registrationId: string;

  racer: RegistrationRacer;

  selectedClasses: RegistrationClassSelection[];

  status: RegistrationStatus;

  registeredAt: string;
};
