import SportEventOperations from "@/components/sport-registration/SportEventOperations";
import { useSandbox, sandboxFetch } from "./SandboxContext";
import SportEventRegistration from "@/components/sport-registration/SportEventRegistration";
import { useEffect } from "react";
import { trackGrowth } from "@/lib/growthAnalytics";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackContentEngagementToBackend } from "@/lib/contentEngagementApi";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { sportOrganization } from "@/lib/sportNavigation";
import { eventLivestreamUrl } from "@/lib/eventLivestream";
import { PageSEO } from "@/seo/usePageSEO";
export async function fetchPublicSportEvent(
  sportKey: string,
  organizationId: string,
  eventId: string,
  signal?: AbortSignal,
  fetcher: typeof apiFetch = apiFetch,
  workspaceOverride?: any,
) {
  const [orgResponse, eventResponse] = await Promise.all([
    workspaceOverride
      ? Promise.resolve({
          ok: true,
          json: async () => workspaceOverride,
        } as Response)
      : fetcher(`/organizations/${encodeURIComponent(organizationId)}`, {
          skipAuth: true,
          noRefresh: true,
          signal,
        }),
    fetcher(`/sport-event/${encodeURIComponent(eventId)}`, {
      skipAuth: true,
      noRefresh: true,
      signal,
    }),
  ]);
  if (!orgResponse.ok || !eventResponse.ok)
    throw new Error("Event unavailable.");
  const orgJson = await orgResponse.json(),
    eventJson = await eventResponse.json();
  const workspace = orgJson.data ?? orgJson,
    event = (eventJson.data ?? eventJson).sportEvent;
  if (
    workspace.organization?.id !== organizationId ||
    workspace.organization?.primarySportKey !== sportKey ||
    workspace.sportProfile?.key !== sportKey ||
    event?.id !== eventId ||
    typeof event?.name !== "string" ||
    !Number.isFinite(Date.parse(event?.startDate)) ||
    !Number.isFinite(Date.parse(event?.endDate)) ||
    event?.organizer?.id !== organizationId ||
    event.sport !== workspace.sportProfile?.eventSport
  )
    throw new Error("Event not found for this organization and sport.");
  return {
    event,
    organization: workspace.organization,
    sport: workspace.sportProfile,
  };
}
export default function PublicSportEventPage({
  sportKey,
  organizationId,
  eventId,
}: {
  sportKey: string;
  organizationId: string;
  eventId: string;
}) {
  const sandbox = useSandbox();
  const query = useQuery({
    queryKey: [
      "public-sport-event",
      sandbox?.id,
      sandbox?.account,
      sportKey,
      organizationId,
      eventId,
    ],
    queryFn: ({ signal }) =>
      fetchPublicSportEvent(
        sportKey,
        organizationId,
        eventId,
        signal,
        sandbox ? (path) => sandboxFetch(sandbox.id, path) : apiFetch,
        sandbox?.data,
      ),
    staleTime: 30_000,
  });
  const data = query.isError ? undefined : query.data;
  useEffect(() => {
    if (!data || sandbox) return;
    trackGrowth("Event Viewed", data.event.id);
    trackEvent(AnalyticsEvents.EVENT_DETAILS_VIEWED, {
      event_id: data.event.id,
      event_name: data.event.name,
      organization_id: organizationId,
      sport: sportKey,
      page_type: "sport_event_details",
    });
    void trackContentEngagementToBackend({
      contentType: "event",
      action: "event_details_viewed",
      contentId: data.event.id,
      contentName: data.event.name,
      eventId: data.event.id,
      eventName: data.event.name,
      organizationId,
      organizationName: data.organization.name,
      sport: sportKey,
      sourcePage: "sport_event_details",
    }).catch(() => {});
  }, [data?.event.id, sportKey, organizationId]);
  const livestream = eventLivestreamUrl(data?.event.livestreamUrl);
  const back = sandbox
    ? `/internal/test-organizations/${sandbox.id}`
    : sportOrganization(sportKey, organizationId);
  return (
    <main className="consumer-document-page bg-[#030913] p-4 py-10 text-white sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageSEO
          title={data?.event.name ?? "Event"}
          description={data?.event.description}
          canonicalPath={`${back}?event=${encodeURIComponent(eventId)}`}
          noindex={!!sandbox || query.isError}
        />
        <Link href={back} className="text-cyan-200">
          ← Back to organization
        </Link>
        {query.isLoading ? (
          <p role="status">Loading event…</p>
        ) : query.isError ? (
          <div role="alert">
            <p>This event is unavailable for this organization and sport.</p>
            <button
              className="mt-4 min-h-11 rounded-full border border-white/20 px-5"
              onClick={() => void query.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          data && (
            <>
              <header className="rounded-[30px] border border-cyan-300/15 bg-[linear-gradient(120deg,#0c2835,#07111f_65%)] p-6 sm:p-10">
                <p className="text-xs font-black uppercase tracking-widest text-cyan-200">
                  {data.sport.label} · {data.organization.name}
                </p>
                <h1 className="mt-4 break-words text-3xl font-black sm:text-5xl">
                  {data.event.name}
                </h1>
                <p className="mt-5 whitespace-pre-wrap leading-8 text-slate-300">
                  {data.event.description}
                </p>
              </header>
              <section
                aria-label="Event information"
                className="grid gap-5 sm:grid-cols-2"
              >
                <div className="rounded-2xl border border-white/10 bg-[#07111f] p-6">
                  <h2 className="font-bold text-cyan-200">Dates</h2>
                  <p className="mt-3">
                    {new Date(data.event.startDate).toLocaleDateString()} –{" "}
                    {new Date(data.event.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#07111f] p-6">
                  <h2 className="font-bold text-cyan-200">Location</h2>
                  <p className="mt-3">
                    {data.event.formattedAddress ||
                      data.event.location ||
                      "To be announced"}
                  </p>
                </div>
              </section>
              {data.sport.capabilities?.raceScheduling && (
                <SportEventOperations
                  eventId={eventId}
                  sportKey={sportKey}
                  organizationId={organizationId}
                />
              )}
              {data.sport.capabilities?.registration && (
                <SportEventRegistration
                  eventId={eventId}
                  sportKey={sportKey}
                  organizationId={organizationId}
                />
              )}
              {livestream && (
                <a
                  href={livestream}
                  onClick={() => {
                    if (!sandbox)
                      trackGrowth("Livestream Clicked", data.event.id);
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-full bg-cyan-300 px-6 font-black text-[#06111d]"
                >
                  Watch livestream ↗
                </a>
              )}
            </>
          )
        )}
      </div>
    </main>
  );
}
