import { Link } from "wouter";
import type { EventItem, OrgItem } from "@/hooks/useScoresLandingData";
import UpcomingEventsCalendar from "@/components/landing/UpcomingEventsCalendar";

type Props = {
  organizations: OrgItem[];
  selectedOrgId: string;
  onSelectOrg: (orgId: string) => void;
  events: EventItem[];
  isLoading?: boolean;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMonth(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { month: "short" }).toUpperCase();
}

function formatDay(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { day: "2-digit" });
}

export default function UpcomingEventsSection({
  organizations,
  selectedOrgId,
  onSelectOrg,
  events,
  isLoading,
}: Props) {
  const filtered =
    selectedOrgId === "all"
      ? events
      : events.filter((e) => e.organizationId === selectedOrgId);

  return (
    <section id="schedule-section" className="min-w-0 overflow-hidden pt-20">
      <div className="relative min-w-0 max-w-full overflow-hidden rounded-[26px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(5,12,22,0.98)_100%)] px-3 py-6 shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:rounded-[34px] sm:px-6 sm:py-8 lg:px-8">
        {" "}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>
        <div className="relative min-w-0 max-w-full">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              {" "}
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
              Race Calendar
            </div>

            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199] sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              {" "}
              2026 Schedule
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-4xl text-[2.35rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                {" "}
                Upcoming{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#FF7849_100%)] bg-clip-text text-transparent">
                  Events
                </span>
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Follow the next wave of jet ski racing events, sanctioned
                organizations, and race weekends across the Corner League
                schedule.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.25)] sm:w-auto lg:text-right">
              {" "}
              <div className="text-3xl font-black text-white">
                {filtered.length}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                Listed Events
              </div>
            </div>
          </div>

          <div className="relative mt-8 min-w-0 max-w-full overflow-hidden [contain:inline-size]">
            <div className="max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex min-w-0 max-w-full flex-nowrap gap-2 pr-3 sm:flex sm:max-w-full sm:flex-wrap sm:gap-3 sm:pr-0">
                <button
                  type="button"
                  onClick={() => onSelectOrg("all")}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition duration-200 sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.18em] ${
                    selectedOrgId === "all"
                      ? "bg-cyan-300 text-[#06111d] shadow-[0_0_26px_rgba(34,211,238,0.28)]"
                      : "border border-white/10 bg-white/[0.05] text-white/70 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
                  }`}
                >
                  All
                </button>

                {organizations.map((org) => (
                  <button
                    type="button"
                    key={org.id}
                    onClick={() => onSelectOrg(org.id)}
                    className={`max-w-[62vw] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition duration-200 sm:max-w-none sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.18em] ${
                      selectedOrgId === org.id
                        ? "bg-cyan-300 text-[#06111d] shadow-[0_0_26px_rgba(34,211,238,0.28)]"
                        : "border border-white/10 bg-white/[0.05] text-white/70 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
                    }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#07111F]/80 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col items-start justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-5 sm:flex-row sm:items-center sm:px-5">
              {" "}
              <div>
                <div className="text-sm font-black uppercase tracking-[0.2em] text-white">
                  Upcoming Events
                </div>
                <div className="mt-1 text-xs text-white/45">
                  Event dates, organizations, and locations
                </div>
              </div>
              <div className="rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB199]">
                Schedule Board
              </div>
            </div>

            {isLoading ? (
              <div className="px-5 py-10 text-sm text-slate-300">
                Loading upcoming race schedule…
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-10">
                <div className="max-w-xl rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
                  <div className="text-lg font-black uppercase tracking-[0.08em] text-white">
                    Schedule coming soon
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Events for this organization are being finalized. Check back
                    soon for race dates, locations, and results coverage.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20">
                {filtered.map((event) => (
                  <div
                    key={event.id}
                    className="group grid min-w-0 gap-4 border-b border-white/10 px-4 py-5 transition duration-200 last:border-b-0 hover:bg-cyan-300/[0.035] sm:gap-5 sm:px-5 md:grid-cols-[112px_minmax(0,1fr)_auto]"
                  >
                    <div className="flex items-center gap-4 md:block">
                      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                          {formatMonth(event.startDate)}
                        </div>
                        <div className="mt-1 text-3xl font-black leading-none text-white">
                          {formatDay(event.startDate)}
                        </div>
                      </div>

                      <div className="md:hidden">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                          {formatDate(event.startDate)}
                        </div>
                      </div>
                    </div>

                    <div className="self-center">
                      <div className="min-w-0 break-words text-lg font-black uppercase leading-tight tracking-[0.04em] text-white transition group-hover:text-cyan-100 sm:text-2xl sm:tracking-[0.06em]">
                        {event.name}
                      </div>

                      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-300">
                        {" "}
                        <span className="max-w-full break-words rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white/65 sm:text-xs sm:tracking-[0.14em]">
                          {event.organizationName || "Organization"}
                        </span>
                        <span className="text-white/25">•</span>
                        <span className="text-white/55">
                          {event.location || "Location TBD"}
                        </span>
                      </div>
                    </div>

                    <div className="self-center">
                      <Link
                        href={`/aqua-organizations/event-details/${event.id}?orgId=${encodeURIComponent(
                          event.organizationId || "",
                        )}`}
                      >
                        <button className="w-full rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-300 hover:text-[#06111d] hover:shadow-[0_0_28px_rgba(34,211,238,0.25)] md:w-auto md:py-3 md:tracking-[0.18em]">
                          {" "}
                          View Event
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div id="events-calendar-section" className="mt-8 scroll-mt-24">
            <UpcomingEventsCalendar events={filtered} />
          </div>
        </div>
      </div>
    </section>
  );
}
