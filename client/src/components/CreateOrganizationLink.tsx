import { Building2 } from "lucide-react";
export const CREATE_ORGANIZATION_URL =
  "https://admin.cornerleague.com/create-organization?mode=login";
export function CreateOrganizationLink({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={CREATE_ORGANIZATION_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      aria-label="Create your own Org"
      title="Create your own Org"
      className={`mb-3 flex min-h-12 items-center gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-sm font-bold text-cyan-100 hover:bg-cyan-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${collapsed ? "h-12 w-12 justify-center mx-auto" : "w-full px-3 py-3"}`}
    >
      <Building2 className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed ? <span>Create your own Org</span> : null}
    </a>
  );
}
