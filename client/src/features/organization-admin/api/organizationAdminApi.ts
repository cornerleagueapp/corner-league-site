import { apiRequest } from "@/lib/apiClient";

import type { OrganizationAdminAccessContext } from "../types/organizationAdmin";

type ApiEnvelope<T> = {
  status?: boolean;
  statusCode?: number;
  path?: string;
  message?: string;
  data?: T;
  timestamp?: string;
};

function unwrapApiData<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === "object" && "data" in response) {
    const envelope = response as ApiEnvelope<T>;

    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }

  return response as T;
}

export async function getOrganizationAdminAccess(
  organizationId: string,
): Promise<OrganizationAdminAccessContext> {
  const response = await apiRequest<
    OrganizationAdminAccessContext | ApiEnvelope<OrganizationAdminAccessContext>
  >(
    "GET",
    `/registration/organization-access/${encodeURIComponent(organizationId)}`,
    undefined,
    {
      refreshOn401: true,
      logoutOn401: false,
    },
  );

  return unwrapApiData(response);
}
