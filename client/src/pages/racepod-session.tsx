import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Activity,
  ArrowLeft,
  Gauge,
  MapPinned,
  Radio,
  Route,
  Share2,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type TelemetryPoint = {
  id: string;
  deviceId: string;
  raceSessionId: string | null;
  athleteId: string | null;
  timestamp: string;
  latitude: string;
  longitude: string;
  speedMph: number | null;
  heading: number | null;
  elevationFt: number | null;
  batteryPercent: number | null;
  signalStrength: number | null;
};

type SessionSummary = {
  sessionId: string;
  session: {
    id: string;
    name: string;
    type: string;
    status: string;
    userId?: string | null;
    title?: string | null;
    description?: string | null;
    visibility?: string;
    publishedAt?: string | null;
    startedAt: string;
    endedAt?: string | null;
  };
  pointCount: number;
  durationSeconds: number;
  distanceMiles: number;
  maxSpeedMph: number;
  avgSpeedMph: number;
  topSpeedPoint: any | null;
  fastestSegment: any | null;
  hardAccelerationEvents: any[];
  hardDecelerationEvents: any[];
  turnEvents: any[];
  speedSeries: Array<{
    pointId: string;
    timestamp: string;
    speedMph: number;
    latitude: number;
    longitude: number;
    heading: number | null;
    elevationFt: number | null;
  }>;
  routeBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    center: {
      latitude: number;
      longitude: number;
    };
  } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatDuration(seconds?: number | null) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function valueOrDash(value: any, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black text-white">{value}</div>
          {helper ? (
            <div className="mt-1 text-sm text-white/45">{helper}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniRoutePreview({
  points,
}: {
  points: Array<{ latitude: number; longitude: number }>;
}) {
  const path = useMemo(() => {
    if (points.length < 2) return "";

    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.000001;
    const lngRange = maxLng - minLng || 0.000001;

    return points
      .map((point, index) => {
        const x = 24 + ((point.longitude - minLng) / lngRange) * 552;
        const y = 276 - ((point.latitude - minLat) / latRange) * 232;

        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [points]);

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.10),transparent_35%),linear-gradient(135deg,rgba(7,17,31,0.96),rgba(3,9,19,0.98))] p-5">
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
            Route Preview
          </div>
          <div className="mt-1 text-sm text-white/45">
            {points.length} GPS point{points.length === 1 ? "" : "s"}
          </div>
        </div>

        <MapPinned className="h-5 w-5 text-cyan-200" />
      </div>

      {points.length >= 2 ? (
        <svg
          viewBox="0 0 600 300"
          className="relative z-10 h-[240px] w-full"
          role="img"
          aria-label="RacePod route preview"
        >
          <path
            d={path}
            fill="none"
            stroke="rgba(124,244,255,0.95)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            stroke="rgba(255,107,53,0.65)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div className="relative z-10 grid min-h-[230px] place-items-center rounded-2xl border border-white/10 bg-black/20 text-center">
          <div>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
              <Route className="h-5 w-5 text-cyan-100" />
            </div>
            <div className="text-sm font-bold text-white">
              Route needs more points
            </div>
            <div className="mt-1 text-sm text-white/45">
              Record at least 2 GPS points to draw the replay path.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RacePodSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const sessionId = params.sessionId;

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [points, setPoints] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const userId = String(
    (user as any)?.id ||
      (user as any)?.userId ||
      (user as any)?.uid ||
      (user as any)?.firebaseUid ||
      "",
  );

  const loadSession = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const publicRes = await apiFetch(
        `/telemetry/public/sessions/${sessionId}/replay`,
        {
          method: "GET",
          noRefresh: true,
        },
      );

      if (publicRes.ok) {
        const publicJson = await publicRes.json().catch(() => ({}));
        const replay = publicJson?.data ?? publicJson;

        setSummary(replay.summary);
        setPoints(replay.points ?? []);
        return;
      }

      const [summaryRes, pointsRes] = await Promise.all([
        apiFetch(`/telemetry/sessions/${sessionId}/summary`, {
          method: "GET",
          noRefresh: true,
        }),
        apiFetch(`/telemetry/sessions/${sessionId}/points`, {
          method: "GET",
          noRefresh: true,
        }),
      ]);

      if (!summaryRes.ok) {
        const json = await summaryRes.json().catch(() => ({}));
        throw new Error(json?.message || "Failed to load session summary.");
      }

      if (!pointsRes.ok) {
        const json = await pointsRes.json().catch(() => ({}));
        throw new Error(json?.message || "Failed to load session points.");
      }

      const summaryJson = await summaryRes.json().catch(() => ({}));
      const pointsJson = await pointsRes.json().catch(() => ({}));

      setSummary(summaryJson?.data ?? summaryJson);
      setPoints(pointsJson?.data ?? pointsJson ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load RacePod session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const routePoints = useMemo(
    () =>
      points
        .map((point) => ({
          latitude: Number(point.latitude),
          longitude: Number(point.longitude),
        }))
        .filter(
          (point) =>
            Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
        ),
    [points],
  );

  const latestPoint = points[points.length - 1];

  const publicShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/racepod/sessions/${sessionId}`
      : `/racepod/sessions/${sessionId}`;

  const handlePublishSession = async () => {
    if (!sessionId || !userId) {
      toast({
        title: "Unable to publish",
        description: "Please log in again before publishing this session.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await apiFetch(
        `/telemetry/my/sessions/${sessionId}/publish`,
        {
          method: "POST",
          noRefresh: true,
          body: JSON.stringify({ userId }),
        },
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Could not publish RacePod session.");
      }

      toast({
        title: "RacePod session published",
        description: "This replay can now be viewed by anyone with the link.",
      });

      await loadSession();
    } catch (e: any) {
      toast({
        title: "Publish failed",
        description: e?.message || "Could not publish RacePod session.",
        variant: "destructive",
      });
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(publicShareUrl);

      toast({
        title: "Share link copied",
        description: "Anyone with access to this public replay can view it.",
      });
    } catch {
      toast({
        title: "Could not copy link",
        description: publicShareUrl,
      });
    }
  };

  if (loading) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#030913] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_28%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="relative rounded-[28px] border border-cyan-300/10 bg-[#07111F]/80 px-8 py-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full border border-cyan-300/25 bg-cyan-300/10" />
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
            Loading Replay
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Building RacePod session analytics…
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="relative min-h-screen bg-[#030913] px-4 py-8 text-white">
        <button
          type="button"
          onClick={() => navigate("/racepod")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to RacePod
        </button>

        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-red-100">
          {error || "RacePod session not found."}
        </div>
      </div>
    );
  }

  const session = summary.session;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#030913]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_28%),radial-gradient(circle_at_50%_55%,rgba(7,17,31,0.82),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,19,0.25)_0%,rgba(3,9,19,0.72)_52%,rgba(3,9,19,0.95)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/racepod")}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to RacePod
        </button>

        <section className="overflow-hidden rounded-[34px] border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.10)_0%,rgba(7,17,31,0.92)_48%,rgba(255,107,53,0.08)_100%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
            RacePod Replay
          </div>

          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black uppercase italic tracking-[0.04em] text-white sm:text-5xl">
                {session.title || session.name || "RacePod Session"}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Status:{" "}
                  <span className="font-bold text-white">{session.status}</span>
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Started:{" "}
                  <span className="font-bold text-white">
                    {formatDate(session.startedAt)}
                  </span>
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Visibility:{" "}
                  <span className="font-bold text-white">
                    {session.visibility || "private"}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {String(session.visibility || "private").toLowerCase() ===
                "public" ||
              String(session.visibility || "private").toLowerCase() ===
                "unlisted" ? (
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
                >
                  <Share2 className="h-4 w-4" />
                  Copy Link
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublishSession}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#FFB199] transition hover:bg-[#FF6B35] hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                  Publish Replay
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Duration"
            value={formatDuration(summary.durationSeconds)}
            helper="Session time"
            icon={<Timer className="h-5 w-5" />}
          />

          <StatCard
            label="Distance"
            value={`${summary.distanceMiles} mi`}
            helper="Estimated GPS route"
            icon={<Route className="h-5 w-5" />}
          />

          <StatCard
            label="Max Speed"
            value={`${summary.maxSpeedMph} mph`}
            helper="Top recorded speed"
            icon={<Gauge className="h-5 w-5" />}
          />

          <StatCard
            label="Avg Speed"
            value={`${summary.avgSpeedMph} mph`}
            helper={`${summary.pointCount} data point${
              summary.pointCount === 1 ? "" : "s"
            }`}
            icon={<Activity className="h-5 w-5" />}
          />
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
          <MiniRoutePreview points={routePoints} />

          <div className="rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
              Latest Point
            </div>

            <h2 className="mt-2 text-2xl font-black text-white">
              Telemetry Snapshot
            </h2>

            <div className="mt-5 space-y-3 text-sm text-white/55">
              <div className="flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-cyan-200" />
                Lat/Lng:{" "}
                {latestPoint
                  ? `${latestPoint.latitude}, ${latestPoint.longitude}`
                  : "—"}
              </div>

              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-200" />
                Speed: {valueOrDash(latestPoint?.speedMph, " mph")}
              </div>

              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-200" />
                Heading: {valueOrDash(latestPoint?.heading)}
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-200" />
                Elevation: {valueOrDash(latestPoint?.elevationFt, " ft")}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="mb-5">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
              Speed Series
            </div>
            <h2 className="mt-2 text-2xl font-black text-white">
              Session Timeline
            </h2>
          </div>

          {summary.speedSeries.length ? (
            <div className="space-y-3">
              {summary.speedSeries.slice(0, 30).map((point, index) => (
                <div
                  key={point.pointId}
                  className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/55 sm:grid-cols-[70px_1fr_auto]"
                >
                  <div className="font-mono text-cyan-200">
                    #{String(index + 1).padStart(2, "0")}
                  </div>

                  <div>
                    <div className="font-bold text-white">
                      {formatDate(point.timestamp)}
                    </div>
                    <div className="mt-1 font-mono text-xs text-white/35">
                      {point.latitude}, {point.longitude}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-white">
                      {point.speedMph} mph
                    </div>
                    <div className="text-xs text-white/35">
                      Heading {valueOrDash(point.heading)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/45">
              No speed data available for this session yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
