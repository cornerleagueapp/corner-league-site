import LoadingCards from "@/components/ui/LoadingCards";
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
      <div className="relative min-w-0 max-w-full overflow-hidden rounded-[26px] border border-cl-accent/10 cl-panel-wash px-3 py-6 shadow-cl-panel sm:rounded-[34px] sm:px-6 sm:py-8 lg:px-8">
        {" "}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>
        <div className="relative min-w-0 max-w-full">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              {" "}
              <span className="h-2 w-2 rounded-full bg-cl-accent shadow-cl-panel" />
              Race Calendar
            </div>

            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              {" "}
              2026 Schedule
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-4xl text-[2.35rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-cl-ink min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                {" "}
                Upcoming <span className="cl-title-accent">Events</span>
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted sm:text-base">
                Follow the next wave of jet ski racing events, sanctioned
                organizations, and race weekends across the Corner League
                schedule.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-cl-border bg-cl-subtle px-5 py-4 text-left shadow-cl-panel sm:w-auto lg:text-right">
              {" "}
              <div className="text-3xl font-black text-cl-ink">
                {filtered.length}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cl-muted">
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
                      ? "bg-cl-accent text-cl-contrast shadow-cl-panel"
                      : "border border-cl-border bg-cl-subtle text-cl-muted hover:border-cl-accent/25 hover:bg-cl-accent/10 hover:text-cl-ink"
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
                        ? "bg-cl-accent text-cl-contrast shadow-cl-panel"
                        : "border border-cl-border bg-cl-subtle text-cl-muted hover:border-cl-accent/25 hover:bg-cl-accent/10 hover:text-cl-ink"
                    }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-[28px] border border-cl-accent/10 bg-cl-surface shadow-cl-panel">
            <div className="flex flex-col items-start justify-between gap-3 border-b border-cl-border bg-cl-subtle px-4 py-5 sm:flex-row sm:items-center sm:px-5">
              {" "}
              <div>
                <div className="text-sm font-black uppercase tracking-[0.2em] text-cl-ink">
                  Upcoming Events
                </div>
                <div className="mt-1 text-xs text-cl-muted">
                  Event dates, organizations, and locations
                </div>
              </div>
              <div className="rounded-full border border-cl-accent/20 bg-cl-accent/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
                Schedule Board
              </div>
            </div>

            {isLoading ? (
              <div className="p-5"><LoadingCards label="Loading upcoming race schedule…" count={3}/></div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-10">
                <div className="max-w-xl rounded-[24px] border border-cl-border bg-cl-subtle p-6">
                  <div className="text-lg font-black uppercase tracking-[0.08em] text-cl-ink">
                    Schedule coming soon
                  </div>
                  <p className="mt-3 text-sm leading-7 text-cl-muted">
                    Events for this organization are being finalized. Check back
                    soon for race dates, locations, and results coverage.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cl-accent/20">
                {filtered.map((event) => (
                  <div
                    key={event.id}
                    className="group grid min-w-0 gap-4 border-b border-cl-border px-4 py-5 transition duration-200 last:border-b-0 hover:bg-cl-accent/[0.035] sm:gap-5 sm:px-5 md:grid-cols-[112px_minmax(0,1fr)_auto]"
                  >
                    <div className="flex items-center gap-4 md:block">
                      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[24px] border border-cl-accent/15 bg-cl-accent/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
                          {formatMonth(event.startDate)}
                        </div>
                        <div className="mt-1 text-3xl font-black leading-none text-cl-ink">
                          {formatDay(event.startDate)}
                        </div>
                      </div>

                      <div className="md:hidden">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-cl-muted">
                          {formatDate(event.startDate)}
                        </div>
                      </div>
                    </div>

                    <div className="self-center">
                      <div className="min-w-0 break-words text-lg font-black uppercase leading-tight tracking-[0.04em] text-cl-ink transition group-hover:text-cl-accent sm:text-2xl sm:tracking-[0.06em]">
                        {event.name}
                      </div>

                      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-sm text-cl-muted">
                        {" "}
                        <span className="max-w-full break-words rounded-full border border-cl-border bg-cl-subtle px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-cl-muted sm:text-xs sm:tracking-[0.14em]">
                          {event.organizationName || "Organization"}
                        </span>
                        <span className="text-cl-muted">•</span>
                        <span className="text-cl-muted">
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
                        <button className="w-full rounded-full border border-cl-accent/20 bg-cl-accent/10 px-5 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-cl-accent transition duration-200 hover:-translate-y-0.5 hover:border-cl-accent/40 hover:bg-cl-accent hover:text-cl-contrast hover:shadow-cl-panel md:w-auto md:py-3 md:tracking-[0.18em]">
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
