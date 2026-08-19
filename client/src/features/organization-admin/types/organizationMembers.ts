export type OrganizationRegistrationRole =
  | "owner"
  | "admin"
  | "race_director"
  | "registration_manager"
  | "results_manager"
  | "viewer";

export type OrganizationRegistrationMemberStatus =
  | "invited"
  | "active"
  | "suspended"
  | "removed";

export type OrganizationPermissionKey =
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

export type OrganizationPermissionOverrides = Partial<
  Record<OrganizationPermissionKey, boolean>
>;

export type OrganizationMemberUser = {
  id: string | number;

  username?: string | null;

  email?: string | null;

  firstName?: string | null;

  lastName?: string | null;

  profilePicture?: string | null;
};

export type OrganizationRegistrationMember = {
  id: string;

  role: OrganizationRegistrationRole;

  status: OrganizationRegistrationMemberStatus;

  permissionOverrides: OrganizationPermissionOverrides | null;

  user: OrganizationMemberUser;

  invitedByUser?: OrganizationMemberUser | null;

  invitedAt?: string | null;

  acceptedAt?: string | null;

  suspendedAt?: string | null;

  removedAt?: string | null;

  notes?: string | null;

  createdAt?: string;

  updatedAt?: string;
};

export type OrganizationMembersResponse = {
  organizationId: string;

  members: OrganizationRegistrationMember[];

  count: number;
};

export type CreateOrganizationMemberInput = {
  email: string;

  role: OrganizationRegistrationRole;

  notes?: string;
};

export type UpdateOrganizationMemberInput = {
  role?: OrganizationRegistrationRole;

  permissionOverrides?: OrganizationPermissionOverrides | null;

  notes?: string;
};

export const ORGANIZATION_ROLE_OPTIONS: Array<{
  value: OrganizationRegistrationRole;
  label: string;
  description: string;
}> = [
  {
    value: "owner",
    label: "Owner",
    description:
      "Full organization registration control, including member management.",
  },
  {
    value: "admin",
    label: "Admin",
    description:
      "Full registration administration except ownership-specific actions.",
  },
  {
    value: "race_director",
    label: "Race Director",
    description:
      "Event configuration, classes, pricing and race administration.",
  },
  {
    value: "registration_manager",
    label: "Registration Manager",
    description:
      "Registration review, payments, adjustments and registrant management.",
  },
  {
    value: "results_manager",
    label: "Results Manager",
    description: "Results-related administration and racer enrollment.",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only organization registration access.",
  },
];

export const ORGANIZATION_PERMISSION_OPTIONS: Array<{
  key: OrganizationPermissionKey;
  label: string;
  description: string;
}> = [
  {
    key: "manageEventSettings",
    label: "Event Settings",
    description: "Edit registration settings for events.",
  },
  {
    key: "manageEventDays",
    label: "Event Days",
    description: "Create and manage registration/race days.",
  },
  {
    key: "manageEventClasses",
    label: "Event Classes",
    description: "Configure classes available for registration.",
  },
  {
    key: "managePricing",
    label: "Pricing",
    description: "Configure registration pricing.",
  },
  {
    key: "manageDiscounts",
    label: "Discounts",
    description: "Create and manage registration discounts.",
  },
  {
    key: "managePayments",
    label: "Payments",
    description: "Access organization payment administration.",
  },
  {
    key: "manageRaceScheduling",
    label: "Race Scheduling",
    description: "Generate, modify and publish race schedules.",
  },
  {
    key: "viewPrivateRegistrations",
    label: "Private Registrations",
    description: "View private racer registration information.",
  },
  {
    key: "manageRegistrations",
    label: "Manage Registrations",
    description: "Modify and administer racer registrations.",
  },
  {
    key: "confirmCashPayments",
    label: "Cash Payments",
    description: "Confirm organizer-collected cash payments.",
  },
  {
    key: "applyPriceAdjustments",
    label: "Price Adjustments",
    description: "Apply authorized manual price adjustments.",
  },
  {
    key: "waiveRegistrationFees",
    label: "Waive Fees",
    description: "Waive outstanding registration balances.",
  },
  {
    key: "issueRefunds",
    label: "Refunds",
    description: "Issue registration refunds.",
  },
  {
    key: "manageResultsEnrollment",
    label: "Results Enrollment",
    description: "Manage racer enrollment into results.",
  },
  {
    key: "manageMembers",
    label: "Members",
    description: "Add, edit, suspend and remove organization administrators.",
  },
];
