import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import {
  X,
  CalendarDays,
  MapPin,
  ChevronRight,
  Trophy,
  Newspaper,
  Clock3,
} from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

type Organization = {
  id: string;
  name: string;
  abbreviation?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type SportEvent = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function getOrgFromResponse(json: any): Organization | null {
  return json?.organization ?? json?.data?.organization ?? null;
}

function getEventsFromResponse(json: any): SportEvent[] {
  return json?.sportEvents ?? json?.data?.sportEvents ?? [];
}

function formatEventDateRange(start?: string, end?: string) {
  if (!start) return "Date TBD";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const sameDay =
    endDate &&
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  const startText = startDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!endDate) return startText;
  if (sameDay) return startText;

  const endText = endDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startText} - ${endText}`;
}

function formatEventTime(start?: string, end?: string) {
  if (!start) return "Time TBD";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const startHasTime =
    startDate.getHours() !== 0 ||
    startDate.getMinutes() !== 0 ||
    startDate.getSeconds() !== 0;

  const endHasTime =
    !!endDate &&
    (endDate.getHours() !== 0 ||
      endDate.getMinutes() !== 0 ||
      endDate.getSeconds() !== 0);

  if (!startHasTime && !endHasTime) return "All day";

  const startText = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!endDate || !endHasTime) return startText;

  const endText = endDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${startText} - ${endText}`;
}

export default function AquaOrganizationDetailsPage(props: {
  params: { id: string };
}) {
  const [, navigate] = useLocation();
  const orgId = props?.params?.id;
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const {
    data: orgData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/organizations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const res = await apiFetch(`/organizations/${orgId}`, {
        method: "GET",
        skipAuth: true,
        noRefresh: true,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Failed to load organization.");
      }

      const org = getOrgFromResponse(json);
      if (!org) throw new Error("Organization not found in response.");
      return org;
    },
    staleTime: 60_000,
  });

  const {
    data: events = [],
    isLoading: eventsLoading,
    isError: eventsError,
    error: eventsQueryError,
  } = useQuery({
    queryKey: ["/sport-event/organization", orgId],
    enabled: !!orgId && scheduleOpen,
    queryFn: async () => {
      const res = await apiFetch(
        `/sport-event/organization/${orgId}?page=1&limit=50&order=ASC&sortBy=startDate`,
        {
          method: "GET",
          skipAuth: true,
          noRefresh: true,
        },
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Failed to load schedule.");
      }

      const arr = getEventsFromResponse(json);
      return Array.isArray(arr)
        ? [...arr].sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          )
        : [];
    },
    staleTime: 30_000,
  });

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return events.filter(
      (e) => new Date(e.endDate || e.startDate).getTime() >= now,
    ).length;
  }, [events]);

  const org = orgData as Organization | undefined;

  useEffect(() => {
    if (!org) return;

    trackEvent(AnalyticsEvents.ORGANIZATION_VIEWED, {
      organization_id: org.id,
      organization_name: org.name,
      organization_abbreviation: org.abbreviation ?? null,
      sport: "jet_ski",
      page_type: "organization_details",
    });
  }, [org?.id]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03101b] text-white">
      {/* mellow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.06),_transparent_24%),linear-gradient(to_bottom,_#04111d_0%,_#03101b_48%,_#020b14_100%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-cyan-400/6 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[88rem] overflow-x-hidden px-4 pb-8 pt-16 sm:px-6 sm:pt-10">
        {/* top hero */}
        <div className="relative overflow-hidden rounded-[30px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.94)_0%,rgba(4,17,29,0.98)_100%)] shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.05),_transparent_24%)]" />

          <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-10">
            <div className="min-w-0 max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Organization details
              </div>

              <p className="text-xs uppercase tracking-[0.26em] text-cyan-300/70">
                Aqua • Jet Ski Racing
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="max-w-full break-words text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  {org?.name || "Organization"}
                </h1>

                {org?.abbreviation ? (
                  <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/85">
                    {org.abbreviation}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                {org?.description ||
                  "View organization details, upcoming race schedule, and future updates in a more refined event-style layout."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={() => navigate("/aqua-organizations")}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
              >
                ← Back to Organizations
              </button>

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-300">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                    Upcoming
                  </div>
                  <div className="text-lg font-bold text-white">
                    {upcomingCount} events
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-white/70">
            Loading organization…
          </div>
        ) : isError ? (
          <div className="mt-8 rounded-[28px] border border-red-500/25 bg-red-500/10 p-6 text-white">
            <div className="mb-1 font-semibold">
              Failed to load organization
            </div>
            <div className="text-sm text-white/80">
              {(error as any)?.message ?? "Unknown error"}
            </div>
          </div>
        ) : !org ? (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-white/70">
            Organization not found.
          </div>
        ) : (
          <>
            {/* main org card */}
            <div className="mt-8 rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.94)_0%,rgba(4,17,29,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="flex items-start gap-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.05] sm:h-28 sm:w-28">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={`${org.name} logo`}
                        className="h-full w-full object-contain p-3"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                        No Logo
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-white sm:text-2xl">
                        {org.name}
                      </h2>

                      {org.abbreviation ? (
                        <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                          {org.abbreviation}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                      {org.description || "No description provided."}
                    </p>

                    <p className="mt-4 break-all text-[11px] uppercase tracking-[0.16em] text-white/35">
                      ID: {org.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* info blocks */}
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <InfoCard
                  icon={<Newspaper className="h-5 w-5" />}
                  title="News & Updates"
                  description="Official organization news, announcements, and updates will appear here soon."
                  muted
                />

                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.ORGANIZATION_SCHEDULE_OPENED, {
                      organization_id: org?.id ?? orgId,
                      organization_name: org?.name ?? null,
                      sport: "jet_ski",
                      page_type: "organization_details",
                    });

                    setScheduleOpen(true);
                  }}
                  className="group rounded-[24px] border border-cyan-400/12 bg-white/[0.03] p-5 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-300">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div className="text-lg font-semibold text-white">
                        Schedule
                      </div>
                      <div className="mt-2 text-sm leading-7 text-slate-300">
                        {eventsLoading && scheduleOpen
                          ? "Loading events…"
                          : upcomingCount > 0
                            ? `${upcomingCount} upcoming event${upcomingCount === 1 ? "" : "s"} available to view`
                            : "View all organization events and race dates"}
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-300 transition group-hover:border-cyan-300/25 group-hover:bg-cyan-400/8">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                <InfoCard
                  icon={<Trophy className="h-5 w-5" />}
                  title="Race Results"
                  description="Past podiums, standings, and results modules can plug into this area later."
                  muted
                />
              </div>
            </div>
          </>
        )}

        {scheduleOpen && (
          <ScheduleModal
            orgName={org?.name || "Organization"}
            events={events}
            loading={eventsLoading}
            error={eventsError ? (eventsQueryError as any)?.message : null}
            onClose={() => setScheduleOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
  muted,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border p-5 ${
        muted
          ? "border-white/10 bg-white/[0.03]"
          : "border-cyan-400/12 bg-cyan-400/[0.03]"
      }`}
    >
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-300">
        {icon}
      </div>
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  );
}

function ScheduleModal({
  orgName,
  events,
  loading,
  error,
  onClose,
}: {
  orgName: string;
  events: SportEvent[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();
  const now = Date.now();

  const upcomingEvents = [...events]
    .filter((event) => {
      const compareDate = new Date(event.endDate || event.startDate).getTime();
      return compareDate >= now;
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  const pastEvents = [...events]
    .filter((event) => {
      const compareDate = new Date(event.endDate || event.startDate).getTime();
      return compareDate < now;
    })
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

  function handleOpenEvent(eventId: string) {
    onClose();
    navigate(`/aqua-organizations/event-details/${eventId}`);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92vh] w-full flex-col overflow-hidden rounded-t-[30px] border border-white/10 bg-[#07131f] shadow-2xl sm:h-auto sm:max-h-[88vh] sm:max-w-5xl sm:rounded-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.98)_0%,rgba(6,19,31,0.98)_100%)] px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                Event schedule
              </div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                {orgName} Schedule
              </h2>
              <p className="text-sm text-white/50">
                Upcoming and past race events
              </p>
            </div>

            <Button
              onClick={onClose}
              className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-4 py-4 sm:max-h-[72vh] sm:px-6">
          {loading ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-white/70">
              Loading schedule…
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-red-500/25 bg-red-500/10 p-5 text-white">
              <div className="mb-1 font-semibold">Failed to load schedule</div>
              <div className="text-sm text-white/80">{error}</div>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-white/70">
              No race events found for this organization yet.
            </div>
          ) : (
            <div className="space-y-8">
              <EventSection
                title="Upcoming"
                tone="upcoming"
                count={upcomingEvents.length}
                emptyText="No upcoming events."
                events={upcomingEvents}
                onOpenEvent={handleOpenEvent}
              />

              <EventSection
                title="Past"
                tone="past"
                count={pastEvents.length}
                emptyText="No past events yet."
                events={pastEvents}
                onOpenEvent={handleOpenEvent}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventSection({
  title,
  tone,
  count,
  emptyText,
  events,
  onOpenEvent,
}: {
  title: string;
  tone: "upcoming" | "past";
  count: number;
  emptyText: string;
  events: SportEvent[];
  onOpenEvent: (eventId: string) => void;
}) {
  const headingClass =
    tone === "upcoming" ? "text-cyan-200/90" : "text-white/75";

  const badgeClass =
    tone === "upcoming"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
      : "border-white/15 bg-white/5 text-white/70";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className={`text-sm font-semibold uppercase tracking-[0.16em] ${headingClass}`}
        >
          {title}
        </h3>
        <span className="text-xs text-white/45">
          {count} event{count === 1 ? "" : "s"}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onOpenEvent(event.id)}
              className="group w-full rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,28,44,0.94)_0%,rgba(6,18,30,0.98)_100%)] p-5 text-left transition hover:border-cyan-300/20 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${badgeClass}`}
                    >
                      {tone === "upcoming" ? "Upcoming" : "Past"}
                    </span>
                  </div>

                  <div className="mt-3 text-base font-semibold text-white sm:text-lg">
                    <span className="line-clamp-2">{event.name}</span>
                  </div>

                  {!!event.description && (
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-white/65">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-300 transition group-hover:border-cyan-300/25 group-hover:bg-cyan-400/8">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-start gap-2 text-white/75">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                  <div>
                    {formatEventDateRange(event.startDate, event.endDate)}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-white/75">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                  <div>{formatEventTime(event.startDate, event.endDate)}</div>
                </div>

                <div className="flex items-start gap-2 text-white/75">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                  <div>{event.location || "Location TBD"}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
