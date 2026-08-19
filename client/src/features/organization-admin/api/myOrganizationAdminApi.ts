import { apiRequest } from "@/lib/apiClient";

export type MyOrganizationAdminOrganization = {
  membershipId: string;

  organizationId: string;

  organizationName: string;

  organizationAbbreviation?: string | null;

  role:
    | "owner"
    | "admin"
    | "race_director"
    | "registration_manager"
    | "results_manager"
    | "viewer";
};

export type MyOrganizationAdminResponse = {
  isGlobalAdmin: boolean;

  organizations: MyOrganizationAdminOrganization[];
};

type ApiEnvelope<T> = {
  data?: T;
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

export async function getMyOrganizationAdminOrganizations() {
  const response = await apiRequest<
    MyOrganizationAdminResponse | ApiEnvelope<MyOrganizationAdminResponse>
  >("GET", "/registration/organization-access");

  return unwrapApiData(response);
}
