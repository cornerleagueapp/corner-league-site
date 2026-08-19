import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  Search,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { OrganizationAdminLayout } from "../components/OrganizationAdminLayout";
import {
  useOrganizationEventRegistrations,
  useOrganizationEvents,
  useRegistrationDashboardMetrics,
} from "../hooks/useOrganizationRegistrations";
import { useRegistrationEventConfiguration } from "../hooks/useOrganizationSettings";
import type { RegistrationAdminEntry } from "../types/organizationRegistration";

type Props = {
  organizationId: string;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",

    currency: "USD",
  }).format(cents / 100);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",

    day: "numeric",

    year: "numeric",
  });
}

function getRegistrationName(registration: RegistrationAdminEntry) {
  const racerName = registration.racer?.name?.trim();

  if (racerName) {
    return racerName;
  }

  const contactName = [
    registration.contactFirstName,
    registration.contactLastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (contactName) {
    return contactName;
  }

  return (
    registration.registeredByUser?.username ??
    registration.contactEmail ??
    "Unknown Racer"
  );
}

function getClassNames(registration: RegistrationAdminEntry) {
  const names =
    registration.entries
      ?.map((entry) => {
        return (
          entry.eventClass?.displayName?.trim() ||
          entry.eventClass?.division?.name ||
          entry.division?.name ||
          null
        );
      })
      .filter((value): value is string => !!value) ?? [];

  if (!names.length) {
    return "No classes";
  }

  return names.join(", ");
}

function statusBadgeClass(status?: string) {
  const normalized = String(status ?? "").toLowerCase();

  if (normalized === "confirmed") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "border-red-300/20 bg-red-300/10 text-red-200";
  }

  if (normalized === "refunded") {
    return "border-purple-300/20 bg-purple-300/10 text-purple-200";
  }

  return "border-amber-300/20 bg-amber-300/10 text-amber-100";
}

type MetricProps = {
  label: string;

  value: string | number;

  helper?: string;

  icon: React.ComponentType<{
    className?: string;
  }>;
};

function Metric({ label, value, helper, icon: Icon }: MetricProps) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4 sm:p-5">
      <Icon className="h-5 w-5 text-cyan-200" />

      <div className="mt-4 text-2xl font-black text-white">{value}</div>

      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/45">
        {label}
      </div>

      {helper ? (
        <div className="mt-2 text-xs text-slate-500">{helper}</div>
      ) : null}
    </div>
  );
}

export default function OrganizationRegistrationsPage({
  organizationId,
}: Props) {
  const eventsQuery = useOrganizationEvents(organizationId);

  const events = eventsQuery.data ?? [];

  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (selectedEventId || !events.length) {
      return;
    }

    const now = Date.now();

    const nextUpcoming = [...events]
      .filter((event) => {
        if (!event.startDate) {
          return false;
        }

        const date = new Date(event.startDate).getTime();

        return !Number.isNaN(date) && date >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.startDate ?? 0).getTime() -
          new Date(b.startDate ?? 0).getTime(),
      )[0];

    setSelectedEventId(nextUpcoming?.id ?? events[0].id);
  }, [events, selectedEventId]);

  const configurationQuery = useRegistrationEventConfiguration(selectedEventId);

  const hasRegistrationConfiguration =
    configurationQuery.isSuccess && !!configurationQuery.data;

  const registrationsQuery = useOrganizationEventRegistrations(
    selectedEventId,
    hasRegistrationConfiguration,
  );

  const registrations = registrationsQuery.data?.registrations ?? [];

  const metrics = useRegistrationDashboardMetrics(registrations);

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;

  const filteredRegistrations = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return registrations;
    }

    return registrations.filter((registration) => {
      const values = [
        getRegistrationName(registration),

        registration.contactEmail,

        registration.confirmationNumber,

        registration.status,

        registration.paymentStatus,

        getClassNames(registration),
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalized),
      );
    });
  }, [registrations, search]);

  return (
    <OrganizationAdminLayout organizationId={organizationId}>
      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Registration Management
            </div>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
              Registrations
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Review event registrations, payment state, confirmation status,
              class entries, and racer information.
            </p>
          </div>

          <div className="w-full xl:w-[360px]">
            <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
              Event
            </label>

            <select
              value={selectedEventId}
              onChange={(event) => {
                setSelectedEventId(event.target.value);

                setSearch("");
              }}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#07111F] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/30"
            >
              {!events.length ? (
                <option value="">No events available</option>
              ) : null}

              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {eventsQuery.isLoading ? (
          <div className="mt-10 flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
          </div>
        ) : eventsQuery.isError ? (
          <div className="mt-8 rounded-[24px] border border-red-300/15 bg-red-300/[0.05] p-6">
            <h3 className="font-black text-red-100">
              Unable to load organization events
            </h3>

            <p className="mt-2 text-sm text-red-100/60">
              Refresh the page and try again.
            </p>
          </div>
        ) : !events.length ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-white/10 bg-white/[0.025] p-10 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-slate-600" />

            <h3 className="mt-4 font-black text-white">No events found</h3>

            <p className="mt-2 text-sm text-slate-500">
              Create an event for this organization before managing
              registrations.
            </p>
          </div>
        ) : (
          <>
            {selectedEvent ? (
              <div className="mt-7 rounded-[22px] border border-cyan-300/10 bg-cyan-300/[0.035] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-black text-white">
                      {selectedEvent.name}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {formatDate(selectedEvent.startDate)}
                      {selectedEvent.endDate
                        ? ` – ${formatDate(selectedEvent.endDate)}`
                        : ""}
                    </div>
                  </div>

                  {selectedEvent.location ? (
                    <div className="text-xs font-bold text-slate-400">
                      {selectedEvent.location}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {configurationQuery.isLoading ? (
              <div className="mt-10 flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
              </div>
            ) : configurationQuery.isError ? (
              <div className="mt-8 rounded-[26px] border border-dashed border-cyan-300/15 bg-cyan-300/[0.025] px-6 py-12 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-cyan-200/50" />

                <h3 className="mt-5 text-lg font-black uppercase text-white">
                  Registration Not Set Up
                </h3>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                  Registration has not been configured for this event yet. Set
                  up registration before accepting racer entries.
                </p>

                <a
                  href={`/organizations/${encodeURIComponent(
                    organizationId,
                  )}/admin/settings?eventId=${encodeURIComponent(selectedEventId)}`}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-cyan-300 px-6 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200"
                >
                  Set Up Registration
                </a>
              </div>
            ) : registrationsQuery.isLoading ? (
              <div className="mt-10 flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
              </div>
            ) : registrationsQuery.isError ? (
              <div className="mt-8 rounded-[24px] border border-red-300/15 bg-red-300/[0.05] p-6">
                <h3 className="font-black text-red-100">
                  Unable to load registrations
                </h3>

                <p className="mt-2 text-sm text-red-100/60">
                  Check your organization permissions and try again.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label="Registrations"
                    value={metrics.totalRegistrations}
                    helper={`${metrics.confirmed} confirmed`}
                    icon={Users}
                  />

                  <Metric
                    label="Pending"
                    value={metrics.pending}
                    helper={`${metrics.cancelled} cancelled`}
                    icon={Clock3}
                  />

                  <Metric
                    label="Collected"
                    value={formatMoney(metrics.collectedRevenueCents)}
                    helper={`${metrics.paid} paid registrations`}
                    icon={CircleDollarSign}
                  />

                  <Metric
                    label="Outstanding"
                    value={formatMoney(metrics.outstandingRevenueCents)}
                    helper={`${metrics.unpaid} unpaid / incomplete`}
                    icon={UserRound}
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.04] p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-200" />

                    <div>
                      <div className="text-lg font-black text-white">
                        {metrics.confirmed}
                      </div>

                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100/60">
                        Confirmed
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-4">
                    <Clock3 className="h-5 w-5 text-amber-200" />

                    <div>
                      <div className="text-lg font-black text-white">
                        {metrics.pending}
                      </div>

                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-100/60">
                        Pending
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-red-300/10 bg-red-300/[0.04] p-4">
                    <XCircle className="h-5 w-5 text-red-200" />

                    <div>
                      <div className="text-lg font-black text-white">
                        {metrics.cancelled + metrics.refunded}
                      </div>

                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-red-100/60">
                        Cancelled / Refunded
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-7 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025]">
                  <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-black text-white">
                        Event Registrations
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {filteredRegistrations.length} visible registrations
                      </p>
                    </div>

                    <div className="relative w-full sm:max-w-sm">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search racer, email, class..."
                        className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/25"
                      />
                    </div>
                  </div>

                  {!filteredRegistrations.length ? (
                    <div className="px-5 py-14 text-center">
                      <Users className="mx-auto h-7 w-7 text-slate-700" />

                      <h4 className="mt-4 font-black text-white">
                        No registrations found
                      </h4>

                      <p className="mt-2 text-sm text-slate-500">
                        {search
                          ? "Try a different search."
                          : "No racers have registered for this event yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[900px] w-full">
                        <thead className="bg-black/20">
                          <tr className="text-left text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                            <th className="px-5 py-3">Racer</th>

                            <th className="px-5 py-3">Classes</th>

                            <th className="px-5 py-3">Registration</th>

                            <th className="px-5 py-3">Payment</th>

                            <th className="px-5 py-3">Total</th>

                            <th className="px-5 py-3">Created</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-white/[0.06]">
                          {filteredRegistrations.map((registration) => {
                            const id =
                              registration.id ??
                              registration.registrationId ??
                              registration.confirmationNumber ??
                              `${getRegistrationName(
                                registration,
                              )}-${registration.createdAt}`;

                            return (
                              <tr
                                key={String(id)}
                                className="transition hover:bg-white/[0.025]"
                              >
                                <td className="px-5 py-4">
                                  <div className="font-black text-white">
                                    {getRegistrationName(registration)}
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    {registration.contactEmail ??
                                      registration.registeredByUser?.email ??
                                      "No email"}
                                  </div>
                                </td>

                                <td className="max-w-[260px] px-5 py-4 text-sm text-slate-300">
                                  {getClassNames(registration)}
                                </td>

                                <td className="px-5 py-4">
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${statusBadgeClass(
                                      registration.status,
                                    )}`}
                                  >
                                    {registration.status ?? "pending"}
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-sm font-bold text-slate-300">
                                  {registration.paymentStatus ??
                                    registration.checkoutMethod ??
                                    "—"}
                                </td>

                                <td className="px-5 py-4 text-sm font-black text-white">
                                  {formatMoney(
                                    Number(registration.totalCents ?? 0),
                                  )}
                                </td>

                                <td className="px-5 py-4 text-sm text-slate-500">
                                  {formatDate(registration.createdAt)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </OrganizationAdminLayout>
  );
}
