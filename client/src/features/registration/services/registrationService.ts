import { apiFetch } from "@/lib/apiClient";

import type {
  PublicRegistrationEntry,
  RegistrationEvent,
  RegistrationEventClass,
} from "../types/registration.types";

type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.message ?? body?.error ?? response.statusText ?? "Request failed.";

    throw new Error(
      Array.isArray(message) ? message.join(", ") : String(message),
    );
  }

  return (body?.data ?? body) as T;
}

export async function getRegistrationEvents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "open" | "upcoming" | "closed";
}): Promise<PaginatedResponse<RegistrationEvent>> {
  const query = new URLSearchParams();

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await apiFetch(`/registration/events${suffix}`, {
    skipAuth: true,
    noRefresh: true,
  });

  return parseResponse<PaginatedResponse<RegistrationEvent>>(response);
}

export async function getRegistrationEventBySlug(
  eventSlug: string,
): Promise<RegistrationEvent> {
  const response = await apiFetch(
    `/registration/events/${encodeURIComponent(eventSlug)}`,
    {
      skipAuth: true,
      noRefresh: true,
    },
  );

  return parseResponse<RegistrationEvent>(response);
}

export async function getRegistrationClasses(
  eventSlug: string,
): Promise<RegistrationEventClass[]> {
  const response = await apiFetch(
    `/registration/events/${encodeURIComponent(eventSlug)}/classes`,
    {
      skipAuth: true,
      noRefresh: true,
    },
  );

  return parseResponse<RegistrationEventClass[]>(response);
}

export async function getPublicRegistrationEntries(
  eventSlug: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    classId?: string;
    dayId?: string;
  },
): Promise<PaginatedResponse<PublicRegistrationEntry>> {
  const query = new URLSearchParams();

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params?.classId) {
    query.set("classId", params.classId);
  }

  if (params?.dayId) {
    query.set("dayId", params.dayId);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await apiFetch(
    `/registration/events/${encodeURIComponent(eventSlug)}/entries${suffix}`,
    {
      skipAuth: true,
      noRefresh: true,
    },
  );

  return parseResponse<PaginatedResponse<PublicRegistrationEntry>>(response);
}

export async function getRegistrationProgress(eventSlug: string) {
  const response = await apiFetch(
    `/registration/events/${encodeURIComponent(eventSlug)}/progress`,
    {
      skipAuth: true,
      noRefresh: true,
    },
  );

  return parseResponse<{
    eventId: string;
    eventSlug: string;

    totalConfirmedEntries: number;

    classes: Array<{
      classId: string;
      divisionId: string;
      className: string;
      confirmedRacerCount: number;
      capacity: number | null;
      remaining: number | null;
      percentage: number | null;
      isFull: boolean;
      allowWaitlist: boolean;
    }>;
  }>(response);
}

export async function getRecentRegistrations(eventSlug: string, limit = 5) {
  const response = await apiFetch(
    `/registration/events/${encodeURIComponent(
      eventSlug,
    )}/recent?limit=${limit}`,
    {
      skipAuth: true,
      noRefresh: true,
    },
  );

  return parseResponse<
    Array<{
      registrationId: string;

      racer: {
        id: string;
        name: string;
        nickname?: string | null;
        imageUrl?: string | null;
        formattedLocation?: string | null;
      };

      classes: Array<{
        id: string;
        divisionId: string;
        name: string;
      }>;

      confirmedAt: string;
    }>
  >(response);
}

export type CreateRaceRegistrationInput = {
  clientRequestId: string;

  racerId: string;

  contactEmail: string;
  contactPhone: string;
  contactCity: string;
  contactStateCode?: string;
  contactCountryCode: string;

  paymentMethod: "online" | "cash";

  entries: Array<{
    eventClassId: string;
    selectedEventDayIds: string[];
  }>;

  watercraft: {
    boatNumber: string;
    manufacturer: string;
    model: string;

    modelYear?: number;

    useForAllClasses?: boolean;

    hullIdentificationNumber?: string;
    engineDescription?: string;
    notes?: string;
  };

  termsAccepted: boolean;

  termsVersion?: string;

  racerNotes?: string;

  couponCode?: string;
};

export type CreateRaceRegistrationResponse = {
  registration: {
    id: string;

    confirmationNumber: string;

    status: string;

    paymentMethod: string;

    paymentStatus: string;

    classSubtotalCents: number;

    discountTotalCents: number;

    manualAdjustmentTotalCents: number;

    platformFeeCents: number;

    processingFeeCents: number;

    taxTotalCents: number;

    totalCents: number;

    amountPaidCents: number;

    amountRefundedCents: number;

    currency: string;

    submittedAt?: string | null;

    confirmedAt?: string | null;

    createdAt: string;

    racer?: {
      id: string;
      name: string;
      nickname?: string | null;
    };

    event?: {
      id: string;
      name: string;
    };

    entries?: any[];

    watercraft?: any;
  };

  paymentRequired?: boolean;

  waitlisted?: boolean;
};

export async function submitRegistration(
  eventSlug: string,
  input: CreateRaceRegistrationInput,
): Promise<CreateRaceRegistrationResponse> {
  const response = await apiFetch(
    `/registration/events/${encodeURIComponent(eventSlug)}/registrations`,
    {
      method: "POST",
      body: input,
    },
  );

  return parseResponse<CreateRaceRegistrationResponse>(response);
}

export type RegistrationAccountItem = {
  id: string;

  confirmationNumber: string;

  status: string;

  paymentMethod: string;

  paymentStatus: string;

  event: {
    id: string;

    name: string;

    slug?: string;
    publicSlug?: string;

    description?: string | null;

    formattedLocation?: string | null;

    startDate?: string | null;
    endDate?: string | null;
  };

  racer: {
    id: string;
    name: string;

    nickname?: string | null;
    imageUrl?: string | null;
  };

  entries: Array<{
    id: string;

    eventClass?: {
      id: string;
      displayName?: string | null;
    };

    division?: {
      id: string;
      name?: string | null;
    };

    selectedDays?: Array<{
      id: string;

      eventDateSnapshot?: string;

      eventDay?: {
        id: string;
        dayKey?: string;
        label?: string;
        eventDate?: string;
      };
    }>;
  }>;

  watercraft?: {
    id?: string;

    boatNumber?: string;

    manufacturer?: string;

    make?: string;

    model?: string;

    modelYear?: number | null;

    year?: number | string | null;
  } | null;

  classSubtotalCents: number;

  discountTotalCents: number;

  manualAdjustmentTotalCents: number;

  platformFeeCents: number;

  processingFeeCents: number;

  taxTotalCents: number;

  totalCents: number;

  amountPaidCents: number;

  amountRefundedCents: number;

  currency: string;

  submittedAt?: string | null;

  confirmedAt?: string | null;

  cancelledAt?: string | null;

  createdAt: string;

  updatedAt: string;
};

export type MyRegistrationsResponse = {
  data: RegistrationAccountItem[];

  pagination: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;

    hasNextPage: boolean;

    hasPreviousPage: boolean;
  };
};

export async function getMyRegistrations(params?: {
  page?: number;

  limit?: number;

  status?: string;

  paymentStatus?: string;

  search?: string;
}): Promise<MyRegistrationsResponse> {
  const query = new URLSearchParams();

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  if (params?.status) {
    query.set("status", params.status);
  }

  if (params?.paymentStatus) {
    query.set("paymentStatus", params.paymentStatus);
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await apiFetch(`/registration/my${suffix}`);

  return parseResponse<MyRegistrationsResponse>(response);
}

export async function getMyRegistration(
  registrationId: string,
): Promise<RegistrationAccountItem> {
  const response = await apiFetch(
    `/registration/my/${encodeURIComponent(registrationId)}`,
  );

  return parseResponse<RegistrationAccountItem>(response);
}

export async function getMyRegistrationByConfirmationNumber(
  confirmationNumber: string,
): Promise<RegistrationAccountItem> {
  const response = await apiFetch(
    `/registration/my/confirmation/${encodeURIComponent(confirmationNumber)}`,
  );

  return parseResponse<RegistrationAccountItem>(response);
}

export type StripeCheckoutResponse = {
  checkoutUrl: string;

  sessionId?: string;

  paymentId?: string;

  reused?: boolean;
};

export async function createStripeCheckout(
  registrationId: string,
  input: {
    idempotencyKey: string;

    customerEmail?: string;
  },
): Promise<StripeCheckoutResponse> {
  const response = await apiFetch(
    `/registration/payments/${encodeURIComponent(
      registrationId,
    )}/stripe-checkout`,
    {
      method: "POST",

      body: input,
    },
  );

  return parseResponse<StripeCheckoutResponse>(response);
}

export type RegistrationPaymentStatusResponse = {
  registrationId?: string;

  registrationStatus?: string;

  paymentStatus?: string;

  totalCents?: number;

  amountPaidCents?: number;

  amountRefundedCents?: number;

  currency?: string;

  [key: string]: unknown;
};

export async function getRegistrationPaymentStatus(
  registrationId: string,
): Promise<RegistrationPaymentStatusResponse> {
  const response = await apiFetch(
    `/registration/payments/${encodeURIComponent(registrationId)}/status`,
  );

  return parseResponse<RegistrationPaymentStatusResponse>(response);
}
