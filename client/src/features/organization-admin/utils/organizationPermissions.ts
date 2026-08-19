import type {
  OrganizationAdminAccessContext,
  OrganizationAdminNavItem,
  OrganizationAdminPermission,
} from "../types/organizationAdmin";

export function hasOrganizationPermission(
  access: OrganizationAdminAccessContext | null | undefined,
  permission: OrganizationAdminPermission,
): boolean {
  if (!access?.canAccessAdmin) {
    return false;
  }

  /**
   * Corner League SUPER_ADMIN / ADMIN receives every organization-admin
   * capability from the backend access-context endpoint.
   *
   * We still primarily trust the permissions object so frontend behavior
   * mirrors the backend response.
   */
  if (access.permissions?.[permission] === true) {
    return true;
  }

  return access.isGlobalAdmin;
}

export function canViewOrganizationAdmin(
  access: OrganizationAdminAccessContext | null | undefined,
): boolean {
  return access?.canAccessAdmin === true;
}

export function getOrganizationRoleLabel(
  access: OrganizationAdminAccessContext | null | undefined,
): string {
  if (!access) {
    return "Organization Staff";
  }

  if (access.isGlobalAdmin) {
    return "Corner League Administrator";
  }

  switch (access.role) {
    case "owner":
      return "Owner";

    case "admin":
      return "Administrator";

    case "race_director":
      return "Race Director";

    case "registration_manager":
      return "Registration Manager";

    case "results_manager":
      return "Results Manager";

    case "viewer":
      return "Viewer";

    default:
      return "Organization Staff";
  }
}

export function getOrganizationAdminNavigation(
  organizationId: string,
  access: OrganizationAdminAccessContext,
): OrganizationAdminNavItem[] {
  const basePath = `/organizations/${encodeURIComponent(organizationId)}/admin`;

  const items: OrganizationAdminNavItem[] = [
    {
      key: "overview",
      label: "Overview",
      description: "Organization administration overview.",
      href: basePath,
    },

    {
      key: "events",
      label: "Events",
      description: "Create and manage events for this organization.",
      href: `${basePath}/events`,
      permission: "manageEventSettings",
    },

    {
      key: "registrations",
      label: "Registrations",
      description: "Manage racers, entries, registration status, and roster.",
      href: `${basePath}/registrations`,
      permission: "viewPrivateRegistrations",
    },

    {
      key: "race-days",
      label: "Race Days",
      description: "Configure race days, classes, rounds, and event setup.",
      href: `${basePath}/race-days`,
      permission: "manageEventDays",
    },

    {
      key: "race-schedule",
      label: "Race Schedule",
      description: "Generate, edit, validate, and publish race orders.",
      href: `${basePath}/race-schedule`,
      permission: "manageRaceScheduling",
    },

    {
      key: "payments",
      label: "Payments",
      description: "Review registration payments, refunds, and Stripe status.",
      href: `${basePath}/payments`,
      permission: "managePayments",
    },

    {
      key: "results",
      label: "Results",
      description: "Manage registration-to-results enrollment.",
      href: `${basePath}/results`,
      permission: "manageResultsEnrollment",
    },

    {
      key: "members",
      label: "Members",
      description: "Manage organization administrators and permissions.",
      href: `${basePath}/members`,
      permission: "manageMembers",
    },

    {
      key: "settings",
      label: "Settings",
      description: "Organization event, pricing, and registration settings.",
      href: `${basePath}/settings`,
      permission: "manageEventSettings",
    },
  ];

  return items.filter((item) => {
    if (!item.permission) {
      return true;
    }

    return hasOrganizationPermission(access, item.permission);
  });
}
