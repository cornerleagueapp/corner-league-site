import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useLocation, useParams } from "wouter";
import {
  Activity,
  ArrowLeft,
  Download,
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

function isPublicSession(visibility?: string | null) {
  const value = String(visibility || "private").toLowerCase();
  return value === "public" || value === "unlisted";
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
    <div className="relative overflow-hidden rounded-[24px] border border-cl-accent/10 bg-cl-surface p-5 shadow-cl-panel">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cl-accent/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black text-cl-ink">{value}</div>
          {helper ? (
            <div className="mt-1 text-sm text-cl-muted">{helper}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent">
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
    <div className="relative min-h-[320px] overflow-hidden rounded-[30px] border border-cl-accent/10 cl-panel-wash p-5">
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
            Route Preview
          </div>
          <div className="mt-1 text-sm text-cl-muted">
            {points.length} GPS point{points.length === 1 ? "" : "s"}
          </div>
        </div>

        <MapPinned className="h-5 w-5 text-cl-accent" />
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
            stroke="rgb(var(--cl-accent))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            stroke="rgb(var(--cl-muted) / 0.65)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div className="relative z-10 grid min-h-[230px] place-items-center rounded-2xl border border-cl-border bg-cl-surface text-center">
          <div>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-cl-accent/20 bg-cl-accent/10">
              <Route className="h-5 w-5 text-cl-accent" />
            </div>
            <div className="text-sm font-bold text-cl-ink">
              Route needs more points
            </div>
            <div className="mt-1 text-sm text-cl-muted">
              Record at least 2 GPS points to draw the replay path.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RacePodShareCard({
  summary,
  routePoints,
  shareUrl,
}: {
  summary: SessionSummary;
  routePoints: Array<{ latitude: number; longitude: number }>;
  shareUrl: string;
}) {
  const session = summary.session;

  const path = useMemo(() => {
    if (routePoints.length < 2) return "";

    const lats = routePoints.map((p) => p.latitude);
    const lngs = routePoints.map((p) => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.000001;
    const lngRange = maxLng - minLng || 0.000001;

    return routePoints
      .map((point, index) => {
        const x = 48 + ((point.longitude - minLng) / lngRange) * 984;
        const y = 660 - ((point.latitude - minLat) / latRange) * 430;

        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [routePoints]);

  return (
    <div className="cl-dark w-[1080px] overflow-hidden rounded-[44px] border border-cl-accent/20 bg-cl-canvas text-cl-ink shadow-cl-panel">
      <div className="relative min-h-[1350px] overflow-hidden p-16">
        <div className="pointer-events-none absolute inset-0 cl-panel-wash" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-8">
            <div>
              <div className="inline-flex rounded-full border border-cl-accent/25 bg-cl-accent/10 px-5 py-2 text-[18px] font-black uppercase tracking-[0.22em] text-cl-accent">
                Corner League RacePod
              </div>

              <h2 className="mt-8 max-w-[760px] text-[64px] font-black uppercase italic leading-[0.95] tracking-[0.02em] text-cl-ink">
                {session.title || session.name || "RacePod Session"}
              </h2>

              <div className="mt-5 text-[24px] font-bold text-cl-muted">
                {formatDate(session.startedAt)}
              </div>
            </div>

            <div className="grid h-28 w-28 place-items-center rounded-[32px] border border-cl-accent/20 bg-cl-accent/10">
              <Route className="h-14 w-14 text-cl-accent" />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-5">
            <div className="rounded-[28px] border border-cl-border bg-cl-subtle p-6">
              <div className="text-[16px] font-black uppercase tracking-[0.18em] text-cl-accent">
                Distance
              </div>
              <div className="mt-3 text-[54px] font-black text-cl-ink">
                {summary.distanceMiles}
                <span className="ml-2 text-[24px] text-cl-muted">mi</span>
              </div>
            </div>

            <div className="rounded-[28px] border border-cl-border bg-cl-subtle p-6">
              <div className="text-[16px] font-black uppercase tracking-[0.18em] text-cl-accent">
                Max Speed
              </div>
              <div className="mt-3 text-[54px] font-black text-cl-ink">
                {summary.maxSpeedMph}
                <span className="ml-2 text-[24px] text-cl-muted">mph</span>
              </div>
            </div>

            <div className="rounded-[28px] border border-cl-border bg-cl-subtle p-6">
              <div className="text-[16px] font-black uppercase tracking-[0.18em] text-cl-accent">
                Avg Speed
              </div>
              <div className="mt-3 text-[54px] font-black text-cl-ink">
                {summary.avgSpeedMph}
                <span className="ml-2 text-[24px] text-cl-muted">mph</span>
              </div>
            </div>

            <div className="rounded-[28px] border border-cl-border bg-cl-subtle p-6">
              <div className="text-[16px] font-black uppercase tracking-[0.18em] text-cl-accent">
                Duration
              </div>
              <div className="mt-3 text-[54px] font-black text-cl-ink">
                {formatDuration(summary.durationSeconds)}
              </div>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-[36px] border border-cl-accent/[0.15] cl-panel-wash p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-[16px] font-black uppercase tracking-[0.22em] text-cl-accent">
                  Route Replay
                </div>
                <div className="mt-2 text-[20px] text-cl-muted">
                  {summary.pointCount} telemetry points recorded
                </div>
              </div>

              <MapPinned className="h-9 w-9 text-cl-accent" />
            </div>

            {path ? (
              <svg
                viewBox="0 0 1080 720"
                className="h-[520px] w-full"
                role="img"
                aria-label="RacePod route share preview"
              >
                <path
                  d={path}
                  fill="none"
                  stroke="rgb(var(--cl-accent))"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={path}
                  fill="none"
                  stroke="rgb(var(--cl-muted) / 0.7)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <div className="grid h-[520px] place-items-center rounded-[28px] border border-cl-border bg-cl-surface text-center">
                <div>
                  <Route className="mx-auto h-16 w-16 text-cl-accent" />
                  <div className="mt-5 text-[28px] font-black text-cl-ink">
                    Route Preview Pending
                  </div>
                  <div className="mt-2 text-[20px] text-cl-muted">
                    More GPS points are needed to draw this replay.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex items-end justify-between gap-8">
            <div>
              <div className="text-[24px] font-black uppercase italic text-cl-ink">
                Race your data.
              </div>
              <div className="mt-2 text-[20px] text-cl-muted">
                cornerleague.com
              </div>
            </div>

            <div className="max-w-[420px] text-right text-[18px] leading-7 text-cl-muted">
              {shareUrl}
            </div>
          </div>
        </div>
      </div>
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

  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [shareCardLoading, setShareCardLoading] = useState(false);

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

  const sessionIsPublic = isPublicSession(summary?.session?.visibility);

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

  const handleDownloadShareCard = async () => {
    if (!shareCardRef.current || !summary) return;

    try {
      setShareCardLoading(true);

      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#030913",
      });

      const safeName = String(
        summary.session.title || summary.session.name || "racepod-session",
      )
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const link = document.createElement("a");
      link.download = `${safeName || "racepod-session"}-share-card.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Share card downloaded",
        description: "Your RacePod activity card is ready to post.",
      });
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e?.message || "Could not create the RacePod share card.",
        variant: "destructive",
      });
    } finally {
      setShareCardLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-cl-canvas text-cl-ink">
        <div className="pointer-events-none absolute inset-0 cl-panel-wash" />
        <div className="relative rounded-[28px] border border-cl-accent/10 bg-cl-surface px-8 py-7 text-center shadow-cl-panel">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full border border-cl-accent/25 bg-cl-accent/10" />
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cl-accent">
            Loading Replay
          </div>
          <div className="mt-2 text-sm text-cl-muted">
            Building RacePod session analytics…
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="relative min-h-screen bg-cl-canvas px-4 py-8 text-cl-ink">
        <button
          type="button"
          onClick={() => navigate("/racepod")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-cl-border bg-cl-subtle px-4 py-2 text-sm text-cl-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to RacePod
        </button>

        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-cl-danger">
          {error || "RacePod session not found."}
        </div>
      </div>
    );
  }

  const session = summary.session;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cl-canvas text-cl-ink">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cl-canvas" />
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 cl-panel-wash" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/racepod")}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-cl-accent/[0.15] bg-cl-accent/10 px-4 py-2 text-sm font-bold text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to RacePod
        </button>

        <section className="overflow-hidden rounded-[34px] border border-cl-accent/10 cl-panel-wash p-6 shadow-cl-panel sm:p-8">
          <div className="inline-flex items-center rounded-full border border-cl-accent/25 bg-cl-accent/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
            RacePod Replay
          </div>

          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black uppercase italic tracking-[0.04em] text-cl-ink sm:text-5xl">
                {session.title || session.name || "RacePod Session"}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-cl-muted">
                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Status:{" "}
                  <span className="font-bold text-cl-ink">
                    {session.status}
                  </span>
                </span>

                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Started:{" "}
                  <span className="font-bold text-cl-ink">
                    {formatDate(session.startedAt)}
                  </span>
                </span>

                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Visibility:{" "}
                  <span className="font-bold text-cl-ink">
                    {session.visibility || "private"}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {sessionIsPublic ? (
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cl-accent/20 bg-cl-accent/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
                >
                  <Share2 className="h-4 w-4" />
                  Copy Link
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublishSession}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cl-accent/25 bg-cl-accent/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
                >
                  <Share2 className="h-4 w-4" />
                  Publish Replay
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadShareCard}
                disabled={shareCardLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cl-border bg-cl-subtle px-5 text-sm font-black uppercase tracking-[0.14em] text-cl-muted transition hover:bg-cl-subtle disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {shareCardLoading ? "Creating..." : "Save Card"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                Public Activity
              </div>

              <h2 className="mt-2 text-2xl font-black text-cl-ink">
                {sessionIsPublic
                  ? "Published RacePod Replay"
                  : "Private RacePod Replay"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-cl-muted">
                {sessionIsPublic
                  ? "This session is live as a public activity. Share the link or save the card for Instagram, sponsors, or your racer profile."
                  : "Publish this replay when you are ready to make it visible as a public RacePod activity."}
              </p>
            </div>

            <div className="rounded-2xl border border-cl-border bg-cl-surface p-4 lg:w-[420px]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-muted">
                Share Link
              </div>

              <div className="mt-2 truncate font-mono text-xs text-cl-muted">
                {sessionIsPublic
                  ? publicShareUrl
                  : "Publish this replay to unlock the public link"}
              </div>

              <div className="mt-4 flex gap-2">
                {sessionIsPublic ? (
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-cl-accent px-4 text-xs font-black uppercase tracking-[0.12em] text-cl-contrast transition hover:bg-cl-accent"
                  >
                    <Share2 className="h-4 w-4" />
                    Copy
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublishSession}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-cl-accent px-4 text-xs font-black uppercase tracking-[0.12em] text-cl-contrast transition hover:bg-cl-accent"
                  >
                    <Share2 className="h-4 w-4" />
                    Publish
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadShareCard}
                  disabled={shareCardLoading}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl border border-cl-border bg-cl-subtle px-4 text-xs font-black uppercase tracking-[0.12em] text-cl-muted transition hover:bg-cl-subtle disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  Card
                </button>
              </div>
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

          <div className="rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
              Latest Point
            </div>

            <h2 className="mt-2 text-2xl font-black text-cl-ink">
              Telemetry Snapshot
            </h2>

            <div className="mt-5 space-y-3 text-sm text-cl-muted">
              <div className="flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-cl-accent" />
                Lat/Lng:{" "}
                {latestPoint
                  ? `${latestPoint.latitude}, ${latestPoint.longitude}`
                  : "—"}
              </div>

              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cl-accent" />
                Speed: {valueOrDash(latestPoint?.speedMph, " mph")}
              </div>

              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-cl-accent" />
                Heading: {valueOrDash(latestPoint?.heading)}
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cl-accent" />
                Elevation: {valueOrDash(latestPoint?.elevationFt, " ft")}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel">
          <div className="mb-5">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
              Speed Series
            </div>
            <h2 className="mt-2 text-2xl font-black text-cl-ink">
              Session Timeline
            </h2>
          </div>

          {summary.speedSeries.length ? (
            <div className="space-y-3">
              {summary.speedSeries.slice(0, 30).map((point, index) => (
                <div
                  key={point.pointId}
                  className="grid gap-3 rounded-2xl border border-cl-border bg-cl-subtle p-4 text-sm text-cl-muted sm:grid-cols-[70px_1fr_auto]"
                >
                  <div className="font-mono text-cl-accent">
                    #{String(index + 1).padStart(2, "0")}
                  </div>

                  <div>
                    <div className="font-bold text-cl-ink">
                      {formatDate(point.timestamp)}
                    </div>
                    <div className="mt-1 font-mono text-xs text-cl-muted">
                      {point.latitude}, {point.longitude}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-cl-ink">
                      {point.speedMph} mph
                    </div>
                    <div className="text-xs text-cl-muted">
                      Heading {valueOrDash(point.heading)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-cl-border bg-cl-subtle p-8 text-center text-cl-muted">
              No speed data available for this session yet.
            </div>
          )}
        </section>

        <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-100">
          <div ref={shareCardRef}>
            <RacePodShareCard
              summary={summary}
              routePoints={routePoints}
              shareUrl={publicShareUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
