import { Building2, ArrowUpRight } from "lucide-react";

export const ORG_DASHBOARD_URL = "https://admin.cornerleague.com";

// The API lists active memberships and global administrator access.
// Display follows organization access, not the user's platform role alone.
export function canOpenOrgDashboard(
  verified: boolean,
  access: unknown,
): boolean {
  if (!verified || !access || typeof access !== "object") return false;
  const data = access as { isGlobalAdmin?: unknown; organizations?: unknown };
  return (
    data.isGlobalAdmin === true ||
    (Array.isArray(data.organizations) &&
      data.organizations.some(
        (organization) =>
          organization &&
          typeof organization.organizationId === "string" &&
          organization.organizationId.length > 0,
      ))
  );
}

export function OrgDashboardLink({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={ORG_DASHBOARD_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      aria-label="Go to Org Dashboard"
      title="Go to Org Dashboard"
      className={`mb-4 flex min-h-12 items-center gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-300/15 text-sm font-bold text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${collapsed ? "h-12 w-12 justify-center mx-auto" : "w-full px-3 py-3"}`}
    >
      <Building2 className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1">Go to Org Dashboard</span>
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </>
      ) : null}
    </a>
  );
}
