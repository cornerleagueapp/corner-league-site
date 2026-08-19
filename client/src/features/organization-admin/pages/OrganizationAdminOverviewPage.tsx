import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  ListOrdered,
  Settings,
  Trophy,
  Users,
} from "lucide-react";

import { OrganizationAdminLayout } from "../components/OrganizationAdminLayout";

import { useOrganizationAdminAccess } from "../hooks/useOrganizationAdminAccess";

import { hasOrganizationPermission } from "../utils/organizationPermissions";

type Props = {
  organizationId: string;
};

type OverviewCardProps = {
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ComponentType<{
    className?: string;
  }>;
};

function OverviewCard({
  title,
  description,
  enabled,
  icon: Icon,
}: OverviewCardProps) {
  return (
    <div
      className={`rounded-[24px] border p-5 ${
        enabled
          ? "border-white/10 bg-white/[0.035]"
          : "border-white/[0.06] bg-white/[0.015] opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <Icon className="h-5 w-5 text-cyan-200" />
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
            enabled
              ? "bg-emerald-400/10 text-emerald-200"
              : "bg-white/[0.05] text-slate-500"
          }`}
        >
          {enabled ? "Available" : "Restricted"}
        </span>
      </div>

      <h3 className="mt-5 text-base font-black text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export default function OrganizationAdminOverviewPage({
  organizationId,
}: Props) {
  const accessQuery = useOrganizationAdminAccess(organizationId);

  const access = accessQuery.data;

  return (
    <OrganizationAdminLayout organizationId={organizationId}>
      <section>
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
          Dashboard
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
          Organization Overview
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          Manage registration, event operations, race scheduling, payments,
          results, administrators, and organization settings from one place.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <OverviewCard
            title="Registrations"
            description="View private registrations, racer entries, statuses, and event rosters."
            enabled={hasOrganizationPermission(
              access,
              "viewPrivateRegistrations",
            )}
            icon={ClipboardList}
          />

          <OverviewCard
            title="Race Days"
            description="Configure race days, event classes, rounds, and registration availability."
            enabled={hasOrganizationPermission(access, "manageEventDays")}
            icon={CalendarDays}
          />

          <OverviewCard
            title="Race Scheduling"
            description="Generate safe race orders, manage conflicts, combine classes, and publish schedules."
            enabled={hasOrganizationPermission(access, "manageRaceScheduling")}
            icon={ListOrdered}
          />

          <OverviewCard
            title="Payments"
            description="Review registration payments, cash confirmations, refunds, and Stripe activity."
            enabled={hasOrganizationPermission(access, "managePayments")}
            icon={CircleDollarSign}
          />

          <OverviewCard
            title="Results"
            description="Manage registration enrollment into race results and competition workflows."
            enabled={hasOrganizationPermission(
              access,
              "manageResultsEnrollment",
            )}
            icon={Trophy}
          />

          <OverviewCard
            title="Organization Members"
            description="Manage organization staff roles and granular administrative permissions."
            enabled={hasOrganizationPermission(access, "manageMembers")}
            icon={Users}
          />

          <OverviewCard
            title="Settings"
            description="Configure event, class, registration, pricing, and operational settings."
            enabled={hasOrganizationPermission(access, "manageEventSettings")}
            icon={Settings}
          />
        </div>

        {access?.isGlobalAdmin ? (
          <div className="mt-7 rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.05] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
              Platform Administrator
            </div>

            <h3 className="mt-2 text-lg font-black text-white">
              Full organization access enabled
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Your Corner League administrator role grants access to this
              organization without requiring an organization membership.
            </p>
          </div>
        ) : null}
      </section>
    </OrganizationAdminLayout>
  );
}
