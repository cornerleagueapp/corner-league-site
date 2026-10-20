import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Trophy,
  X,
  CalendarDays,
  Waves,
  Search,
  ChevronRight,
  Sparkles,
  Radio,
  Route,
  Share2,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import AquaScoresSection from "@/components/AquaScoresSection";
import AccordionSection from "@/components/AccordionSection";
import SportCommunitySection from "@/components/sport-hub/SportCommunitySection";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import FeaturedRacerGallerySection from "../FeaturedRacerGallerySection";

type AquaOrgEvent = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  organizer?: {
    id: string;
    name?: string | null;
    abbreviation?: string | null;
  } | null;
};

type AquaView = "hub" | "results";

function formatEventDateRange(start: string, end?: string | null) {
  const s = new Date(start);
  const e = end ? new Date(end) : null;

  const sameDay =
    e &&
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();

  const startFmt = s.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!e) return startFmt;
  if (sameDay) return startFmt;

  const endFmt = e.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startFmt} – ${endFmt}`;
}

function sortEventsAsc(a: AquaOrgEvent, b: AquaOrgEvent) {
  return +new Date(a.startDate) - +new Date(b.startDate);
}

function sortEventsDesc(a: AquaOrgEvent, b: AquaOrgEvent) {
  return +new Date(b.startDate) - +new Date(a.startDate);
}

function trophyFor(place?: number) {
  switch (place) {
    case 1:
      return { show: true, colorClass: "text-cl-warning", label: "1st place" };
    case 2:
      return { show: true, colorClass: "text-cl-muted", label: "2nd place" };
    case 3:
      return { show: true, colorClass: "text-cl-accent", label: "3rd place" };
    default:
      return { show: false, colorClass: "", label: "" };
  }
}

function AquaHubCard({
  icon,
  title,
  badge,
  description,
  onClick,
  highlighted,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  description: string;
  onClick?: () => void;
  highlighted?: boolean;
  cta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-w-0 overflow-hidden rounded-[30px] border p-5 text-left shadow-cl-panel transition duration-300 hover:-translate-y-1 sm:p-6 ${
        highlighted
          ? "border-cl-accent/25 cl-panel-wash"
          : "border-cl-accent/10 bg-cl-surface hover:border-cl-accent/25 hover:bg-cl-accent/[0.045]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 top-0 h-52 w-52 rounded-full bg-cl-accent/[0.08] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px]" />
      </div>

      <div className="relative flex h-full min-w-0 flex-col justify-between gap-6">
        <div className="min-w-0">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent shadow-cl-panel">
              {icon}
            </div>

            {badge ? (
              <span className="max-w-[120px] truncate rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent">
                {badge}
              </span>
            ) : null}
          </div>

          <h3 className="break-words text-xl font-black uppercase leading-tight tracking-[-0.02em] text-cl-ink">
            {title}
          </h3>

          <p className="mt-3 text-sm leading-7 text-cl-muted">{description}</p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cl-accent">
          {cta}
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

function AllAquaEventsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<AquaOrgEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    async function loadAllEvents() {
      try {
        setLoading(true);
        setError(null);

        const orgRes = await apiFetch("/organizations?page=1&limit=50", {
          skipAuth: true,
          noRefresh: true,
        });
        const orgJson = await orgRes.json();

        const orgs =
          orgJson?.organizations ??
          orgJson?.data?.organizations ??
          orgJson?.data ??
          [];

        const orgList = Array.isArray(orgs) ? orgs : [];

        const settled = await Promise.allSettled(
          orgList.map(async (org: any) => {
            const orgId = String(org.id);
            const res = await apiFetch(
              `/sport-event/organization/${encodeURIComponent(orgId)}?page=1&limit=50&order=ASC`,
              {
                skipAuth: true,
                noRefresh: true,
              },
            );
            const resJson = await res.json();

            const items =
              resJson?.sportEvents ??
              resJson?.data?.sportEvents ??
              resJson?.data ??
              [];

            return Array.isArray(items)
              ? items.map((event: any) => ({
                  id: String(event.id),
                  name: String(event.name ?? "Unnamed Event"),
                  description: event.description ?? null,
                  location: event.location ?? null,
                  startDate: String(event.startDate),
                  endDate: event.endDate ?? null,
                  organizer: {
                    id: orgId,
                    name: org.name ?? null,
                    abbreviation: org.abbreviation ?? null,
                  },
                }))
              : [];
          }),
        );

        const merged = settled.flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        );

        const dedupedMap = new Map<string, AquaOrgEvent>();
        for (const event of merged) {
          dedupedMap.set(event.id, event);
        }

        if (!ignore) {
          setEvents(Array.from(dedupedMap.values()));
        }
      } catch (e: any) {
        if (!ignore) {
          setError(e?.message || "Failed to load AQUA events.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAllEvents();

    return () => {
      ignore = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  if (!open) return null;

  const now = new Date();

  const upcoming = events
    .filter((event) => new Date(event.endDate ?? event.startDate) >= now)
    .sort(sortEventsAsc);

  const past = events
    .filter((event) => new Date(event.endDate ?? event.startDate) < now)
    .sort(sortEventsDesc);

  function openEvent(eventId: string) {
    onClose();
    navigate(`/aqua-organizations/event-details/${eventId}`);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[88vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-canvas shadow-cl-panel">
        <div className="border-b border-cl-border cl-panel-wash px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cl-accent/[0.15] bg-cl-accent/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cl-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-cl-accent" />
                Event schedule
              </div>
              <h2 className="text-xl font-semibold text-cl-ink sm:text-2xl">
                All AQUA Events
              </h2>
              <p className="text-sm text-cl-muted">
                Browse every organization’s race schedule
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cl-border bg-cl-subtle text-cl-ink hover:bg-cl-subtle"
              aria-label="Close events modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {loading ? (
            <div className="rounded-2xl border border-cl-border bg-cl-subtle p-6 text-cl-muted">
              Loading events…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-cl-ink">
              <div className="mb-1 font-semibold">Failed to load events</div>
              <div className="text-sm text-cl-ink">{error}</div>
            </div>
          ) : (
            <div className="space-y-8">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-cl-ink">
                    Upcoming
                  </h3>
                  <span className="text-xs uppercase tracking-[0.16em] text-cl-muted">
                    {upcoming.length} events
                  </span>
                </div>

                {upcoming.length === 0 ? (
                  <div className="rounded-2xl border border-cl-border bg-cl-subtle p-4 text-sm text-cl-muted">
                    No upcoming events found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {upcoming.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => openEvent(event.id)}
                        className="min-w-0 rounded-[24px] border border-cl-accent/10 bg-cl-surface p-5 text-left shadow-cl-panel transition hover:border-cl-accent/25 hover:bg-cl-accent/[0.045]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="break-words text-base font-semibold text-cl-ink sm:text-lg">
                                {event.name}
                              </h4>
                              {event.organizer?.abbreviation ? (
                                <span className="rounded-full border border-cl-border px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-cl-muted">
                                  {event.organizer.abbreviation}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm text-cl-muted">
                              {event.organizer?.name || "Unknown Organization"}
                            </p>

                            <div className="mt-3 space-y-1 text-sm text-cl-muted">
                              <div>
                                {formatEventDateRange(
                                  event.startDate,
                                  event.endDate,
                                )}
                              </div>
                              {event.location ? (
                                <div>{event.location}</div>
                              ) : null}
                            </div>
                          </div>

                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cl-accent" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-cl-ink">Past</h3>
                  <span className="text-xs uppercase tracking-[0.16em] text-cl-muted">
                    {past.length} events
                  </span>
                </div>

                {past.length === 0 ? (
                  <div className="rounded-2xl border border-cl-border bg-cl-subtle p-4 text-sm text-cl-muted">
                    No past events found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {past.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => openEvent(event.id)}
                        className="min-w-0 rounded-[24px] border border-cl-border bg-cl-subtle p-5 text-left transition hover:border-cl-accent/20 hover:bg-cl-accent/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="break-words text-base font-semibold text-cl-ink sm:text-lg">
                                {event.name}
                              </h4>
                              {event.organizer?.abbreviation ? (
                                <span className="rounded-full border border-cl-border px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-cl-muted">
                                  {event.organizer.abbreviation}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm text-cl-muted">
                              {event.organizer?.name || "Unknown Organization"}
                            </p>

                            <div className="mt-3 space-y-1 text-sm text-cl-muted">
                              <div>
                                {formatEventDateRange(
                                  event.startDate,
                                  event.endDate,
                                )}
                              </div>
                              {event.location ? (
                                <div>{event.location}</div>
                              ) : null}
                            </div>
                          </div>

                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cl-accent" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VoteAwardsBanner({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-[28px] border border-cl-accent/20 cl-panel-wash p-4 text-left shadow-cl-panel transition hover:-translate-y-0.5 hover:border-cl-accent/[0.35] hover:bg-cl-accent/[0.08] sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-cl-accent/[0.12] blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-cl-accent/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:46px_46px]" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cl-accent/25 bg-cl-accent/[0.15] text-cl-accent shadow-cl-panel">
            <Trophy className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-cl-accent/[0.15] bg-cl-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cl-accent">
              Live Fan Voting
            </div>

            <h3 className="text-xl font-black uppercase leading-tight tracking-[-0.02em] text-cl-ink sm:text-2xl">
              Vote for Awards Now
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-cl-muted">
              Help pick fan favorites, MVPs, and community awards across AQUA
              racing.
            </p>
          </div>
        </div>

        <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-cl-accent/25 bg-cl-accent/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cl-accent transition group-hover:bg-cl-accent/20 sm:self-center">
          Vote Now
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

function AquaHubSection({
  onOpenResults,
  onOpenRacerSearch,
  onOpenUpcomingEvents,
}: {
  onOpenResults: () => void;
  onOpenRacerSearch: () => void;
  onOpenUpcomingEvents: () => void;
}) {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[30px] border border-cl-accent/10 cl-panel-wash shadow-cl-panel sm:rounded-[38px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative p-5 sm:p-7 lg:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-cl-accent shadow-cl-panel" />
              Official Aqua Tab
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              Jet Ski Racing
            </div>
          </div>

          <p className="text-xs font-black uppercase tracking-[0.26em] text-cl-accent">
            Aqua • Race Results • Athlete Profiles
          </p>

          <h2 className="mt-3 max-w-4xl text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-cl-ink min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
            AQUA <span className="text-cl-accent ">Sports Hub</span>
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted sm:text-base">
            Dive into race organizations, results, racer profiles, featured
            events, and schedule coverage — all in one cleaner AQUA experience.
          </p>
        </div>
      </div>

      <VoteAwardsBanner
        onClick={() => {
          trackEvent(AnalyticsEvents.POLL_AWARDS_BANNER_CLICKED, {
            sourcePage: "aqua_hub",
            destination: "/polls",
          });

          navigate("/polls");
        }}
      />

      <div>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
              Browse
            </p>
            <h3 className="mt-1 text-3xl font-black uppercase tracking-[-0.03em] text-cl-ink">
              AQUA Sections
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AquaHubCard
            icon={<Waves className="h-5 w-5" />}
            title="Race Organizations"
            badge="New"
            description="Explore sanctioning bodies, tours, and organizations that feed into the AQUA ecosystem."
            onClick={() => navigate("/aqua-organizations")}
            cta="Open organizations"
          />

          <AquaHubCard
            icon={<Trophy className="h-5 w-5" />}
            title="Community Forum"
            description="Talk racing, share ideas, and ask your community."
            onClick={() => navigate("/community?sport=jet-ski")}
            highlighted
            cta="Join the discussion"
          />

          <AquaHubCard
            icon={<Search className="h-5 w-5" />}
            title="Search Racers"
            description="Look up racers, compare profiles, and jump directly into individual performance pages."
            onClick={() => window.dispatchEvent(new Event("racer-search:open"))}
            cta="Open search"
          />

          <AquaHubCard
            icon={<CalendarDays className="h-5 w-5" />}
            title="Upcoming Races"
            badge="2026"
            description="See upcoming and past AQUA events across organizations in one unified schedule view."
            onClick={onOpenUpcomingEvents}
            cta="Open schedule"
          />

          <AquaHubCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Play Fantasy"
            description="Season-long fantasy features for friends and leagues are planned next."
            cta="Coming soon"
          />

          <AquaHubCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Articles & Blogs"
            description="Stories and perspectives from the Jet Ski community."
            onClick={() => navigate("/articles?sport=jet-ski")}
            cta="Read stories"
          />
        </div>
      </div>

      <FeaturedRacerGallerySection sourcePage="aqua_hub" limit={7} compact />

      <SportCommunitySection sport="jet-ski" />
    </div>
  );
}

export default function AquaTabContent({
  onOpenRacerSearch,
}: {
  onOpenRacerSearch: () => void;
}) {
  const [view, setView] = useState<AquaView>("hub");
  const [allEventsOpen, setAllEventsOpen] = useState(false);

  return (
    <>
      {view === "hub" ? (
        <AquaHubSection
          onOpenResults={() => setView("results")}
          onOpenRacerSearch={onOpenRacerSearch}
          onOpenUpcomingEvents={() => setAllEventsOpen(true)}
        />
      ) : (
        <AquaScoresSection
          onOpenRacerSearch={onOpenRacerSearch}
          onBackToHub={() => setView("hub")}
        />
      )}

      <AllAquaEventsModal
        open={allEventsOpen}
        onClose={() => setAllEventsOpen(false)}
      />
    </>
  );
}
