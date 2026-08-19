export type OrganizationEventSummary = {
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

export type RegistrationAdminEntry = {
  id: string;

  registrationId?: string;

  status?: string;

  totalCents?: number;

  amountPaidCents?: number;

  amountRefundedCents?: number;

  paymentStatus?: string;

  checkoutMethod?: string;

  confirmationNumber?: string | null;

  contactFirstName?: string;

  contactLastName?: string;

  contactEmail?: string;

  contactPhone?: string | null;

  createdAt?: string;

  confirmedAt?: string | null;

  registeredByUser?: {
    id?: string | number;

    username?: string;

    email?: string;

    firstName?: string;

    lastName?: string;
  } | null;

  racer?: {
    id?: string;

    name?: string;

    nickname?: string | null;

    image?: string | null;
  } | null;

  entries?: Array<{
    id?: string;

    status?: string;

    totalCents?: number;

    eventClass?: {
      id?: string;

      displayName?: string | null;

      division?: {
        id?: string;

        name?: string;
      } | null;
    } | null;

    division?: {
      id?: string;

      name?: string;
    } | null;
  }>;
};

export type OrganizationRegistrationList = {
  registrations: RegistrationAdminEntry[];

  total: number;

  page: number;

  limit: number;

  pageCount?: number;
};

export type OrganizationRegistrationMetrics = {
  totalRegistrations: number;

  confirmed: number;

  pending: number;

  cancelled: number;

  refunded: number;

  paid: number;

  unpaid: number;

  totalRevenueCents: number;

  collectedRevenueCents: number;

  outstandingRevenueCents: number;
};
