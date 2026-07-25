export type RegistrationStatus =
  | "draft"
  | "pending_payment"
  | "pending_cash"
  | "confirmed"
  | "cancelled"
  | "withdrawn";

export type RegistrationPaymentMethod = "online" | "cash";

export type RegistrationPaymentStatus =
  | "unpaid"
  | "pending"
  | "completed"
  | "failed"
  | "refunded";

export type RegistrationEventStatus =
  | "upcoming"
  | "open"
  | "closed"
  | "completed";

export type RegistrationRaceDay = "saturday" | "sunday";

export type RegistrationOrganization = {
  id: string;
  slug: string;
  name: string;
  abbreviation?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  city?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;
  websiteUrl?: string | null;
  squareConnected?: boolean;
};

export type RegistrationEventClass = {
  id: string;
  eventId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  price: number;
  availableDays: RegistrationRaceDay[];
  capacity?: number | null;
  confirmedRacerCount: number;
  isOpen: boolean;
  displayOrder: number;
};

export type RegistrationEvent = {
  id: string;
  slug: string;
  organizationId: string;
  organizationName: string;
  organizationAbbreviation?: string | null;

  name: string;
  description: string;

  city: string;
  stateCode?: string | null;
  countryCode: string;
  formattedLocation: string;

  startDate: string;
  endDate: string;

  registrationOpenDate: string;
  registrationCloseDate: string;
  registrationStatus: RegistrationEventStatus;

  coverImageUrl?: string | null;

  platformFee: number;
  processingFee: number;

  allowOnlinePayment: boolean;
  allowCashPayment: boolean;

  confirmedRacerCount: number;
  classes: RegistrationEventClass[];

  refundPolicy?: string | null;
  cashPaymentInstructions?: string | null;
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
  raceDays: RegistrationRaceDay[];
  price: number;
};

export type RegistrationWatercraft = {
  boatNumber: string;
  make: string;
  model: string;
  year?: string;
  useForAllClasses: boolean;
};

export type RegistrationPricingSummary = {
  classSubtotal: number;
  platformFee: number;
  processingFee: number;
  total: number;
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

  currentStep: number;

  updatedAt: string;
};

export type DemoRegistration = {
  id: string;

  eventId: string;
  eventSlug: string;

  registeredByUserId?: string | null;

  racer: RegistrationRacer;
  contact: RegistrationContact;

  selectedClasses: RegistrationClassSelection[];
  watercraft: RegistrationWatercraft;

  paymentMethod: RegistrationPaymentMethod;
  paymentStatus: RegistrationPaymentStatus;
  status: RegistrationStatus;

  pricing: RegistrationPricingSummary;

  createdAt: string;
  updatedAt: string;
};

export type PublicRegisteredRacer = {
  registrationId: string;
  racer: RegistrationRacer;
  selectedClasses: RegistrationClassSelection[];
  status: "confirmed";
  registeredAt: string;
};

export type RegistrationDemoData = {
  organizations: RegistrationOrganization[];
  events: RegistrationEvent[];
  racers: RegistrationRacer[];
  registrations: DemoRegistration[];
};
