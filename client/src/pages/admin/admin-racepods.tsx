import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Battery,
  Cpu,
  Database,
  Radio,
  RefreshCw,
  Route as RouteIcon,
  Timer,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

type RacePodOverview = {
  devices: {
    total: number;
    active: number;
    assignedToUsers: number;
    assignedToAthletes: number;
  };
  sessions: {
    total: number;
    active: number;
    completed: number;
    recent: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      startedAt: string;
      endedAt?: string | null;
      pointCount: number;
    }>;
  };
  points: {
    total: number;
    today: number;
  };
  usage: {
    estimatedRecentDistanceMiles: number;
  };
  latestLivePositions: Array<{
    id: string;
    deviceId: string;
    raceSessionId?: string | null;
    athleteId?: string | null;
    latitude: string;
    longitude: string;
    speedMph?: number | null;
    heading?: number | null;
    batteryPercent?: number | null;
    lastSeenAt: string;
  }>;
  generatedAt: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function statValue(value: number | string | null | undefined, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-[#06101b]/90 p-5 shadow-[0_0_0_1px_rgba(34,211,238,0.03)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
          {hint ? (
            <div className="mt-1 text-sm text-gray-400">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = String(status || "").toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
        normalized === "active"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : normalized === "completed"
            ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
            : "border-white/10 bg-white/[0.04] text-white/55",
      )}
    >
      {status || "unknown"}
    </span>
  );
}

export default function AdminRacePodsPage() {
  const [overview, setOverview] = useState<RacePodOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const loadOverview = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const res = await apiFetch("/telemetry/admin/overview", {
        method: "GET",
        noRefresh: true,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Failed to load RacePod overview.");
      }

      const json = await res.json().catch(() => ({}));
      const data = json?.data ?? json;

      setOverview(data);
    } catch (e: any) {
      const message = e?.message || "Failed to load RacePod overview.";
      setError(message);

      if (silent) {
        toast({
          title: "RacePod refresh failed",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (!overview?.sessions?.active) return;

    const interval = window.setInterval(() => {
      loadOverview(true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [overview?.sessions?.active]);

  const latestPosition = overview?.latestLivePositions?.[0];

  const activeSessionCount = useMemo(
    () =>
      overview?.sessions?.recent?.filter((s) => s.status === "active").length ??
      0,
    [overview],
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-3 text-[11px] uppercase tracking-[0.35em] text-cyan-300/70">
            Super Admin · RacePod Telemetry
          </div>

          <div className="overflow-hidden rounded-[28px] border border-cyan-400/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),linear-gradient(90deg,rgba(4,19,34,0.98),rgba(0,34,68,0.92),rgba(4,19,34,0.98))] p-6 shadow-[0_10px_50px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-200">
              Corner League RacePod Console
            </div>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  RacePod Admin Dashboard
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
                  Monitor active devices, synced RacePods, telemetry points,
                  live sessions, and the latest GPS positions from your Corner
                  League tracker fleet.
                </p>
              </div>

              <button
                onClick={() => loadOverview(true)}
                disabled={refreshing}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition",
                  refreshing
                    ? "cursor-not-allowed border-cyan-400/10 bg-cyan-400/5 text-cyan-200/50"
                    : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20",
                )}
              >
                <RefreshCw
                  className={cn("h-4 w-4", refreshing && "animate-spin")}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-300">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                Generated:{" "}
                <span className="font-medium text-white">
                  {formatDate(overview?.generatedAt)}
                </span>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                Live sessions in recent list:{" "}
                <span className="font-medium text-white">
                  {activeSessionCount}
                </span>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                Auto-refresh:{" "}
                <span className="font-medium text-white">
                  {overview?.sessions?.active ? "15s while live" : "Off"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/5 bg-[#07111a] p-8 text-center text-gray-400">
            Loading RacePod overview...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : overview ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Devices"
                value={overview.devices.total}
                hint={`${overview.devices.active} active devices`}
                icon={<Cpu className="h-5 w-5" />}
              />

              <StatCard
                label="Race Sessions"
                value={overview.sessions.total}
                hint={`${overview.sessions.active} active · ${overview.sessions.completed} completed`}
                icon={<Activity className="h-5 w-5" />}
              />

              <StatCard
                label="Telemetry Points"
                value={overview.points.total.toLocaleString()}
                hint={`${overview.points.today.toLocaleString()} today`}
                icon={<Database className="h-5 w-5" />}
              />

              <StatCard
                label="Recent Distance"
                value={`${overview.usage.estimatedRecentDistanceMiles} mi`}
                hint="Estimated from recent sessions"
                icon={<RouteIcon className="h-5 w-5" />}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="User Synced"
                value={overview.devices.assignedToUsers}
                hint="Devices linked to accounts"
                icon={<Radio className="h-5 w-5" />}
              />

              <StatCard
                label="Athlete Synced"
                value={overview.devices.assignedToAthletes}
                hint="Devices linked to racer profiles"
                icon={<Zap className="h-5 w-5" />}
              />

              <StatCard
                label="Latest Battery"
                value={
                  latestPosition?.batteryPercent !== null &&
                  latestPosition?.batteryPercent !== undefined
                    ? `${latestPosition.batteryPercent}%`
                    : "—"
                }
                hint="Most recent live position"
                icon={<Battery className="h-5 w-5" />}
              />

              <StatCard
                label="Latest Speed"
                value={
                  latestPosition?.speedMph !== null &&
                  latestPosition?.speedMph !== undefined
                    ? `${latestPosition.speedMph} mph`
                    : "—"
                }
                hint="Most recent live position"
                icon={<Timer className="h-5 w-5" />}
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_420px]">
              <div className="rounded-2xl border border-white/5 bg-[#07111a] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
                      RacePod Sessions
                    </div>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      Recent Sessions
                    </h2>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.18em] text-gray-500">
                        <th className="px-3 py-2">Session</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Started</th>
                        <th className="px-3 py-2 text-right">Points</th>
                      </tr>
                    </thead>

                    <tbody>
                      {overview.sessions.recent.length ? (
                        overview.sessions.recent.map((session) => (
                          <tr
                            key={session.id}
                            className="rounded-2xl bg-white/[0.02] text-sm text-gray-200"
                          >
                            <td className="rounded-l-xl px-3 py-3">
                              <div className="max-w-[360px] truncate font-semibold text-white">
                                {session.name || "Untitled Session"}
                              </div>
                              <div className="mt-1 max-w-[360px] truncate font-mono text-[11px] text-gray-500">
                                {session.id}
                              </div>
                            </td>

                            <td className="px-3 py-3 capitalize text-gray-300">
                              {session.type || "—"}
                            </td>

                            <td className="px-3 py-3">
                              <StatusPill status={session.status} />
                            </td>

                            <td className="px-3 py-3 text-gray-400">
                              {formatDate(session.startedAt)}
                            </td>

                            <td className="rounded-r-xl px-3 py-3 text-right font-semibold text-white">
                              {session.pointCount}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-12 text-center text-gray-500"
                          >
                            No RacePod sessions yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#07111a] p-5">
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
                    Live Devices
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    Latest Positions
                  </h2>
                </div>

                <div className="space-y-3">
                  {overview.latestLivePositions.length ? (
                    overview.latestLivePositions.map((position) => (
                      <div
                        key={position.id}
                        className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-mono text-xs text-cyan-200">
                              {position.deviceId}
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                              {position.latitude}, {position.longitude}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-semibold text-white">
                              {statValue(position.speedMph, " mph")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(position.lastSeenAt)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-400">
                          <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                            Heading:{" "}
                            <span className="text-white">
                              {statValue(position.heading)}
                            </span>
                          </div>

                          <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                            Battery:{" "}
                            <span className="text-white">
                              {statValue(position.batteryPercent, "%")}
                            </span>
                          </div>
                        </div>

                        {position.raceSessionId ? (
                          <div className="mt-3 truncate rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2 font-mono text-[11px] text-cyan-100/70">
                            Session: {position.raceSessionId}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center text-gray-500">
                      No live positions yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
