import { useQuery } from "@tanstack/react-query";

import { getOrganizationAdminAccess } from "../api/organizationAdminApi";

export function useOrganizationAdminAccess(
  organizationId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["organization-admin-access", organizationId],

    enabled: typeof organizationId === "string" && organizationId.length > 0,

    queryFn: () => {
      if (!organizationId) {
        throw new Error("Organization ID is required.");
      }

      return getOrganizationAdminAccess(organizationId);
    },

    staleTime: 30 * 1000,

    retry: false,
  });
}
