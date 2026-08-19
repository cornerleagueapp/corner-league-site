import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";

import { OrganizationAdminLayout } from "../components/OrganizationAdminLayout";

import { useOrganizationAdminAccess } from "../hooks/useOrganizationAdminAccess";

import {
  useOrganizationEventRegistrations,
  useOrganizationEvents,
} from "../hooks/useOrganizationRegistrations";

import { useSyncRegistrationResultsEnrollment } from "../hooks/useOrganizationResults";

import { hasOrganizationPermission } from "../utils/organizationPermissions";

import type { RegistrationAdminEntry } from "../types/organizationRegistration";

type Props = {
  organizationId: string;
};

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
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

  return names.length ? names.join(", ") : "No classes";
}

function isConfirmed(registration: RegistrationAdminEntry) {
  return normalizeStatus(registration.status) === "confirmed";
}

function ResultsStatusBadge({
  registration,
}: {
  registration: RegistrationAdminEntry;
}) {
  const confirmed = isConfirmed(registration);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
        confirmed
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
          : "border-amber-300/20 bg-amber-300/10 text-amber-100"
      }`}
    >
      {confirmed ? "Eligible" : "Not Confirmed"}
    </span>
  );
}

export default function OrganizationResultsPage({ organizationId }: Props) {
  const accessQuery = useOrganizationAdminAccess(organizationId);

  const eventsQuery = useOrganizationEvents(organizationId);

  const events = eventsQuery.data ?? [];

  const [selectedEventId, setSelectedEventId] = useState("");

  const [search, setSearch] = useState("");

  const [syncingRegistrationId, setSyncingRegistrationId] = useState<
    string | null
  >(null);

  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());

  const [bulkSyncing, setBulkSyncing] = useState(false);

  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const [bulkError, setBulkError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEventId || !events.length) {
      return;
    }

    setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  const registrationsQuery = useOrganizationEventRegistrations(selectedEventId);

  const syncMutation = useSyncRegistrationResultsEnrollment(selectedEventId);

  const registrations = registrationsQuery.data?.registrations ?? [];

  const access = accessQuery.data;

  const canManageResults = hasOrganizationPermission(
    access,
    "manageResultsEnrollment",
  );

  const confirmedRegistrations = useMemo(
    () => registrations.filter(isConfirmed),
    [registrations],
  );

  const totalEntries = useMemo(
    () =>
      confirmedRegistrations.reduce(
        (total, registration) => total + (registration.entries?.length ?? 0),
        0,
      ),
    [confirmedRegistrations],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return registrations;
    }

    return registrations.filter((registration) => {
      const values = [
        getRegistrationName(registration),

        registration.contactEmail,

        registration.status,

        registration.confirmationNumber,

        getClassNames(registration),
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(needle),
      );
    });
  }, [registrations, search]);

  const syncOne = async (registration: RegistrationAdminEntry) => {
    const id = registration.id ?? registration.registrationId;

    if (!id) {
      return;
    }

    const registrationId = String(id);

    setSyncingRegistrationId(registrationId);

    try {
      await syncMutation.mutateAsync(registrationId);

      setSuccessIds((previous) => {
        const next = new Set(previous);

        next.add(registrationId);

        return next;
      });
    } finally {
      setSyncingRegistrationId(null);
    }
  };

  const syncAll = async () => {
    if (!canManageResults || !confirmedRegistrations.length) {
      return;
    }

    setBulkSyncing(true);

    setBulkError(null);

    setBulkProgress({
      current: 0,

      total: confirmedRegistrations.length,
    });

    let completed = 0;

    try {
      for (const registration of confirmedRegistrations) {
        const id = registration.id ?? registration.registrationId;

        if (!id) {
          continue;
        }

        const registrationId = String(id);

        try {
          await syncMutation.mutateAsync(registrationId);

          setSuccessIds((previous) => {
            const next = new Set(previous);

            next.add(registrationId);

            return next;
          });
        } catch (error) {
          console.error(
            "Results enrollment sync failed:",
            registrationId,
            error,
          );
        }

        completed += 1;

        setBulkProgress({
          current: completed,

          total: confirmedRegistrations.length,
        });
      }
    } catch (error: any) {
      setBulkError(
        error?.message ?? "Unable to finish results enrollment sync.",
      );
    } finally {
      setBulkSyncing(false);
    }
  };

  return (
    <OrganizationAdminLayout organizationId={organizationId}>
      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Competition Operations
            </div>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
              Results Enrollment
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Confirmed race registrations are automatically enrolled into the
              results system. Use this screen to audit and retry enrollment when
              an event needs reconciliation.
            </p>
          </div>

          <div className="w-full xl:w-[360px]">
            <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
              Event
            </label>

            <select
              value={selectedEventId}
              onChange={(event) => {
                setSelectedEventId(event.target.value);

                setSearch("");

                setSuccessIds(new Set());
              }}
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

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <Users className="h-5 w-5 text-cyan-200" />

            <div className="mt-4 text-2xl font-black text-white">
              {registrations.length}
            </div>

            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Registrations
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <UserCheck className="h-5 w-5 text-emerald-200" />

            <div className="mt-4 text-2xl font-black text-white">
              {confirmedRegistrations.length}
            </div>

            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Confirmed / Eligible
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <Trophy className="h-5 w-5 text-[#FFB199]" />

            <div className="mt-4 text-2xl font-black text-white">
              {totalEntries}
            </div>

            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Class Entries
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10">
                <ShieldCheck className="h-5 w-5 text-cyan-200" />
              </div>

              <div>
                <h3 className="text-sm font-black text-white">
                  Results reconciliation
                </h3>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                  Running this process again is intended as a recovery tool. The
                  backend determines the current enrollment state and reconciles
                  each confirmed registration.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={
                bulkSyncing ||
                !canManageResults ||
                confirmedRegistrations.length === 0
              }
              onClick={syncAll}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#04101C] transition hover:bg-cyan-200 disabled:opacity-40"
            >
              {bulkSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync All Confirmed
            </button>
          </div>

          {bulkProgress ? (
            <div className="mt-4">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                <span>Progress</span>

                <span>
                  {bulkProgress.current}/{bulkProgress.total}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-all"
                  style={{
                    width: `${
                      bulkProgress.total
                        ? (bulkProgress.current / bulkProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {bulkError ? (
            <div className="mt-4 flex gap-3 rounded-2xl border border-red-300/15 bg-red-300/[0.05] p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />

              <p className="text-xs text-red-100/70">{bulkError}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-7 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-white">Registration Enrollment</h3>

              <p className="mt-1 text-xs text-slate-500">
                {filtered.length} registrations
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search racer, class, confirmation..."
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none"
              />
            </div>
          </div>

          {eventsQuery.isLoading || registrationsQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-200" />
            </div>
          ) : !filtered.length ? (
            <div className="px-5 py-14 text-center">
              <Trophy className="mx-auto h-7 w-7 text-slate-700" />

              <h4 className="mt-4 font-black text-white">
                No registrations found
              </h4>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px]">
                <thead className="bg-black/20">
                  <tr className="text-left text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-5 py-3">Racer</th>

                    <th className="px-5 py-3">Classes</th>

                    <th className="px-5 py-3">Registration</th>

                    <th className="px-5 py-3">Results Eligibility</th>

                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.map((registration) => {
                    const id = String(
                      registration.id ??
                        registration.registrationId ??
                        registration.confirmationNumber ??
                        "",
                    );

                    const confirmed = isConfirmed(registration);

                    const syncing = syncingRegistrationId === id;

                    const synced = successIds.has(id);

                    return (
                      <tr
                        key={id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-black text-white">
                            {getRegistrationName(registration)}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {registration.contactEmail ??
                              registration.registeredByUser?.email ??
                              "—"}
                          </div>
                        </td>

                        <td className="max-w-[300px] px-5 py-4 text-sm text-slate-300">
                          {getClassNames(registration)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-bold capitalize text-slate-300">
                            {registration.status ?? "pending"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {synced ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.11em] text-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Synced
                            </span>
                          ) : (
                            <ResultsStatusBadge registration={registration} />
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={
                              !confirmed ||
                              !canManageResults ||
                              syncing ||
                              bulkSyncing ||
                              !id
                            }
                            onClick={() => syncOne(registration)}
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 text-[9px] font-black uppercase tracking-[0.11em] text-cyan-200 transition hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            {syncing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}

                            {synced ? "Sync Again" : "Sync Results"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {syncMutation.error ? (
            <div className="border-t border-red-300/10 bg-red-300/[0.04] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />

                <p className="text-xs leading-5 text-red-100/70">
                  {(syncMutation.error as any)?.message ??
                    "Unable to sync results enrollment."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </OrganizationAdminLayout>
  );
}
