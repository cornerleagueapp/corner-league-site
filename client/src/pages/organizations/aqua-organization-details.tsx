import { OrganizationShop } from "@/features/merchandise/OrganizationShop";
import TeamSeasons from "@/components/team-sports/TeamSeasons";
import { isTeamSport } from "@/lib/sportRegistration";
import { rememberSport } from "@/hooks/useSportSelection";
import { sportDirectory, sportOrganization } from "@/lib/sportNavigation";
import { useOrganizationPageApi } from "./SandboxContext";
import { OrganizationPosts } from "@/features/organization-posts/OrganizationPosts";
import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import OrganizationPhotoGallery from "@/components/OrganizationPhotoGallery";
import { Button } from "@/components/ui/button";
import { PageSEO } from "@/seo/usePageSEO";
import {
  X,
  CalendarDays,
  MapPin,
  ChevronRight,
  Trophy,
  Clock3,
} from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackContentEngagementToBackend } from "@/lib/contentEngagementApi";

type Organization = {
  id: string;
  primarySportKey?: string;
  sportProfile?: {
    label: string;
    capabilities?: { eventManagement?: boolean; raceResults?: boolean };
  };
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
  expectedSportKey?: string;
}) {
  const { sandbox, fetch: pageFetch } = useOrganizationPageApi();
  const [, navigate] = useLocation();
  const orgId = props?.params?.id;
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [shopping, setShopping] = useState(
    () => new URLSearchParams(window.location.search).get("shop") === "1",
  );

  const {
    data: orgData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "/organizations",
      orgId,
      ...(props.expectedSportKey ? [props.expectedSportKey] : []),
      ...(sandbox ? [sandbox.account] : []),
    ],
    enabled: !!orgId && !sandbox,
    queryFn: async () => {
      const res = await pageFetch(`/organizations/${orgId}`, {
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
      if (
        props.expectedSportKey &&
        (org as Organization).primarySportKey !== props.expectedSportKey
      )
        throw new Error("Organization not found for this sport.");
      return {
        ...org,
        sportProfile: json?.sportProfile ?? json?.data?.sportProfile,
      };
    },
    gcTime: sandbox ? 0 : undefined,
    staleTime: 60_000,
  });

  const {
    data: events = [],
    isLoading: eventsLoading,
    isError: eventsError,
    error: eventsQueryError,
  } = useQuery({
    queryKey: [
      "/sport-event/organization",
      orgId,
      ...(sandbox ? [sandbox.account] : []),
    ],
    enabled:
      !!orgId &&
      (sandbox
        ? scheduleOpen
        : !isTeamSport(orgData?.primarySportKey ?? "") &&
          !!orgData?.sportProfile?.capabilities?.eventManagement),
    queryFn: async () => {
      const res = await pageFetch(
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
    gcTime: sandbox ? 0 : undefined,
    staleTime: 30_000,
  });

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return events.filter(
      (e) => new Date(e.endDate || e.startDate).getTime() >= now,
    ).length;
  }, [events]);

  const org = (sandbox?.data.organization ?? orgData) as
    Organization | undefined;

  const primarySportKey =
    org?.primarySportKey ?? props.expectedSportKey ?? "jet-ski";
  const sportLabel =
    org?.sportProfile?.label ??
    (sandbox
      ? sandbox.data.organization.primarySportKey
      : (props.expectedSportKey?.replace(/-/g, " ") ?? "Sport"));
  const hasCompetition =
    !!org &&
    !isTeamSport(primarySportKey) &&
    (!!sandbox ||
      (org?.sportProfile?.capabilities?.eventManagement ??
        primarySportKey === "jet-ski"));
  useEffect(() => {
    if (org && !sandbox && org.primarySportKey)
      rememberSport(org.primarySportKey);
  }, [org?.id, org?.primarySportKey, sandbox]);

  useEffect(() => {
    if (!org || sandbox) return;

    trackEvent(AnalyticsEvents.ORGANIZATION_VIEWED, {
      organization_id: org.id,
      organization_name: org.name,
      organization_abbreviation: org.abbreviation ?? null,
      sport: primarySportKey,
      page_type: "organization_details",
    });

    void trackContentEngagementToBackend({
      contentType: "organization",
      action: "organization_viewed",
      contentId: org.id,
      contentName: org.name,
      organizationId: org.id,
      organizationName: org.name,
      sport: primarySportKey,
      sourcePage: "organization_details",
    }).catch(() => {});
  }, [org?.id, primarySportKey]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cl-canvas text-cl-ink">
      <PageSEO
        title={`${org?.name || "Organization"} • Corner League Sports`}
        description={`Official ${sportLabel} organization profile, news and photo gallery.`}
        noindex={!!sandbox}
        canonicalPath={
          !sandbox && orgId
            ? sportOrganization(primarySportKey, orgId)
            : undefined
        }
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-cl-accent/[0.08] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[88rem] overflow-x-hidden px-3 pb-10 pt-16 sm:px-6 sm:pt-10 lg:px-8">
        {/* top hero */}
        <div className="relative overflow-hidden rounded-[30px] border border-cl-accent/10 cl-panel-wash shadow-cl-panel sm:rounded-[38px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cl-accent/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-cl-accent/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-10">
            <div className="min-w-0 max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  <span className="h-2 w-2 rounded-full bg-cl-accent shadow-cl-panel" />
                  Organization Details
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  {sportLabel} Organization
                </div>
              </div>

              <p className="text-xs font-black uppercase tracking-[0.26em] text-cl-accent">
                {sportLabel} • Official Profile
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="max-w-full break-words text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-cl-ink min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                  {org?.name || "Organization"}
                </h1>

                {org?.abbreviation ? (
                  <span className="rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cl-accent">
                    {org.abbreviation}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted sm:text-base">
                {org?.description ||
                  "View organization details, upcoming events, and official updates."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    sandbox
                      ? `/internal/test-organizations/${sandbox.id}`
                      : sportDirectory(primarySportKey),
                  )
                }
                className="inline-flex items-center justify-center rounded-full border border-cl-border bg-cl-subtle px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-cl-muted transition hover:border-cl-accent/25 hover:bg-cl-accent/10 hover:text-cl-ink"
              >
                ← Back to Organizations
              </button>

              {hasCompetition && (
                <div className="inline-flex items-center gap-3 rounded-[24px] border border-cl-accent/10 bg-cl-subtle px-4 py-3 shadow-cl-panel">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cl-accent/15 bg-cl-accent/10 text-cl-accent">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-cl-muted">
                      Upcoming
                    </div>
                    <div className="text-lg font-bold text-cl-ink">
                      {eventsLoading
                        ? "Loading…"
                        : eventsError
                          ? "Unavailable"
                          : `${upcomingCount} events`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {org?.id && !sandbox ? (
          <nav aria-label="Organization sections" className="mt-6 flex gap-3">
            <Button
              variant={shopping ? "outline" : "default"}
              aria-pressed={!shopping}
              onClick={() => setShopping(false)}
            >
              Organization
            </Button>
            <Button
              variant={shopping ? "default" : "outline"}
              aria-pressed={shopping}
              onClick={() => setShopping(true)}
            >
              Shop
            </Button>
          </nav>
        ) : null}
        {shopping && org?.id && !sandbox ? (
          <OrganizationShop key={org.id} organizationId={org.id} />
        ) : (
          <>
            {isLoading ? (
              <div className="mt-8 rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 text-cl-muted shadow-cl-panel">
                Loading organization…
              </div>
            ) : isError ? (
              <div className="mt-8 rounded-[30px] border border-red-400/25 bg-red-500/10 p-6 text-cl-ink shadow-cl-panel">
                <div className="mb-1 font-semibold">
                  Failed to load organization
                </div>
                <div className="text-sm text-cl-ink">
                  {(error as any)?.message ?? "Unknown error"}
                </div>
              </div>
            ) : !org ? (
              <div className="mt-8 rounded-[30px] border border-cl-border bg-cl-surface p-6 text-cl-muted shadow-cl-panel">
                Organization not found.
              </div>
            ) : (
              <>
                {/* main org card */}
                <div className="mt-8 overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface p-5 shadow-cl-panel sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                    <div className="flex items-start gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[26px] border border-cl-accent/10 bg-cl-subtle shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] sm:h-28 sm:w-28">
                        {org.logoUrl ? (
                          <img
                            src={org.logoUrl}
                            alt={`${org.name} logo`}
                            className="h-full w-full object-contain p-3"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-xs uppercase tracking-[0.16em] text-cl-muted">
                            No Logo
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="break-words text-2xl font-black uppercase leading-tight tracking-[-0.02em] text-cl-ink sm:text-3xl">
                            {org.name}
                          </h2>

                          {org.abbreviation ? (
                            <span className="rounded-full border border-cl-border bg-cl-subtle px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cl-muted">
                              {org.abbreviation}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 max-w-3xl text-sm leading-7 text-cl-muted">
                          {org.description || "No description provided."}
                        </p>

                        <p className="mt-4 break-all text-[11px] uppercase tracking-[0.16em] text-cl-muted">
                          ID: {org.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* info blocks */}
                  {hasCompetition && (
                    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!sandbox) {
                            trackEvent(
                              AnalyticsEvents.ORGANIZATION_SCHEDULE_OPENED,
                              {
                                organization_id: org?.id ?? orgId,
                                organization_name: org?.name ?? null,
                                sport: primarySportKey,
                                page_type: "organization_details",
                              },
                            );

                            void trackContentEngagementToBackend({
                              contentType: "organization",
                              action: "organization_schedule_opened",
                              contentId: org?.id ?? orgId,
                              contentName: org?.name ?? null,
                              organizationId: org?.id ?? orgId,
                              organizationName: org?.name ?? null,
                              sport: primarySportKey,
                              sourcePage: "organization_details",
                            }).catch(() => {});
                          }
                          setScheduleOpen(true);
                        }}
                        className="group min-w-0 rounded-[24px] border border-cl-accent/10 bg-cl-subtle p-5 text-left transition hover:border-cl-accent/25 hover:bg-cl-accent/[0.045]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cl-accent/15 bg-cl-accent/[0.08] text-cl-accent">
                              <CalendarDays className="h-5 w-5" />
                            </div>
                            <div className="text-lg font-black uppercase tracking-[-0.01em] text-cl-ink">
                              Schedule
                            </div>
                            <div className="mt-2 text-sm leading-7 text-cl-muted">
                              {eventsLoading && scheduleOpen
                                ? "Loading events…"
                                : upcomingCount > 0
                                  ? `${upcomingCount} upcoming event${upcomingCount === 1 ? "" : "s"} available to view`
                                  : "View all organization events and dates"}
                            </div>
                          </div>

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cl-border bg-cl-subtle text-cl-accent transition group-hover:border-cl-accent/25 group-hover:bg-cl-accent/[0.08]">
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
                  )}
                </div>
                {isTeamSport(primarySportKey) && (
                  <TeamSeasons
                    organizationId={org.id}
                    sportKey={primarySportKey}
                  />
                )}
                <OrganizationPosts key={org.id} organizationId={org.id} />
              </>
            )}

            {org?.id ? (
              <div className="mt-6">
                <OrganizationPhotoGallery organizationId={org.id} />
              </div>
            ) : null}
          </>
        )}

        {scheduleOpen && (
          <ScheduleModal
            orgName={org?.name || "Organization"}
            sandboxId={sandbox?.id}
            sportKey={primarySportKey}
            organizationId={orgId}
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
      className={`min-w-0 rounded-[24px] border p-5 ${
        muted
          ? "border-cl-border bg-cl-subtle"
          : "border-cl-accent/10 bg-cl-accent/[0.04]"
      }`}
    >
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cl-accent/15 bg-cl-accent/10 text-cl-accent">
        {icon}
      </div>
      <div className="break-words text-lg font-black uppercase tracking-[-0.01em] text-cl-ink">
        {title}
      </div>
      <p className="mt-2 text-sm leading-7 text-cl-muted">{description}</p>
    </div>
  );
}

function ScheduleModal({
  orgName,
  sandboxId,
  sportKey,
  organizationId,
  events,
  loading,
  error,
  onClose,
}: {
  orgName: string;
  sandboxId?: string;
  sportKey?: string;
  organizationId?: string;
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
    navigate(
      sandboxId
        ? `/internal/test-organizations/${sandboxId}?event=${encodeURIComponent(eventId)}`
        : sportKey && sportKey !== "jet-ski" && organizationId
          ? `${sportOrganization(sportKey, organizationId)}?event=${encodeURIComponent(eventId)}`
          : `/aqua-organizations/event-details/${eventId}`,
    );
  }

  return (
    <div
      className="cl-dark fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92vh] w-full flex-col overflow-hidden rounded-t-[30px] border border-cl-accent/10 bg-cl-surface shadow-cl-panel sm:h-auto sm:max-h-[88vh] sm:max-w-5xl sm:rounded-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-cl-border cl-panel-wash px-4 py-4 sm:px-6">
          {" "}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-cl-accent shadow-cl-panel" />
                Event Schedule
              </div>
              <h2 className="text-lg font-semibold text-cl-ink sm:text-xl">
                {orgName} Schedule
              </h2>
              <p className="text-sm text-cl-muted">Upcoming and past events</p>
            </div>

            <Button
              onClick={onClose}
              className="rounded-full border border-cl-border bg-cl-subtle px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-cl-muted hover:bg-cl-subtle hover:text-cl-ink"
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-4 py-4 sm:max-h-[72vh] sm:px-6">
          {loading ? (
            <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-5 text-cl-muted">
              Loading schedule…
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-red-500/25 bg-red-500/10 p-5 text-cl-ink">
              <div className="mb-1 font-semibold">Failed to load schedule</div>
              <div className="text-sm text-cl-ink">{error}</div>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-5 text-cl-muted">
              No events found for this organization yet.
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
  const headingClass = tone === "upcoming" ? "text-cl-accent" : "text-cl-muted";

  const badgeClass =
    tone === "upcoming"
      ? "border-cl-accent/20 bg-cl-accent/10 text-cl-accent"
      : "border-cl-border bg-cl-subtle text-cl-muted";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className={`text-sm font-black uppercase tracking-[0.18em] ${headingClass}`}
        >
          {title}
        </h3>
        <span className="text-xs text-cl-muted">
          {count} event{count === 1 ? "" : "s"}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-4 text-sm text-cl-muted">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onOpenEvent(event.id)}
              className="group min-w-0 w-full rounded-[24px] border border-cl-accent/10 bg-cl-surface p-5 text-left shadow-cl-panel transition hover:border-cl-accent/25 hover:bg-cl-accent/[0.045]"
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

                  <div className="mt-3 break-words text-base font-black uppercase leading-snug tracking-[-0.01em] text-cl-ink sm:text-lg">
                    <span className="line-clamp-2">{event.name}</span>
                  </div>

                  {!!event.description && (
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-cl-muted">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cl-border bg-cl-subtle text-cl-accent transition group-hover:border-cl-accent/25 group-hover:bg-cl-accent/[0.08]">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 text-sm">
                <div className="flex items-start gap-2 text-cl-muted">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cl-muted" />
                  <div className="min-w-0 break-words">
                    {formatEventDateRange(event.startDate, event.endDate)}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-cl-muted">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cl-muted" />
                  <div className="min-w-0 break-words">
                    {formatEventTime(event.startDate, event.endDate)}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-cl-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cl-muted" />
                  <div className="min-w-0 break-words">
                    {event.location || "Location TBD"}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
