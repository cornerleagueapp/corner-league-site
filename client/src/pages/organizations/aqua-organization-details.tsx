// Future: OrganizationFacilities and OrganizationShop remain available in their feature modules.
import TeamSeasons from "@/components/team-sports/TeamSeasons";
import { isTeamSport } from "@/lib/sportRegistration";
import { rememberSport } from "@/hooks/useSportSelection";
import { sportOrganization } from "@/lib/sportNavigation";
import { sportVisual } from "@/lib/sportVisuals";
import { useOrganizationPageApi } from "./SandboxContext";
import { OrganizationPosts } from "@/features/organization-posts/OrganizationPosts";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import OrganizationPhotoGallery from "@/components/OrganizationPhotoGallery";
import ConsumerBrandingHero from "@/components/branding/ConsumerBrandingHero";
import OrganizationEventCards from "@/components/organization-community/OrganizationEventCards";
import {
  organizationSections,
  organizationSection,
  organizationSectionPath,
  organizationEventPage,
  type OrganizationSection,
} from "@/lib/organizationPresentation";
import { PageSEO } from "@/seo/usePageSEO";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackContentEngagementToBackend } from "@/lib/contentEngagementApi";

type Organization = {
  id: string;
  name: string;
  primarySportKey?: string;
  abbreviation?: string | null;
  description?: string | null;
  sportProfile?: {
    label?: string;
    capabilities?: { eventManagement?: boolean };
  };
};
type Props = { params: { id: string }; expectedSportKey?: string };
export default function AquaOrganizationDetailsPage(props: Props) {
  return (
    <OrganizationCommunityPage
      key={`${props.params.id}:${props.expectedSportKey ?? "jet-ski"}`}
      {...props}
    />
  );
}
function OrganizationCommunityPage(props: Props) {
  const { sandbox, fetch: pageFetch } = useOrganizationPageApi();
  const [location] = useLocation(),
    search = useSearch();
  const orgId = props.params.id;
  const [eventPage, setEventPage] = useState(1);
  const scope = `${sandbox?.id ?? "public"}:${sandbox?.account ?? "guest"}`;
  const organizationQuery = useQuery({
    queryKey: [
      "/organizations",
      orgId,
      props.expectedSportKey ?? "jet-ski",
      scope,
    ],
    enabled: !!orgId && !sandbox,
    queryFn: async ({ signal }) => {
      const response = await pageFetch(
        `/organizations/${encodeURIComponent(orgId)}`,
        { method: "GET", skipAuth: true, noRefresh: true, signal },
      );
      const json = await response.json();
      if (!response.ok) throw new Error("We couldn’t load this organization.");
      const data = json.data ?? json,
        organization = data.organization;
      if (
        !organization ||
        organization.id !== orgId ||
        (props.expectedSportKey &&
          organization.primarySportKey !== props.expectedSportKey)
      )
        throw new Error("Organization not found for this sport.");
      return {
        ...organization,
        sportProfile: data.sportProfile,
      } as Organization;
    },
    staleTime: 60_000,
    retry: 1,
  });
  const org = (sandbox?.data.organization ?? organizationQuery.data) as
    Organization | undefined;
  const primarySportKey =
    org?.primarySportKey ?? props.expectedSportKey ?? "jet-ski";
  const team = isTeamSport(primarySportKey);
  const hasEvents =
    !!org &&
    (sandbox
      ? !team
      : !!org.sportProfile?.capabilities?.eventManagement ||
        primarySportKey === "jet-ski");
  const sections = organizationSections(team, hasEvents, !!sandbox);
  const section = organizationSection(search, sections);
  const sportLabel =
    org?.sportProfile?.label ?? sportVisual(primarySportKey).label;
  const eventsQuery = useQuery({
    queryKey: [
      "organization-community-events",
      scope,
      orgId,
      primarySportKey,
      eventPage,
    ],
    enabled:
      !!org && hasEvents && (section === "overview" || section === "events"),
    queryFn: async ({ signal }) => {
      const response = await pageFetch(
        `/sport-event/organization/${encodeURIComponent(orgId)}?page=${eventPage}&limit=12&order=DESC&sortBy=startDate`,
        { method: "GET", skipAuth: true, noRefresh: true, signal },
      );
      const json = await response.json();
      if (!response.ok)
        throw new Error("We couldn’t load this organization’s events.");
      return organizationEventPage(json, orgId);
    },
    staleTime: sandbox ? 0 : 30_000,
    gcTime: sandbox ? 0 : undefined,
    retry: 1,
  });
  useEffect(() => {
    if (org?.primarySportKey && !sandbox) rememberSport(org.primarySportKey);
  }, [org?.id, org?.primarySportKey, scope]);
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
  }, [org?.id, primarySportKey, scope]);
  useEffect(() => {
    if (section !== "events") setEventPage(1);
  }, [section, scope, orgId]);
  function selectSection(next: OrganizationSection) {
    if (next === "overview" || next === "events") setEventPage(1);
    if (next !== "events" || !org || sandbox) return;
    trackEvent(AnalyticsEvents.ORGANIZATION_SCHEDULE_OPENED, {
      organization_id: org.id,
      organization_name: org.name,
      sport: primarySportKey,
      page_type: "organization_details",
    });
    void trackContentEngagementToBackend({
      contentType: "organization",
      action: "organization_schedule_opened",
      contentId: org.id,
      contentName: org.name,
      organizationId: org.id,
      organizationName: org.name,
      sport: primarySportKey,
      sourcePage: "organization_details",
    }).catch(() => {});
  }
  const sectionHref = (key: OrganizationSection) =>
    organizationSectionPath(location, search, key);
  const events = eventsQuery.data?.items ?? [];
  const highlights = [...events]
    .sort((a, b) => {
      const first = Date.parse(a.endDate) >= Date.now(),
        second = Date.parse(b.endDate) >= Date.now();
      if (first !== second) return first ? -1 : 1;
      return first
        ? Date.parse(a.startDate) - Date.parse(b.startDate)
        : Date.parse(b.startDate) - Date.parse(a.startDate);
    })
    .slice(0, 4);
  const loading = !sandbox && organizationQuery.isPending;
  const failed = !sandbox && organizationQuery.isError;
  const currentLabel =
    sections.find((link) => link.key === section)?.label ?? "Overview";
  return (
    <main className="org-community-page">
      <PageSEO
        title={`${org?.name || "Organization"} • Corner League Sports`}
        description={`Explore ${org?.name || "this organization"}: ${sportLabel} events, news and photos.`}
        noindex={!!sandbox}
        canonicalPath={
          !sandbox && orgId
            ? sportOrganization(primarySportKey, orgId)
            : undefined
        }
      />
      {sandbox ? (
        <Link
          className="org-community-back"
          href={`/internal/test-organizations/${encodeURIComponent(sandbox.id)}`}
        >
          Back to test organization
        </Link>
      ) : null}
      {loading ? (
        <div className="org-community-state" role="status">
          Loading organization…
        </div>
      ) : failed ? (
        <div className="org-community-state" role="alert">
          <h1>Organization unavailable</h1>
          <p>
            {organizationQuery.error instanceof Error
              ? organizationQuery.error.message
              : "Please try again."}
          </p>
          <button
            className="sport-hub-button"
            onClick={() => void organizationQuery.refetch()}
          >
            Try again
          </button>
        </div>
      ) : !org ? (
        <div className="org-community-state">
          <h1>Organization not found</h1>
          <p>Return to the directory to explore available organizations.</p>
        </div>
      ) : (
        <>
          <ConsumerBrandingHero
            key={`${scope}:${org.id}`}
            kind="organization"
            id={org.id}
            organizationId={org.id}
            sport={primarySportKey}
            name={org.name}
            headingLevel={1}
          />
          <div className="org-community-introduction">
            <p className="org-community-eyebrow">
              {sportLabel} community
              {org.abbreviation ? ` · ${org.abbreviation}` : ""}
            </p>
            {org.description && (
              <p className="org-community-description">{org.description}</p>
            )}
          </div>
          <nav
            className="org-community-navigation"
            aria-label="Organization sections"
          >
            {sections.map((link) => (
              <Link
                key={link.key}
                href={sectionHref(link.key)}
                aria-current={section === link.key ? "page" : undefined}
                onClick={() => selectSection(link.key)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <section
            className="org-community-panel"
            aria-label={`${org.name} ${currentLabel}`}
          >
            {section === "overview" && (
              <div className="org-community-overview">
                <section className="org-community-card">
                  <div className="sport-section-heading">
                    <h2>Welcome to {org.name}</h2>
                  </div>
                  <p>
                    Follow the latest news, discover events, and explore the
                    community.
                  </p>
                  <div className="org-community-shortcuts">
                    {hasEvents && (
                      <Link
                        href={sectionHref("events")}
                        onClick={() => selectSection("events")}
                      >
                        <strong>Events & schedules</strong>
                        <span>Find dates, locations and event details →</span>
                      </Link>
                    )}
                    {team && (
                      <Link href={sectionHref("competition")}>
                        <strong>Leagues & seasons</strong>
                        <span>
                          Follow teams, standings, games and brackets →
                        </span>
                      </Link>
                    )}
                    <Link href={sectionHref("updates")}>
                      <strong>News & updates</strong>
                      <span>
                        Announcements and stories from the organization →
                      </span>
                    </Link>
                    <Link href={sectionHref("gallery")}>
                      <strong>Community photos</strong>
                      <span>Explore the organization’s photo gallery →</span>
                    </Link>
                  </div>
                </section>
                {hasEvents && (
                  <section>
                    <div className="sport-section-heading">
                      <h2>Event highlights</h2>
                      <Link
                        href={sectionHref("events")}
                        onClick={() => selectSection("events")}
                      >
                        View events →
                      </Link>
                    </div>
                    <EventStatus
                      query={eventsQuery}
                      empty="New events will appear here when available."
                    />
                    {!eventsQuery.isError && (
                      <OrganizationEventCards
                        events={highlights}
                        organizationId={org.id}
                        sport={primarySportKey}
                        sandboxId={sandbox?.id}
                      />
                    )}
                  </section>
                )}
                <OrganizationPosts
                  key={`${scope}:${org.id}:overview`}
                  organizationId={org.id}
                  previewLimit={2}
                />
                <Link
                  className="org-community-more"
                  href={sectionHref("updates")}
                >
                  View all news & updates →
                </Link>
              </div>
            )}
            {section === "events" && (
              <div>
                <div className="sport-section-heading">
                  <h2>Events & schedules</h2>
                  <p className="text-sm text-cl-muted">
                    {eventsQuery.data?.total != null
                      ? `${eventsQuery.data.total} event${eventsQuery.data.total === 1 ? "" : "s"}`
                      : "Organization events"}
                  </p>
                </div>
                <EventStatus
                  query={eventsQuery}
                  empty="No events are available on this page."
                />
                {!eventsQuery.isError && (
                  <OrganizationEventCards
                    events={events}
                    organizationId={org.id}
                    sport={primarySportKey}
                    sandboxId={sandbox?.id}
                  />
                )}
                {(eventPage > 1 || eventsQuery.data?.hasNextPage) && (
                  <nav
                    className="org-community-pagination"
                    aria-label="Organization event pages"
                  >
                    <button
                      disabled={eventPage === 1 || eventsQuery.isFetching}
                      onClick={() => setEventPage((value) => value - 1)}
                    >
                      Previous
                    </button>
                    <span>Page {eventPage}</span>
                    <button
                      disabled={
                        !eventsQuery.data?.hasNextPage || eventsQuery.isFetching
                      }
                      onClick={() => setEventPage((value) => value + 1)}
                    >
                      Next
                    </button>
                  </nav>
                )}
              </div>
            )}
            {section === "competition" && team && (
              <TeamSeasons
                key={`${scope}:${org.id}`}
                organizationId={org.id}
                sportKey={primarySportKey}
              />
            )}
            {section === "updates" && (
              <OrganizationPosts
                key={`${scope}:${org.id}:updates`}
                organizationId={org.id}
              />
            )}
            {section === "gallery" && (
              <OrganizationPhotoGallery
                key={`${scope}:${org.id}`}
                organizationId={org.id}
              />
            )}
            {/* Shop and facilities are deferred until a future release. */}
          </section>
        </>
      )}
    </main>
  );
}
function EventStatus({
  query,
  empty,
}: {
  query: {
    isPending: boolean;
    isError: boolean;
    data?: { items: unknown[] };
    refetch: () => unknown;
  };
  empty: string;
}) {
  if (query.isPending)
    return (
      <p role="status" className="org-community-state">
        Loading events…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="org-community-state">
        <p>Events couldn’t be loaded.</p>
        <button
          onClick={() => void query.refetch()}
          className="sport-hub-button"
        >
          Try again
        </button>
      </div>
    );
  if (!query.data?.items.length)
    return <p className="org-community-state">{empty}</p>;
  return null;
}
