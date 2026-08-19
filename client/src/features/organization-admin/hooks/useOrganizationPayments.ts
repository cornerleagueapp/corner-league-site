import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  confirmRegistrationCashPayment,
  createOrganizationStripeAccount,
  createOrganizationStripeDashboardLink,
  createOrganizationStripeOnboardingLink,
  createRegistrationManualAdjustment,
  getOrganizationStripeStatus,
  recordRegistrationManualPayment,
  refundRegistration,
  waiveRegistrationFees,
} from "../api/organizationPaymentsApi";

import type {
  ConfirmCashPaymentInput,
  CreateManualAdjustmentInput,
  CreateRegistrationRefundInput,
  CreateStripeConnectedAccountInput,
  RecordManualPaymentInput,
  WaiveRegistrationFeesInput,
} from "../types/organizationPayments";

export function useOrganizationStripeStatus(
  organizationId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["organization-stripe-status", organizationId],

    enabled: !!organizationId,

    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required.");
      }

      return getOrganizationStripeStatus(organizationId);
    },

    staleTime: 30 * 1000,

    retry: false,
  });
}

export function useCreateOrganizationStripeAccount(
  organizationId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStripeConnectedAccountInput) => {
      if (!organizationId) {
        throw new Error("Organization ID is required.");
      }

      return createOrganizationStripeAccount(organizationId, input);
    },

    onSuccess: async () => {
      if (!organizationId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["organization-stripe-status", organizationId],
      });
    },
  });
}

export function useOrganizationStripeOnboardingLink(
  organizationId: string | null | undefined,
) {
  return useMutation({
    mutationFn: () => {
      if (!organizationId) {
        throw new Error("Organization ID is required.");
      }

      return createOrganizationStripeOnboardingLink(organizationId);
    },
  });
}

export function useOrganizationStripeDashboardLink(
  organizationId: string | null | undefined,
) {
  return useMutation({
    mutationFn: () => {
      if (!organizationId) {
        throw new Error("Organization ID is required.");
      }

      return createOrganizationStripeDashboardLink(organizationId);
    },
  });
}

function useRefreshRegistrationQueries(eventId: string | null | undefined) {
  const queryClient = useQueryClient();

  return async () => {
    if (!eventId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ["organization-admin-registrations", eventId],
    });
  };
}

export function useConfirmCashPayment(eventId: string | null | undefined) {
  const refresh = useRefreshRegistrationQueries(eventId);

  return useMutation({
    mutationFn: ({
      registrationId,
      input,
    }: {
      registrationId: string;

      input: ConfirmCashPaymentInput;
    }) => confirmRegistrationCashPayment(registrationId, input),

    onSuccess: refresh,
  });
}

export function useRecordManualPayment(eventId: string | null | undefined) {
  const refresh = useRefreshRegistrationQueries(eventId);

  return useMutation({
    mutationFn: ({
      registrationId,
      input,
    }: {
      registrationId: string;

      input: RecordManualPaymentInput;
    }) => recordRegistrationManualPayment(registrationId, input),

    onSuccess: refresh,
  });
}

export function useCreateManualAdjustment(eventId: string | null | undefined) {
  const refresh = useRefreshRegistrationQueries(eventId);

  return useMutation({
    mutationFn: ({
      registrationId,
      input,
    }: {
      registrationId: string;

      input: CreateManualAdjustmentInput;
    }) => createRegistrationManualAdjustment(registrationId, input),

    onSuccess: refresh,
  });
}

export function useWaiveRegistrationFees(eventId: string | null | undefined) {
  const refresh = useRefreshRegistrationQueries(eventId);

  return useMutation({
    mutationFn: ({
      registrationId,
      input,
    }: {
      registrationId: string;

      input: WaiveRegistrationFeesInput;
    }) => waiveRegistrationFees(registrationId, input),

    onSuccess: refresh,
  });
}

export function useRefundRegistration(eventId: string | null | undefined) {
  const refresh = useRefreshRegistrationQueries(eventId);

  return useMutation({
    mutationFn: ({
      registrationId,
      input,
    }: {
      registrationId: string;

      input: CreateRegistrationRefundInput;
    }) => refundRegistration(registrationId, input),

    onSuccess: refresh,
  });
}
