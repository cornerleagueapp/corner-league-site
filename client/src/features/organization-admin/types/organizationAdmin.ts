export type OrganizationRegistrationRole =
  | "owner"
  | "admin"
  | "race_director"
  | "registration_manager"
  | "results_manager"
  | "viewer";

export type OrganizationAdminPermission =
  | "manageEventSettings"
  | "manageEventDays"
  | "manageEventClasses"
  | "managePricing"
  | "manageDiscounts"
  | "managePayments"
  | "manageRaceScheduling"
  | "viewPrivateRegistrations"
  | "manageRegistrations"
  | "confirmCashPayments"
  | "applyPriceAdjustments"
  | "waiveRegistrationFees"
  | "issueRefunds"
  | "manageResultsEnrollment"
  | "manageMembers";

export type OrganizationAdminPermissions = Partial<
  Record<OrganizationAdminPermission, boolean>
>;

export interface OrganizationAdminAccessContext {
  organizationId: string;

  canAccessAdmin: boolean;

  /**
   * True for Corner League SUPER_ADMIN / ADMIN users who are bypassing
   * organization membership.
   */
  isGlobalAdmin: boolean;

  /**
   * Null for platform-level administrators.
   */
  membershipId: string | null;

  /**
   * Organization-level role.
   *
   * Null when access comes from a Corner League global administrator role.
   */
  role: OrganizationRegistrationRole | null;

  permissions: OrganizationAdminPermissions;
}

export interface OrganizationAdminNavItem {
  key:
    | "overview"
    | "events"
    | "registrations"
    | "race-days"
    | "race-schedule"
    | "payments"
    | "results"
    | "members"
    | "settings";

  label: string;

  description: string;

  href: string;

  permission?: OrganizationAdminPermission;
}
