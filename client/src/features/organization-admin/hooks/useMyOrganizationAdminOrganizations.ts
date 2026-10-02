import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

import { getMyOrganizationAdminOrganizations } from "../api/myOrganizationAdminApi";

export function useMyOrganizationAdminOrganizations(enabled = true) {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["my-organization-admin-organizations", user?.id ?? null],

    queryFn: getMyOrganizationAdminOrganizations,

    enabled: enabled && isAuthenticated && !!user?.id,

    staleTime: 60 * 1000,

    retry: false,
  });
}
