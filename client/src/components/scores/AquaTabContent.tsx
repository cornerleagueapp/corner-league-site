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
import { apiFetch } from "@/lib/apiClient";
import AquaScoresSection from "@/components/AquaScoresSection";
import AccordionSection from "@/components/AccordionSection";
import { markHahn300 } from "@/data/markHanRace";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

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
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB199]">
          Featured Race
        </div>

        <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-white sm:text-4xl">
          {markHahn300.title}
        </h2>

        <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-cyan-200/65">
          {markHahn300.date}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#FF6B35]/10 blur-3xl" />
        </div>

        <div className="relative">
          <AccordionSection
            labelShow="Show Final Results - Overall"
            labelHide="Hide Final Results - Overall"
          >
            <div className="space-y-4">
              <div className="text-sm text-white/70">
                {markHahn300.subtitle}
              </div>

              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/25">
                <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20">
                  <table className="min-w-[680px] text-sm">
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
                <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-4">
                  <div className="mb-2 text-sm font-semibold text-white">
                    Penalties
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-white/75">
                    {markHahn300.penalties.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-4">
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
      className={`group relative min-w-0 overflow-hidden rounded-[30px] border p-5 text-left shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 sm:p-6 ${
        highlighted
          ? "border-cyan-300/25 bg-[linear-gradient(135deg,rgba(25,227,255,0.16)_0%,rgba(7,17,31,0.98)_46%,rgba(255,107,53,0.12)_100%)]"
          : "border-cyan-300/10 bg-[#07111F]/80 hover:border-cyan-300/25 hover:bg-cyan-300/[0.045]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 top-0 h-52 w-52 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px]" />
      </div>

      <div className="relative flex h-full min-w-0 flex-col justify-between gap-6">
        <div className="min-w-0">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
              {icon}
            </div>

            {badge ? (
              <span className="max-w-[120px] truncate rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199]">
                {badge}
              </span>
            ) : null}
          </div>

          <h3 className="break-words text-xl font-black uppercase leading-tight tracking-[-0.02em] text-white">
            {title}
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
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

      <div className="relative z-10 flex max-h-[88vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F] shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
        <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.98)_0%,rgba(4,10,19,0.98)_100%)] px-4 py-4 sm:px-6">
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
                        className="min-w-0 rounded-[24px] border border-cyan-300/10 bg-[#07111F]/80 p-5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.045]"
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
                        className="min-w-0 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04]"
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

function VoteAwardsBanner({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-[28px] border border-[#FF6B35]/20 bg-[linear-gradient(135deg,rgba(255,107,53,0.16)_0%,rgba(7,17,31,0.94)_42%,rgba(25,227,255,0.10)_100%)] p-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-[#FF6B35]/35 hover:bg-[#FF6B35]/[0.08] sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#FF6B35]/12 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:46px_46px]" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/15 text-[#FFB199] shadow-[0_0_28px_rgba(255,107,53,0.12)]">
            <Trophy className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
              Live Fan Voting
            </div>

            <h3 className="text-xl font-black uppercase leading-tight tracking-[-0.02em] text-white sm:text-2xl">
              Vote for Awards Now
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Help pick fan favorites, MVPs, and community awards across AQUA
              racing.
            </p>
          </div>
        </div>

        <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#FFB199] transition group-hover:bg-[#FF6B35]/20 sm:self-center">
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
      <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(4,10,19,0.98)_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:rounded-[38px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative p-5 sm:p-7 lg:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
              Official Aqua Tab
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199] sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              Jet Ski Racing
            </div>
          </div>

          <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/65">
            Aqua • Race Results • Athlete Profiles
          </p>

          <h2 className="mt-3 max-w-4xl text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
            AQUA{" "}
            <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#FF7849_100%)] bg-clip-text text-transparent">
              Sports Hub
            </span>
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
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
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/65">
              Browse
            </p>
            <h3 className="mt-1 text-3xl font-black uppercase tracking-[-0.03em] text-white">
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
            // onClick={onOpenResults}
            highlighted
            // cta="Open results"
            cta="Coming soon"
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
