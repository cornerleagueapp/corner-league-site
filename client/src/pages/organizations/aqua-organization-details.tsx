import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { X, CalendarDays, MapPin, Clock, ChevronRight } from "lucide-react";

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
      const res = await apiFetch(`/organizations/${orgId}`, { method: "GET" });

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
        { method: "GET" },
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

  return (
    <div className="mx-auto w-full max-w-[80rem] overflow-x-hidden px-4 sm:px-6 pt-16 sm:pt-10 pb-6">
      <div className="mb-6 flex items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">
            Jet Ski
          </p>
          <h1 className="text-2xl font-bold text-white truncate">
            {org?.name || "Organization"}
          </h1>
          <p className="text-sm text-white/70">News • Schedule • Results</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/aqua-organizations")}
          className="shrink-0 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
        >
          ← Back
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Loading organization…
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-white">
          <div className="font-semibold mb-1">Failed to load organization</div>
          <div className="text-sm text-white/80">
            {(error as any)?.message ?? "Unknown error"}
          </div>
        </div>
      ) : !org ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Organization not found.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={`${org.name} logo`}
                  className="h-full w-full object-contain p-2"
                  loading="lazy"
                />
              ) : (
                <span className="text-white/50 text-xs">Logo</span>
              )}
            </div>

            <div className="min-w-0 w-full">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <div className="text-white text-lg font-semibold break-words w-full sm:w-auto sm:truncate">
                  {org.name}
                </div>

                {org.abbreviation ? (
                  <span className="shrink-0 rounded-full border border-white/15 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-white/65">
                    {org.abbreviation}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 text-white/70">
                {org.description || "No description provided."}
              </div>

              <div className="mt-4 text-[11px] text-white/40 break-all max-w-full">
                ID: {org.id}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70">
              <div className="font-semibold text-white mb-1">
                News & Updates
              </div>
              Coming soon…
            </div>

            <button
              type="button"
              onClick={() => setScheduleOpen(true)}
              className="rounded-2xl border border-white/10 bg-black/20 p-5 text-left text-white/70 hover:bg-white/[0.06] transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-white mb-1">Schedule</div>
                  <div>
                    {eventsLoading && scheduleOpen
                      ? "Loading events…"
                      : upcomingCount > 0
                        ? `${upcomingCount} upcoming event${upcomingCount === 1 ? "" : "s"}`
                        : "Tap to view all events"}
                  </div>
                </div>
                <CalendarDays className="h-5 w-5 text-white/60" />
              </div>
            </button>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70">
              <div className="font-semibold text-white mb-1">Race Results</div>
              Coming soon…
            </div>
          </div>
        </div>
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
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:max-w-4xl rounded-t-3xl sm:rounded-2xl border border-white/10 bg-[#0b0f18] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">
              {orgName} Schedule
            </h2>
            <p className="text-sm text-white/50">
              Upcoming and past race events
            </p>
          </div>

          <Button
            onClick={onClose}
            className="bg-white/10 text-white hover:bg-white/15 border border-white/10"
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>

        <div className="max-h-[calc(90vh-80px)] sm:max-h-[70vh] overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
              Loading schedule…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-white">
              <div className="font-semibold mb-1">Failed to load schedule</div>
              <div className="text-sm text-white/80">{error}</div>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
              No race events found for this organization yet.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/90">
                    Upcoming
                  </h3>
                  <span className="text-xs text-white/45">
                    {upcomingEvents.length} event
                    {upcomingEvents.length === 1 ? "" : "s"}
                  </span>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
                    No upcoming events.
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => handleOpenEvent(event.id)}
                      className="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 hover:bg-white/[0.08] transition"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-white font-semibold text-base sm:text-lg flex items-center gap-2">
                            <span className="truncate">{event.name}</span>
                          </div>

                          {!!event.description && (
                            <p className="mt-1 text-sm text-white/65 whitespace-pre-wrap line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="self-start rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-cyan-200">
                            Upcoming
                          </span>
                          <ChevronRight className="h-4 w-4 text-white/35" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2 text-white/75">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                          <div>
                            {formatEventDateRange(
                              event.startDate,
                              event.endDate,
                            )}
                          </div>
                        </div>

                        {/* <div className="flex items-start gap-2 text-white/75">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                          <div>
                            {formatEventTime(event.startDate, event.endDate)}
                          </div>
                        </div> */}

                        <div className="flex items-start gap-2 text-white/75 sm:col-span-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                          <div>{event.location || "Location TBD"}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/75">
                    Past
                  </h3>
                  <span className="text-xs text-white/45">
                    {pastEvents.length} event
                    {pastEvents.length === 1 ? "" : "s"}
                  </span>
                </div>

                {pastEvents.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
                    No past events yet.
                  </div>
                ) : (
                  pastEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => handleOpenEvent(event.id)}
                      className="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 hover:bg-white/[0.08] transition"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-white font-semibold text-base sm:text-lg flex items-center gap-2">
                            <span className="truncate">{event.name}</span>
                          </div>

                          {!!event.description && (
                            <p className="mt-1 text-sm text-white/65 whitespace-pre-wrap line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="self-start rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/70">
                            Past
                          </span>
                          <ChevronRight className="h-4 w-4 text-white/35" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2 text-white/75">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                          <div>
                            {formatEventDateRange(
                              event.startDate,
                              event.endDate,
                            )}
                          </div>
                        </div>

                        {/* <div className="flex items-start gap-2 text-white/75">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                          <div>
                            {formatEventTime(event.startDate, event.endDate)}
                          </div>
                        </div> */}

                        <div className="flex items-start gap-2 text-white/75 sm:col-span-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                          <div>{event.location || "Location TBD"}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
