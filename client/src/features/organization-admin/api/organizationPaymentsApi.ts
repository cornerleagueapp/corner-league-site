import { apiRequest } from "@/lib/apiClient";

import type {
  ConfirmCashPaymentInput,
  CreateManualAdjustmentInput,
  CreateRegistrationRefundInput,
  CreateStripeConnectedAccountInput,
  RecordManualPaymentInput,
  StripeConnectActionResult,
  StripeConnectStatus,
  WaiveRegistrationFeesInput,
} from "../types/organizationPayments";

type ApiEnvelope<T> = {
  status?: boolean;

  statusCode?: number;

  path?: string;

  message?: string;

  data?: T;

  result?: T;

  timestamp?: string;
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

export async function getOrganizationStripeStatus(
  organizationId: string,
): Promise<StripeConnectStatus> {
  const response = await apiRequest<
    StripeConnectStatus | ApiEnvelope<StripeConnectStatus>
  >(
    "GET",
    `/registration/admin/organizations/${encodeURIComponent(
      organizationId,
    )}/stripe/status`,
    undefined,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function createOrganizationStripeAccount(
  organizationId: string,
  input: CreateStripeConnectedAccountInput,
) {
  const response = await apiRequest<
    StripeConnectActionResult | ApiEnvelope<StripeConnectActionResult>
  >(
    "POST",
    `/registration/admin/organizations/${encodeURIComponent(
      organizationId,
    )}/stripe/connect`,
    input,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function createOrganizationStripeOnboardingLink(
  organizationId: string,
) {
  const response = await apiRequest<
    StripeConnectActionResult | ApiEnvelope<StripeConnectActionResult>
  >(
    "POST",
    `/registration/admin/organizations/${encodeURIComponent(
      organizationId,
    )}/stripe/onboarding-link`,
    {},
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function createOrganizationStripeDashboardLink(
  organizationId: string,
) {
  const response = await apiRequest<
    StripeConnectActionResult | ApiEnvelope<StripeConnectActionResult>
  >(
    "POST",
    `/registration/admin/organizations/${encodeURIComponent(
      organizationId,
    )}/stripe/dashboard-link`,
    {},
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function confirmRegistrationCashPayment(
  registrationId: string,
  input: ConfirmCashPaymentInput,
) {
  const response = await apiRequest(
    "POST",
    `/registration/admin/registrations/${encodeURIComponent(
      registrationId,
    )}/payments/cash`,
    input,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function recordRegistrationManualPayment(
  registrationId: string,
  input: RecordManualPaymentInput,
) {
  const response = await apiRequest(
    "POST",
    `/registration/admin/registrations/${encodeURIComponent(
      registrationId,
    )}/payments/manual`,
    input,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function createRegistrationManualAdjustment(
  registrationId: string,
  input: CreateManualAdjustmentInput,
) {
  const response = await apiRequest(
    "POST",
    `/registration/admin/registrations/${encodeURIComponent(
      registrationId,
    )}/adjustments`,
    input,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function waiveRegistrationFees(
  registrationId: string,
  input: WaiveRegistrationFeesInput,
) {
  const response = await apiRequest(
    "POST",
    `/registration/admin/registrations/${encodeURIComponent(
      registrationId,
    )}/waive-fees`,
    input,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}

export async function refundRegistration(
  registrationId: string,
  input: CreateRegistrationRefundInput,
) {
  const response = await apiRequest(
    "POST",
    `/registration/admin/registrations/${encodeURIComponent(
      registrationId,
    )}/refunds`,
    input,
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}
