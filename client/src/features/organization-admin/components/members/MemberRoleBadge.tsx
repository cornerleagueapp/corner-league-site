import type {
  OrganizationRegistrationMemberStatus,
  OrganizationRegistrationRole,
} from "../../types/organizationMembers";

const roleLabels: Record<OrganizationRegistrationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  race_director: "Race Director",
  registration_manager: "Registration Manager",
  results_manager: "Results Manager",
  viewer: "Viewer",
};

export function MemberRoleBadge({
  role,
}: {
  role: OrganizationRegistrationRole;
}) {
  return (
    <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">
      {roleLabels[role]}
    </span>
  );
}

export function MemberStatusBadge({
  status,
}: {
  status: OrganizationRegistrationMemberStatus;
}) {
  const styles =
    status === "active"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
      : status === "suspended"
        ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
        : status === "invited"
          ? "border-blue-300/20 bg-blue-300/10 text-blue-200"
          : "border-red-300/20 bg-red-300/10 text-red-200";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${styles}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
