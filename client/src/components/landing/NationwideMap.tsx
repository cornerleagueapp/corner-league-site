import React from "react";
import { Link } from "wouter";
import type { EventItem } from "@/hooks/useScoresLandingData";
import usMapOutline from "@assets/us-map-outline.svg";

type Props = {
  events: EventItem[];
};

type GeoMeta = {
  x: number;
  y: number;
  stateCode: string;
  stateName: string;
};

type MapPoint = EventItem & GeoMeta;

type Cluster = {
  key: string;
  x: number;
  y: number;
  stateCode: string;
  stateName: string;
  events: MapPoint[];
};

type FilterKey = "all" | "upcoming" | "past";

const STATE_OVERLAYS: Record<
  string,
  { cx: number; cy: number; rx: number; ry: number }
> = {
  CA: { cx: 140, cy: 365, rx: 42, ry: 78 },
  AZ: { cx: 183, cy: 392, rx: 34, ry: 36 },
  TX: { cx: 475, cy: 445, rx: 72, ry: 52 },
  FL: { cx: 780, cy: 535, rx: 48, ry: 24 },
  NY: { cx: 790, cy: 215, rx: 26, ry: 22 },
  KS: { cx: 462, cy: 325, rx: 42, ry: 24 },
  US: { cx: 500, cy: 310, rx: 40, ry: 24 },
};

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Date TBD";
  }

  return `${start.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })}`;
}

function formatDateTime(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "TBD";

  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEventStatus(
  startDate: string,
  endDate: string,
): "upcoming" | "past" {
  const compare = new Date(endDate || startDate).getTime();
  return compare >= Date.now() ? "upcoming" : "past";
}

function deriveGeoMeta(location?: string | null): GeoMeta {
  const text = (location || "").toLowerCase();

  if (
    text.includes("lake havasu") ||
    text.includes("arizona") ||
    text.includes(", az") ||
    text.includes(" az ")
  ) {
    return { x: 18, y: 63, stateCode: "AZ", stateName: "Arizona" };
  }

  if (
    text.includes("st. petersburg") ||
    text.includes("florida") ||
    text.includes(", fl") ||
    text.includes(" fl ")
  ) {
    return { x: 83, y: 73, stateCode: "FL", stateName: "Florida" };
  }

  if (
    text.includes("orange, tx") ||
    text.includes("texas") ||
    text.includes(", tx") ||
    text.includes(" tx ")
  ) {
    return { x: 52, y: 67, stateCode: "TX", stateName: "Texas" };
  }

  if (text.includes("lake alfred")) {
    return { x: 81, y: 71, stateCode: "FL", stateName: "Florida" };
  }

  if (
    text.includes("california") ||
    text.includes(", ca") ||
    text.includes(" ca ")
  ) {
    return { x: 10, y: 55, stateCode: "CA", stateName: "California" };
  }

  if (
    text.includes("new york") ||
    text.includes(", ny") ||
    text.includes(" ny ")
  ) {
    return { x: 84, y: 34, stateCode: "NY", stateName: "New York" };
  }

  if (
    text.includes("kansas") ||
    text.includes(", ks") ||
    text.includes(" ks ")
  ) {
    return { x: 51, y: 49, stateCode: "KS", stateName: "Kansas" };
  }

  return { x: 50, y: 50, stateCode: "US", stateName: "United States" };
}

function InlineUSMap({
  highlightedStates,
  activeStateCode,
}: {
  highlightedStates: string[];
  activeStateCode?: string | null;
}) {
  const uniqueStates = Array.from(new Set(highlightedStates)).filter(Boolean);

  return (
    <svg
      viewBox="0 0 1000 620"
      className="h-full w-full"
      role="img"
      aria-label="United States event map"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="stateGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <image
        href={usMapOutline}
        x="0"
        y="0"
        width="1000"
        height="620"
        preserveAspectRatio="xMidYMid meet"
        opacity="0.92"
      />

      {uniqueStates.map((code) => {
        const overlay = STATE_OVERLAYS[code];
        if (!overlay) return null;

        const isActive = activeStateCode === code;

        return (
          <g key={code}>
            <ellipse
              cx={overlay.cx}
              cy={overlay.cy}
              rx={overlay.rx}
              ry={overlay.ry}
              fill={
                isActive ? "rgba(255,179,179,0.26)" : "rgba(103,232,249,0.16)"
              }
              filter={isActive ? "url(#activeGlow)" : "url(#stateGlow)"}
            />
            <ellipse
              cx={overlay.cx}
              cy={overlay.cy}
              rx={overlay.rx}
              ry={overlay.ry}
              fill="none"
              stroke={
                isActive ? "rgba(255,255,255,0.65)" : "rgba(103,232,249,0.35)"
              }
              strokeWidth="2"
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function NationwideMap({ events }: Props) {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [activeClusterKey, setActiveClusterKey] = React.useState<string | null>(
    null,
  );

  const points = React.useMemo<MapPoint[]>(() => {
    return events.map((event) => {
      const geo = deriveGeoMeta(event.location);
      return {
        ...event,
        ...geo,
      };
    });
  }, [events]);

  const filteredPoints = React.useMemo(() => {
    return points.filter((point) => {
      const status = getEventStatus(point.startDate, point.endDate);

      if (filter === "upcoming") return status === "upcoming";
      if (filter === "past") return status === "past";
      return true;
    });
  }, [points, filter]);

  const clusters = React.useMemo<Cluster[]>(() => {
    const grouped = new Map<string, Cluster>();

    for (const point of filteredPoints) {
      const key = `${point.stateCode}-${point.x}-${point.y}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          x: point.x,
          y: point.y,
          stateCode: point.stateCode,
          stateName: point.stateName,
          events: [],
        });
      }

      grouped.get(key)!.events.push(point);
    }

    const list = Array.from(grouped.values()).map((cluster) => ({
      ...cluster,
      events: [...cluster.events].sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      ),
    }));

    return list.sort((a, b) => b.events.length - a.events.length);
  }, [filteredPoints]);

  React.useEffect(() => {
    if (!clusters.length) {
      setActiveClusterKey(null);
      return;
    }

    const stillExists = clusters.some(
      (cluster) => cluster.key === activeClusterKey,
    );
    if (!stillExists) {
      setActiveClusterKey(clusters[0].key);
    }
  }, [clusters, activeClusterKey]);

  const activeCluster =
    clusters.find((cluster) => cluster.key === activeClusterKey) ?? null;

  const activeEvent = activeCluster?.events[0] ?? null;

  const uniqueStatesCount = React.useMemo(() => {
    return new Set(filteredPoints.map((point) => point.stateCode)).size;
  }, [filteredPoints]);

  const uniqueOrganizationsCount = React.useMemo(() => {
    return new Set(
      filteredPoints.map((point) => point.organizationId).filter(Boolean),
    ).size;
  }, [filteredPoints]);

  const highlightedStates = React.useMemo(() => {
    return filteredPoints.map((point) => point.stateCode);
  }, [filteredPoints]);

  const filterButtons: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  return (
    <section className="pt-20">
      <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/40">
        Nationwide Promotion
      </div>
      <h2 className="text-4xl font-black uppercase sm:text-5xl">
        Event <span className="bg-[#ff9c9c]/25 px-2 text-[#ffb3b3]">Map</span>
      </h2>

      <div className="mt-6 flex flex-wrap gap-3">
        {filterButtons.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
              filter === item.key
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-white/60">
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
          {filteredPoints.length} Events
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
          {uniqueStatesCount} States
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
          {uniqueOrganizationsCount} Organizations
        </div>
        {activeCluster?.stateName ? (
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-cyan-200">
            Focus: {activeCluster.stateName}
          </div>
        ) : null}
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(6,20,30,0.96)_0%,rgba(2,9,14,1)_100%)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:36px_36px]" />

          <div className="relative aspect-[16/10] w-full rounded-[22px] border border-white/10 bg-[#02070b] shadow-[inset_0_0_30px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.05),transparent_55%)]" />

            <InlineUSMap
              highlightedStates={highlightedStates}
              activeStateCode={activeCluster?.stateCode}
            />

            {clusters.map((cluster) => {
              const isActive = activeCluster?.key === cluster.key;
              const count = cluster.events.length;

              return (
                <button
                  key={cluster.key}
                  type="button"
                  onClick={() => setActiveClusterKey(cluster.key)}
                  onMouseEnter={() => setActiveClusterKey(cluster.key)}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${cluster.x}%`,
                    top: `${cluster.y}%`,
                  }}
                  aria-label={`${cluster.stateName} event cluster`}
                >
                  {isActive ? (
                    <span className="absolute inset-0 rounded-full bg-[#ffb3b3]/30 animate-ping" />
                  ) : null}

                  <span
                    className={`relative flex items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-200 ${
                      isActive
                        ? "h-6 min-w-[24px] border-white bg-[#ffb3b3] px-1.5 text-black shadow-[0_0_0_10px_rgba(255,179,179,0.20)]"
                        : "h-5 min-w-[20px] border-white/70 bg-cyan-300 px-1.5 text-black hover:scale-110 hover:bg-[#ffb3b3]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm font-bold uppercase tracking-[0.16em] text-white/45">
            Highlighted Event
          </div>

          {!activeCluster || !activeEvent ? (
            <div className="mt-4 text-white/55">
              Event locations will appear here as they are added.
            </div>
          ) : (
            <div className="mt-4">
              <div className="text-2xl font-bold text-white">
                {activeEvent.name}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/65">
                  {activeEvent.organizationName || "Organization"}
                </span>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-cyan-200">
                  {activeCluster.stateName}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                    getEventStatus(
                      activeEvent.startDate,
                      activeEvent.endDate,
                    ) === "upcoming"
                      ? "bg-[#ff9c9c]/20 text-[#ffb3b3]"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {getEventStatus(
                    activeEvent.startDate,
                    activeEvent.endDate,
                  ) === "upcoming"
                    ? "Upcoming"
                    : "Past Event"}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-white/65">
                <div>{activeEvent.location || "Location TBD"}</div>
                <div>
                  {formatDateRange(activeEvent.startDate, activeEvent.endDate)}
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/aqua-organizations/event-details/${activeEvent.id}?orgId=${encodeURIComponent(
                    activeEvent.organizationId || "",
                  )}`}
                >
                  <button className="border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10">
                    View Event
                  </button>
                </Link>
              </div>

              {activeCluster.events.length > 1 ? (
                <div className="mt-8">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                    More Events In This Area
                  </div>

                  <div className="mt-3 max-h-[400px] space-y-3 overflow-y-auto pr-1">
                    {activeCluster.events.slice(1).map((event) => (
                      <Link
                        key={event.id}
                        href={`/aqua-organizations/event-details/${event.id}?orgId=${encodeURIComponent(
                          event.organizationId || "",
                        )}`}
                      >
                        <div className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                          <div className="font-semibold text-white">
                            {event.name}
                          </div>
                          <div className="mt-1 text-sm text-white/55">
                            {event.organizationName || "Organization"} •{" "}
                            {formatDateRange(event.startDate, event.endDate)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
