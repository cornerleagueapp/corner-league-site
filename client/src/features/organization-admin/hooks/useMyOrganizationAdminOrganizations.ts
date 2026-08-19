import { useQuery } from "@tanstack/react-query";

import { getMyOrganizationAdminOrganizations } from "../api/myOrganizationAdminApi";

export function useMyOrganizationAdminOrganizations(enabled = true) {
  return useQuery({
    queryKey: ["my-organization-admin-organizations"],

    queryFn: getMyOrganizationAdminOrganizations,

    enabled,

    staleTime: 60 * 1000,

    retry: false,
  });
}
