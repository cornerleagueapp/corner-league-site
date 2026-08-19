import { apiRequest } from "@/lib/apiClient";

import type {
  CreateOrganizationMemberInput,
  OrganizationMembersResponse,
  OrganizationRegistrationMember,
  UpdateOrganizationMemberInput,
} from "../types/organizationMembers";

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

function basePath(organizationId: string) {
  return `/registration/admin/organizations/${encodeURIComponent(
    organizationId,
  )}/members`;
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMembersResponse> {
  const response = await apiRequest<
    OrganizationMembersResponse | ApiEnvelope<OrganizationMembersResponse>
  >("GET", basePath(organizationId));

  return unwrapApiData(response);
}

export async function createOrganizationMember(
  organizationId: string,
  input: CreateOrganizationMemberInput,
): Promise<OrganizationRegistrationMember> {
  const response = await apiRequest<
    OrganizationRegistrationMember | ApiEnvelope<OrganizationRegistrationMember>
  >("POST", basePath(organizationId), input);

  return unwrapApiData(response);
}

export async function updateOrganizationMember(
  organizationId: string,
  memberId: string,
  input: UpdateOrganizationMemberInput,
): Promise<OrganizationRegistrationMember> {
  const response = await apiRequest<
    OrganizationRegistrationMember | ApiEnvelope<OrganizationRegistrationMember>
  >(
    "PATCH",
    `${basePath(organizationId)}/${encodeURIComponent(memberId)}`,
    input,
  );

  return unwrapApiData(response);
}

export async function suspendOrganizationMember(
  organizationId: string,
  memberId: string,
): Promise<OrganizationRegistrationMember> {
  const response = await apiRequest<
    OrganizationRegistrationMember | ApiEnvelope<OrganizationRegistrationMember>
  >(
    "POST",
    `${basePath(organizationId)}/${encodeURIComponent(memberId)}/suspend`,
  );

  return unwrapApiData(response);
}

export async function reactivateOrganizationMember(
  organizationId: string,
  memberId: string,
): Promise<OrganizationRegistrationMember> {
  const response = await apiRequest<
    OrganizationRegistrationMember | ApiEnvelope<OrganizationRegistrationMember>
  >(
    "POST",
    `${basePath(organizationId)}/${encodeURIComponent(memberId)}/reactivate`,
  );

  return unwrapApiData(response);
}

export async function removeOrganizationMember(
  organizationId: string,
  memberId: string,
): Promise<OrganizationRegistrationMember> {
  const response = await apiRequest<
    OrganizationRegistrationMember | ApiEnvelope<OrganizationRegistrationMember>
  >("DELETE", `${basePath(organizationId)}/${encodeURIComponent(memberId)}`);

  return unwrapApiData(response);
}
