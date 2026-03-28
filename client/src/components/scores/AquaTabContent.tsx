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
} from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import AquaScoresSection from "@/components/AquaScoresSection";
import AccordionSection from "@/components/AccordionSection";
import { markHahn300 } from "@/data/markHanRace";

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
      return { show: true, colorClass: "text-amber-400", label: "1st place" };
    case 2:
      return { show: true, colorClass: "text-gray-300", label: "2nd place" };
    case 3:
      return { show: true, colorClass: "text-[#cd7f32]", label: "3rd place" };
    default:
      return { show: false, colorClass: "", label: "" };
  }
}

function FeaturedRaceSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/75">
          Featured Race
        </p>
        <h2 className="text-2xl font-semibold text-white">
          {markHahn300.title}
        </h2>
        <p className="text-sm text-white/65">{markHahn300.date}</p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.94)_0%,rgba(4,17,29,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-6">
        <AccordionSection
          labelShow="Show Final Results - Overall"
          labelHide="Hide Final Results - Overall"
        >
          <div className="space-y-4">
            <div className="text-sm text-white/70">{markHahn300.subtitle}</div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-black/25">
                    <tr className="text-white/80">
                      <th className="px-2 py-3 text-left font-semibold">
                        Place
                      </th>
                      <th className="px-2 py-3 text-left font-semibold">
                        Number/MFG
                      </th>
                      <th className="px-2 py-3 text-left font-semibold">
                        Team Name
                      </th>
                      <th className="px-2 py-3 text-right font-semibold">
                        Laps
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {markHahn300.results.map((r) => (
                      <tr
                        key={`${r.place}-${r.boatNumber}-${r.mfg}`}
                        className="text-white/80"
                      >
                        <td className="px-4 py-3 tabular-nums">
                          <span className="inline-flex items-center gap-2">
                            {r.place}
                            {(() => {
                              const trophy = trophyFor(r.place);
                              return trophy.show ? (
                                <Trophy
                                  aria-label={trophy.label}
                                  className={`h-4 w-4 ${trophy.colorClass}`}
                                />
                              ) : null;
                            })()}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {r.boatNumber} - {r.mfg}
                        </td>
                        <td className="px-4 py-3">{r.teamName}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {r.lapsCompleted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-semibold text-white">
                  Penalties
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-white/75">
                  {markHahn300.penalties.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-semibold text-white">
                  Achievements
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-white/75">
                  {markHahn300.achievement.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </AccordionSection>
      </div>
    </div>
  );
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
      className={`group relative overflow-hidden rounded-[26px] border p-5 text-left transition duration-300 hover:-translate-y-0.5 sm:p-6 ${
        highlighted
          ? "border-cyan-400/30 bg-[linear-gradient(180deg,rgba(14,55,83,0.55)_0%,rgba(7,23,37,0.95)_100%)]"
          : "border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.94)_0%,rgba(4,17,29,0.98)_100%)] hover:border-cyan-300/25"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.08),_transparent_30%)]" />

      <div className="relative flex h-full flex-col justify-between gap-6">
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-300">
              {icon}
            </div>

            {badge ? (
              <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
                {badge}
              </span>
            ) : null}
          </div>

          <h3 className="text-lg font-semibold text-white sm:text-xl">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
        </div>

        <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
          {cta}
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
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

        const orgRes = await apiRequest<any>(
          "GET",
          "/organizations?page=1&limit=50",
        );

        const orgs =
          orgRes?.organizations ??
          orgRes?.data?.organizations ??
          orgRes?.data ??
          [];

        const orgList = Array.isArray(orgs) ? orgs : [];

        const settled = await Promise.allSettled(
          orgList.map(async (org: any) => {
            const orgId = String(org.id);
            const res = await apiRequest<any>(
              "GET",
              `/sport-event/organization/${encodeURIComponent(orgId)}?page=1&limit=50&order=ASC`,
            );

            const items =
              res?.sportEvents ?? res?.data?.sportEvents ?? res?.data ?? [];

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

      <div className="relative z-10 flex max-h-[88vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#07131f] shadow-2xl">
        <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.98)_0%,rgba(6,19,31,0.98)_100%)] px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                Event schedule
              </div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">
                All AQUA Events
              </h2>
              <p className="text-sm text-white/55">
                Browse every organization’s race schedule
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
              aria-label="Close events modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white/70">
              Loading events…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-white">
              <div className="mb-1 font-semibold">Failed to load events</div>
              <div className="text-sm text-white/80">{error}</div>
            </div>
          ) : (
            <div className="space-y-8">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Upcoming</h3>
                  <span className="text-xs uppercase tracking-[0.16em] text-white/45">
                    {upcoming.length} events
                  </span>
                </div>

                {upcoming.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
                    No upcoming events found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {upcoming.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => openEvent(event.id)}
                        className="rounded-[24px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.94)_0%,rgba(4,17,29,0.98)_100%)] p-5 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="break-words text-base font-semibold text-white sm:text-lg">
                                {event.name}
                              </h4>
                              {event.organizer?.abbreviation ? (
                                <span className="rounded-full border border-white/15 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-white/65">
                                  {event.organizer.abbreviation}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm text-white/70">
                              {event.organizer?.name || "Unknown Organization"}
                            </p>

                            <div className="mt-3 space-y-1 text-sm text-white/55">
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

                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Past</h3>
                  <span className="text-xs uppercase tracking-[0.16em] text-white/45">
                    {past.length} events
                  </span>
                </div>

                {past.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
                    No past events found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {past.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => openEvent(event.id)}
                        className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-cyan-300/20 hover:bg-white/[0.05]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="break-words text-base font-semibold text-white sm:text-lg">
                                {event.name}
                              </h4>
                              {event.organizer?.abbreviation ? (
                                <span className="rounded-full border border-white/15 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-white/65">
                                  {event.organizer.abbreviation}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm text-white/70">
                              {event.organizer?.name || "Unknown Organization"}
                            </p>

                            <div className="mt-3 space-y-1 text-sm text-white/55">
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

                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
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
      <div className="relative overflow-hidden rounded-[30px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.94)_0%,rgba(4,17,29,0.98)_100%)] shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.05),_transparent_24%)]" />

        <div className="relative p-5 sm:p-7 lg:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Official aqua tab
          </div>

          <p className="text-xs uppercase tracking-[0.26em] text-cyan-300/70">
            Aqua • Jet Ski Racing
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            AQUA Sports Hub
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Dive into race organizations, results, racer profiles, featured
            events, and schedule coverage — all in one cleaner AQUA experience.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">
              Browse
            </p>
            <h3 className="mt-1 text-2xl font-bold text-white">
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
            title="Results"
            description="View full motos, race outcomes, podium stories, and class-by-class coverage."
            onClick={onOpenResults}
            highlighted
            cta="Open results"
          />

          <AquaHubCard
            icon={<Search className="h-5 w-5" />}
            title="Search Racers"
            description="Look up racers, compare profiles, and jump directly into individual performance pages."
            onClick={onOpenRacerSearch}
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
            title="Stats & Rankings"
            description="See whos on top of the leaderboards and point system overalls"
            cta="Coming soon"
          />
        </div>
      </div>

      <div className="pt-2">
        <FeaturedRaceSection />
      </div>
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
