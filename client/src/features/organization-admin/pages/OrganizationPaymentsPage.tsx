import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Loader2,
  Search,
  Settings2,
  WalletCards,
} from "lucide-react";

import { OrganizationAdminLayout } from "../components/OrganizationAdminLayout";

import { RegistrationPaymentActionModal } from "../components/RegistrationPaymentActionModal";

import { useOrganizationAdminAccess } from "../hooks/useOrganizationAdminAccess";

import {
  useOrganizationEventRegistrations,
  useOrganizationEvents,
  useRegistrationDashboardMetrics,
} from "../hooks/useOrganizationRegistrations";

import {
  useCreateOrganizationStripeAccount,
  useOrganizationStripeDashboardLink,
  useOrganizationStripeOnboardingLink,
  useOrganizationStripeStatus,
} from "../hooks/useOrganizationPayments";

import { hasOrganizationPermission } from "../utils/organizationPermissions";

import type { RegistrationAdminEntry } from "../types/organizationRegistration";

type Props = {
  organizationId: string;
};

function formatMoney(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",

    currency: "USD",
  }).format(Number(cents ?? 0) / 100);
}

function registrationName(registration: RegistrationAdminEntry) {
  return (
    (registration.racer?.name ??
      [registration.contactFirstName, registration.contactLastName]
        .filter(Boolean)
        .join(" ")) ||
    registration.registeredByUser?.username ||
    registration.contactEmail ||
    "Unknown Racer"
  );
}

export default function OrganizationPaymentsPage({ organizationId }: Props) {
  const accessQuery = useOrganizationAdminAccess(organizationId);

  const eventsQuery = useOrganizationEvents(organizationId);

  const events = eventsQuery.data ?? [];

  const [selectedEventId, setSelectedEventId] = useState("");

  const [search, setSearch] = useState("");

  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationAdminEntry | null>(null);

  useEffect(() => {
    if (selectedEventId || !events.length) {
      return;
    }

    setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  const registrationsQuery = useOrganizationEventRegistrations(selectedEventId);

  const registrations = registrationsQuery.data?.registrations ?? [];

  const metrics = useRegistrationDashboardMetrics(registrations);

  const stripeQuery = useOrganizationStripeStatus(organizationId);

  const stripeConnectMutation =
    useCreateOrganizationStripeAccount(organizationId);

  const onboardingMutation =
    useOrganizationStripeOnboardingLink(organizationId);

  const dashboardMutation = useOrganizationStripeDashboardLink(organizationId);

  const access = accessQuery.data;

  const canManagePayments = hasOrganizationPermission(access, "managePayments");

  const canConfirmCash = hasOrganizationPermission(
    access,
    "confirmCashPayments",
  );

  const canAdjust = hasOrganizationPermission(access, "applyPriceAdjustments");

  const canWaive = hasOrganizationPermission(access, "waiveRegistrationFees");

  const canRefund = hasOrganizationPermission(access, "issueRefunds");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return registrations;
    }

    return registrations.filter((registration) => {
      const haystack = [
        registrationName(registration),

        registration.contactEmail,

        registration.paymentStatus,

        registration.status,

        registration.checkoutMethod,

        registration.confirmationNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [registrations, search]);

  const openExternal = (response: any) => {
    const url =
      response?.url ?? response?.onboardingUrl ?? response?.dashboardUrl;

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const stripe = stripeQuery.data;

  const stripeConnected = Boolean(
    stripe?.connected || stripe?.accountId || stripe?.stripeAccountId,
  );

  return (
    <OrganizationAdminLayout organizationId={organizationId}>
      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Finance Operations
            </div>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
              Payments
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Manage Stripe payouts, cash and manual payments, registration
              adjustments, waived balances, and refunds.
            </p>
          </div>

          <div className="w-full xl:w-[360px]">
            <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
              Event
            </label>

            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#07111F] px-4 text-sm font-bold text-white outline-none"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-7 rounded-[26px] border border-white/10 bg-white/[0.025] p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10">
                <WalletCards className="h-5 w-5 text-purple-200" />
              </div>

              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.17em] text-purple-200">
                  Stripe Connect
                </div>

                <h3 className="mt-1 text-lg font-black text-white">
                  Organization Payments Account
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Stripe Express handles online payments and organizer payouts.
                </p>
              </div>
            </div>

            {stripeQuery.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {!stripeConnected ? (
                  <button
                    type="button"
                    disabled={
                      !canManagePayments || stripeConnectMutation.isPending
                    }
                    onClick={async () => {
                      const response = await stripeConnectMutation.mutateAsync({
                        country: "US",
                      });

                      openExternal(response);
                    }}
                    className="rounded-full bg-cyan-300 px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#04101C] disabled:opacity-40"
                  >
                    Connect Stripe
                  </button>
                ) : (
                  <>
                    {!stripe?.detailsSubmitted || !stripe?.chargesEnabled ? (
                      <button
                        type="button"
                        disabled={onboardingMutation.isPending}
                        onClick={async () => {
                          const response =
                            await onboardingMutation.mutateAsync();

                          openExternal(response);
                        }}
                        className="rounded-full bg-cyan-300 px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#04101C]"
                      >
                        Continue Setup
                      </button>
                    ) : null}

                    <button
                      type="button"
                      disabled={dashboardMutation.isPending}
                      onClick={async () => {
                        const response = await dashboardMutation.mutateAsync();

                        openExternal(response);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                    >
                      Stripe Dashboard
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {stripeConnected ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
                <CheckCircle2
                  className={`h-4 w-4 ${
                    stripe?.chargesEnabled
                      ? "text-emerald-200"
                      : "text-amber-200"
                  }`}
                />

                <div className="mt-3 text-sm font-black text-white">
                  {stripe?.chargesEnabled ? "Enabled" : "Pending"}
                </div>

                <div className="mt-1 text-[8px] font-black uppercase tracking-[0.13em] text-slate-600">
                  Charges
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
                <Banknote
                  className={`h-4 w-4 ${
                    stripe?.payoutsEnabled
                      ? "text-emerald-200"
                      : "text-amber-200"
                  }`}
                />

                <div className="mt-3 text-sm font-black text-white">
                  {stripe?.payoutsEnabled ? "Enabled" : "Pending"}
                </div>

                <div className="mt-1 text-[8px] font-black uppercase tracking-[0.13em] text-slate-600">
                  Payouts
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
                <Settings2 className="h-4 w-4 text-cyan-200" />

                <div className="mt-3 text-sm font-black text-white">
                  {stripe?.detailsSubmitted ? "Complete" : "Incomplete"}
                </div>

                <div className="mt-1 text-[8px] font-black uppercase tracking-[0.13em] text-slate-600">
                  Account Details
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <CircleDollarSign className="h-5 w-5 text-emerald-200" />

            <div className="mt-4 text-2xl font-black text-white">
              {formatMoney(metrics.collectedRevenueCents)}
            </div>

            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Collected
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <CircleDollarSign className="h-5 w-5 text-amber-200" />

            <div className="mt-4 text-2xl font-black text-white">
              {formatMoney(metrics.outstandingRevenueCents)}
            </div>

            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Outstanding
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <CheckCircle2 className="h-5 w-5 text-cyan-200" />

            <div className="mt-4 text-2xl font-black text-white">
              {metrics.paid}
            </div>

            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Paid
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <AlertTriangle className="h-5 w-5 text-red-200" />

            <div className="mt-4 text-2xl font-black text-white">
              {metrics.unpaid}
            </div>

            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Unpaid / Partial
            </div>
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-white">Registration Payments</h3>

              <p className="mt-1 text-xs text-slate-500">
                {filtered.length} registrations
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search racer, payment status..."
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none"
              />
            </div>
          </div>

          {registrationsQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-200" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-black/20">
                  <tr className="text-left text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-5 py-3">Racer</th>

                    <th className="px-5 py-3">Total</th>

                    <th className="px-5 py-3">Paid</th>

                    <th className="px-5 py-3">Outstanding</th>

                    <th className="px-5 py-3">Payment Status</th>

                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.map((registration) => {
                    const total = Number(registration.totalCents ?? 0);

                    const paid = Number(registration.amountPaidCents ?? 0);

                    const outstanding = Math.max(0, total - paid);

                    return (
                      <tr
                        key={String(
                          registration.id ??
                            registration.registrationId ??
                            registration.confirmationNumber,
                        )}
                        className="hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-black text-white">
                            {registrationName(registration)}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {registration.contactEmail ?? "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4 font-black text-white">
                          {formatMoney(total)}
                        </td>

                        <td className="px-5 py-4 text-emerald-200">
                          {formatMoney(paid)}
                        </td>

                        <td className="px-5 py-4 text-amber-100">
                          {formatMoney(outstanding)}
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-300">
                          {registration.paymentStatus ?? "—"}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={!canManagePayments}
                            onClick={() =>
                              setSelectedRegistration(registration)
                            }
                            className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-[9px] font-black uppercase tracking-[0.11em] text-cyan-200 disabled:opacity-30"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <RegistrationPaymentActionModal
        open={!!selectedRegistration}
        eventId={selectedEventId}
        registration={selectedRegistration}
        allowedActions={{
          cash: canConfirmCash,

          manual: canManagePayments,

          adjustment: canAdjust,

          waive: canWaive,

          refund: canRefund,
        }}
        onClose={() => setSelectedRegistration(null)}
      />
    </OrganizationAdminLayout>
  );
}
