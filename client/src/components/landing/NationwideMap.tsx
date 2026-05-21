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
                isActive ? "rgba(255,107,53,0.25)" : "rgba(103,232,249,0.16)"
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
                isActive ? "rgba(255,120,73,0.75)" : "rgba(103,232,249,0.42)"
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
    <section id="event-map-section" className="scroll-mt-24 pt-20">
      <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(4,10,19,0.98)_100%)] px-4 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:rounded-[38px] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
              Nationwide
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199] sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              Race Footprint
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-4xl text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                Event{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#FF7849_100%)] bg-clip-text text-transparent">
                  Map
                </span>
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Explore where jet ski racing is active across the country, from
                upcoming race weekends to recent event coverage.
              </p>
            </div>

            <div className="inline-flex w-fit overflow-hidden rounded-full border border-cyan-300/10 bg-white/[0.04] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
              {filterButtons.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    filter === item.key
                      ? "bg-cyan-300 text-[#06111d] shadow-[0_0_22px_rgba(34,211,238,0.2)]"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-2xl font-black text-white">
                {filteredPoints.length}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                Events
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-2xl font-black text-white">
                {uniqueStatesCount}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                States
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-2xl font-black text-white">
                {uniqueOrganizationsCount}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                Organizations
              </div>
            </div>

            <div className="rounded-[22px] border border-cyan-300/15 bg-cyan-300/[0.08] px-4 py-4">
              <div className="truncate text-2xl font-black text-cyan-200">
                {activeCluster?.stateCode || "—"}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                Current Focus
              </div>
            </div>
          </div>

          <div className="mt-10 grid min-w-0 items-start gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <div className="relative min-w-0 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-4">
              <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:48px_48px]" />

              <div className="relative aspect-[16/11] min-h-[260px] w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#02070b] shadow-[inset_0_0_30px_rgba(0,0,0,0.28)] sm:aspect-[16/10]">
                <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.05),transparent_55%)]" />

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
                        <span className="absolute inset-0 animate-ping rounded-full bg-[#FF7849]/30" />
                      ) : null}

                      <span
                        className={`relative flex items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-200 ${
                          isActive
                            ? "h-7 min-w-[28px] border-white bg-[#FF7849] px-1.5 text-black shadow-[0_0_0_10px_rgba(255,120,73,0.20)]"
                            : "h-6 min-w-[24px] border-white/70 bg-cyan-300 px-1.5 text-black hover:scale-110 hover:bg-[#FF7849]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
                Highlighted Event
              </div>

              {!activeCluster || !activeEvent ? (
                <div className="mt-4 text-sm leading-7 text-slate-300">
                  Event locations will appear here as they are added.
                </div>
              ) : (
                <div className="mt-4 min-w-0">
                  <div className="min-w-0 break-words text-2xl font-black uppercase leading-tight tracking-[-0.02em] text-white">
                    {activeEvent.name}
                  </div>

                  <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                    <span className="max-w-full break-words rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white/65 sm:text-xs">
                      {activeEvent.organizationName || "Organization"}
                    </span>

                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-cyan-200 sm:text-xs">
                      {activeCluster.stateName}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] sm:text-xs ${
                        getEventStatus(
                          activeEvent.startDate,
                          activeEvent.endDate,
                        ) === "upcoming"
                          ? "border border-[#FF6B35]/20 bg-[#FF6B35]/10 text-[#FFB199]"
                          : "border border-white/10 bg-white/[0.04] text-white/60"
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

                  <div className="mt-5 space-y-2 text-sm leading-7 text-slate-300">
                    <div>{activeEvent.location || "Location TBD"}</div>
                    <div>
                      {formatDateRange(
                        activeEvent.startDate,
                        activeEvent.endDate,
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/aqua-organizations/event-details/${activeEvent.id}?orgId=${encodeURIComponent(
                        activeEvent.organizationId || "",
                      )}`}
                    >
                      <button className="w-full rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-300 hover:text-[#06111d] sm:w-auto">
                        View Event
                      </button>
                    </Link>
                  </div>

                  {activeCluster.events.length > 1 ? (
                    <div className="mt-8">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                        More Events In This Area
                      </div>

                      <div className="mt-3 max-h-[400px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20">
                        {activeCluster.events.slice(1).map((event) => (
                          <Link
                            key={event.id}
                            href={`/aqua-organizations/event-details/${event.id}?orgId=${encodeURIComponent(
                              event.organizationId || "",
                            )}`}
                          >
                            <div className="group min-w-0 cursor-pointer rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
                              <div className="break-words font-bold uppercase leading-snug text-white group-hover:text-cyan-300">
                                {event.name}
                              </div>
                              <div className="mt-1 break-words text-sm leading-6 text-white/55">
                                {event.organizationName || "Organization"} •{" "}
                                {formatDateRange(
                                  event.startDate,
                                  event.endDate,
                                )}
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
        </div>
      </div>
    </section>
  );
}
