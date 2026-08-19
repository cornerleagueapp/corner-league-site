import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  getAdminEventRegistrations,
  getOrganizationEvents,
} from "../api/organizationRegistrationApi";

import type {
  OrganizationRegistrationMetrics,
  RegistrationAdminEntry,
} from "../types/organizationRegistration";

export function useOrganizationEvents(
  organizationId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["organization-admin-events", organizationId],

    enabled: !!organizationId,

    queryFn: async () => {
      if (!organizationId) {
        return [];
      }

      return getOrganizationEvents(organizationId);
    },

    staleTime: 60 * 1000,

    retry: false,
  });
}

export function useOrganizationEventRegistrations(
  eventId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["organization-admin-registrations", eventId],

    enabled: !!eventId,

    queryFn: async () => {
      if (!eventId) {
        throw new Error("Event ID is required.");
      }

      return getAdminEventRegistrations(eventId);
    },

    staleTime: 20 * 1000,

    retry: false,
  });
}

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function calculateRegistrationMetrics(
  registrations: RegistrationAdminEntry[],
): OrganizationRegistrationMetrics {
  let confirmed = 0;

  let pending = 0;

  let cancelled = 0;

  let refunded = 0;

  let paid = 0;

  let unpaid = 0;

  let totalRevenueCents = 0;

  let collectedRevenueCents = 0;

  for (const registration of registrations) {
    const status = normalizeStatus(registration.status);

    const paymentStatus = normalizeStatus(registration.paymentStatus);

    if (status === "confirmed") {
      confirmed += 1;
    } else if (status === "cancelled" || status === "canceled") {
      cancelled += 1;
    } else if (status === "refunded") {
      refunded += 1;
    } else {
      pending += 1;
    }

    const total = Number(registration.totalCents ?? 0) || 0;

    const amountPaid = Number(registration.amountPaidCents ?? 0) || 0;

    totalRevenueCents += total;

    collectedRevenueCents += amountPaid;

    if (
      paymentStatus === "completed" ||
      paymentStatus === "paid" ||
      amountPaid >= total
    ) {
      paid += 1;
    } else {
      unpaid += 1;
    }
  }

  return {
    totalRegistrations: registrations.length,

    confirmed,

    pending,

    cancelled,

    refunded,

    paid,

    unpaid,

    totalRevenueCents,

    collectedRevenueCents,

    outstandingRevenueCents: Math.max(
      0,
      totalRevenueCents - collectedRevenueCents,
    ),
  };
}

export function useRegistrationDashboardMetrics(
  registrations: RegistrationAdminEntry[],
) {
  return useMemo(
    () => calculateRegistrationMetrics(registrations),
    [registrations],
  );
}
