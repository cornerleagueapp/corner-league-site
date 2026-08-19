import { apiRequest } from "@/lib/apiClient";

import type {
  CreateOrganizationMemberInput,
  OrganizationMembersResponse,
  OrganizationRegistrationMember,
  UpdateOrganizationMemberInput,
} from "../types/organizationMembers";

function basePath(organizationId: string) {
  return `/registration/admin/organizations/${encodeURIComponent(
    organizationId,
  )}/members`;
}

export function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMembersResponse> {
  return apiRequest("GET", basePath(organizationId));
}

export function createOrganizationMember(
  organizationId: string,
  input: CreateOrganizationMemberInput,
): Promise<OrganizationRegistrationMember> {
  return apiRequest("POST", basePath(organizationId), input);
}

export function updateOrganizationMember(
  organizationId: string,
  memberId: string,
  input: UpdateOrganizationMemberInput,
): Promise<OrganizationRegistrationMember> {
  return apiRequest(
    "PATCH",
    `${basePath(organizationId)}/${encodeURIComponent(memberId)}`,
    input,
  );
}

export function suspendOrganizationMember(
  organizationId: string,
  memberId: string,
): Promise<OrganizationRegistrationMember> {
  return apiRequest(
    "POST",
    `${basePath(organizationId)}/${encodeURIComponent(memberId)}/suspend`,
  );
}

export function reactivateOrganizationMember(
  organizationId: string,
  memberId: string,
): Promise<OrganizationRegistrationMember> {
  return apiRequest(
    "POST",
    `${basePath(organizationId)}/${encodeURIComponent(memberId)}/reactivate`,
  );
}

export function removeOrganizationMember(
  organizationId: string,
  memberId: string,
): Promise<OrganizationRegistrationMember> {
  return apiRequest(
    "DELETE",
    `${basePath(organizationId)}/${encodeURIComponent(memberId)}`,
  );
}
