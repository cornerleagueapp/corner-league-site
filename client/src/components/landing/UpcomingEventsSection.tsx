import { Link } from "wouter";
import type { EventItem, OrgItem } from "@/hooks/useScoresLandingData";

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

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    <section id="schedule-section" className="pt-20">
      <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/40">
        Schedule
      </div>
      <h2 className="text-4xl font-black uppercase sm:text-5xl">
        Upcoming{" "}
        <span className="bg-[#ff9c9c]/25 px-2 text-[#ffb3b3]">Events</span>
      </h2>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => onSelectOrg("all")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] ${
            selectedOrgId === "all"
              ? "bg-white text-black"
              : "bg-white/10 text-white/70 hover:bg-white/15"
          }`}
        >
          All
        </button>

        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => onSelectOrg(org.id)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] ${
              selectedOrgId === org.id
                ? "bg-white text-black"
                : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
          >
            {org.name}
          </button>
        ))}
      </div>

      <div className="mt-10 border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white/45">
          Upcoming Events
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-white/60">Loading events…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-white/60">
            Results and matches coming soon.
          </div>
        ) : (
          filtered.map((event) => (
            <div
              key={event.id}
              className="grid gap-4 border-b border-white/10 px-4 py-5 md:grid-cols-[130px_1fr_auto]"
            >
              <div>
                <div className="text-2xl text-white/90">
                  {formatDate(event.startDate)}
                </div>
                {/* <div className="text-white/40">
                  {formatTime(event.startDate)}
                </div> */}
              </div>

              <div className="self-center">
                <div className="text-xl font-bold uppercase tracking-[0.08em] text-white">
                  {event.name}
                </div>
                <div className="mt-1 text-sm text-white/45">
                  {event.organizationName || "Organization"} •{" "}
                  {event.location || "Location TBD"}
                </div>
              </div>

              <div className="self-center">
                <Link
                  href={`/aqua-organizations/event-details/${event.id}?orgId=${encodeURIComponent(
                    event.organizationId || "",
                  )}`}
                >
                  <button className="border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
                    View
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-white/50">
        Calendar component goes here next.
      </div>
    </section>
  );
}
