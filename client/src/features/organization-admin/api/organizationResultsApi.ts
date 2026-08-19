import { apiRequest } from "@/lib/apiClient";

import type { ResultsEnrollmentSyncResult } from "../types/organizationResults";

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

export async function syncRegistrationResultsEnrollment(
  registrationId: string,
): Promise<ResultsEnrollmentSyncResult> {
  const response = await apiRequest<
    ResultsEnrollmentSyncResult | ApiEnvelope<ResultsEnrollmentSyncResult>
  >(
    "POST",
    `/registration/admin/registrations/${encodeURIComponent(
      registrationId,
    )}/results-enrollment/sync`,
    {},
    {
      refreshOn401: true,

      logoutOn401: true,
    },
  );

  return unwrap(response);
}
