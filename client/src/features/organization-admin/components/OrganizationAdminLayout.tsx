import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationAdminAccess } from "../hooks/useOrganizationAdminAccess";
import { getOrganizationRoleLabel } from "../utils/organizationPermissions";

type Props = {
  organizationId: string;
  children: ReactNode;
};

function OrganizationAdminLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#07111F] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-cyan-300" />

        <h2 className="mt-5 text-lg font-black uppercase tracking-[0.08em] text-white">
          Loading organization access
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Checking your organization administration permissions.
        </p>
      </div>
    </div>
  );
}

function OrganizationAdminDenied() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-[30px] border border-red-300/15 bg-[#07111F] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <ShieldCheck className="mx-auto h-10 w-10 text-red-300" />

        <div className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-red-300">
          Access Restricted
        </div>

        <h1 className="mt-2 text-2xl font-black uppercase text-white">
          Organization admin access required
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-300">
          Your account does not currently have permission to administer this
          organization.
        </p>

        <Link
          href="/aqua-organizations"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Link>
      </div>
    </div>
  );
}

export function OrganizationAdminLayout({ organizationId, children }: Props) {
  const { user } = useAuth();

  const accessQuery = useOrganizationAdminAccess(organizationId);

  if (accessQuery.isLoading) {
    return <OrganizationAdminLoading />;
  }

  if (accessQuery.isError || !accessQuery.data) {
    return <OrganizationAdminDenied />;
  }

  const access = accessQuery.data;

  if (!access.canAccessAdmin) {
    return <OrganizationAdminDenied />;
  }

  const roleLabel = getOrganizationRoleLabel(access);

  const isSuperAdmin = String(user?.role ?? "").toUpperCase() === "SUPER_ADMIN";

  return (
    <div className="min-h-full bg-[#030913] text-white">
      <div className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {access.isGlobalAdmin ? (
          <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                <ShieldCheck className="h-5 w-5 text-cyan-200" />
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  Corner League Administration
                </div>

                <div className="mt-1 text-sm font-bold text-white">
                  Viewing this organization with platform-level administrator
                  access.
                </div>
              </div>
            </div>

            {isSuperAdmin ? (
              <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                Super Admin
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#07111F] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <header className="border-b border-white/10 px-4 py-5 sm:px-6 lg:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <Link
                  href={`/aqua-organizations/${encodeURIComponent(
                    organizationId,
                  )}`}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-cyan-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Organization Profile
                </Link>

                <div className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Organization Administration
                </div>

                <h1 className="mt-1 truncate text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
                  Admin Console
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                  Organization ID:{" "}
                  <span className="font-mono text-slate-300">
                    {organizationId}
                  </span>
                </p>
              </div>

              <div className="w-fit rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Access Level
                </div>

                <div className="mt-1 text-sm font-black text-white">
                  {roleLabel}
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 p-4 sm:p-6 lg:p-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
