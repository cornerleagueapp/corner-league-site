import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Gauge,
  MapPinned,
  Radio,
  Route,
  Search,
  Share2,
  Sparkles,
  Timer,
  Trophy,
  UserCircle2,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

type PublishedRacePodSession = {
  id?: string;
  sessionId?: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  status?: string | null;
  visibility?: string | null;
  publishedAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;

  pointCount?: number | null;
  durationSeconds?: number | null;
  distanceMiles?: number | null;
  maxSpeedMph?: number | null;
  avgSpeedMph?: number | null;

  user?: {
    id?: string | null;
    name?: string | null;
    username?: string | null;
    displayName?: string | null;
    profileImageUrl?: string | null;
    avatarUrl?: string | null;
  } | null;

  athlete?: {
    id?: string | null;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    profileImageUrl?: string | null;
    imageUrl?: string | null;
    isClaimed?: boolean | null;
    claimedByUser?: string | null;
  } | null;

  claimedAthleteProfiles?: Array<{
    id?: string | null;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    profileImageUrl?: string | null;
    imageUrl?: string | null;
  }>;

  athleteProfiles?: Array<{
    id?: string | null;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    profileImageUrl?: string | null;
    imageUrl?: string | null;
  }>;

  speedSeries?: Array<{
    pointId?: string;
    timestamp?: string;
    speedMph?: number | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    heading?: number | null;
    elevationFt?: number | null;
  }>;

  routePreviewPoints?: Array<{
    latitude?: number | string | null;
    longitude?: number | string | null;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds?: number | null) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function numberOrDash(value?: number | null, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return `${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}${suffix}`;
}

function getSessionId(session: PublishedRacePodSession) {
  return String(session.sessionId || session.id || "");
}

function getSessionTitle(session: PublishedRacePodSession) {
  return session.title || session.name || "RacePod Session";
}

function getUserName(session: PublishedRacePodSession) {
  const user = session.user;

  return (
    user?.displayName || user?.name || user?.username || "Corner League Racer"
  );
}

function getAthleteName(athlete?: PublishedRacePodSession["athlete"] | null) {
  if (!athlete) return "";

  const fullName = [athlete.firstName, athlete.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return athlete.name || fullName || athlete.nickname || "";
}

function getClaimedAthletes(session: PublishedRacePodSession) {
  const athletes =
    session.claimedAthleteProfiles ||
    session.athleteProfiles ||
    (session.athlete ? [session.athlete] : []);

  return athletes.filter((athlete) => getAthleteName(athlete));
}

function getRoutePoints(session: PublishedRacePodSession) {
  const rawPoints =
    session.routePreviewPoints ||
    session.speedSeries?.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    })) ||
    [];

  return rawPoints
    .map((point) => ({
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
    );
}

function MiniRouteMap({
  points,
}: {
  points: Array<{ latitude: number; longitude: number }>;
}) {
  const path = useMemo(() => {
    if (points.length < 2) return "";

    const lats = points.map((point) => point.latitude);
    const lngs = points.map((point) => point.longitude);

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
    <div className="relative h-[220px] overflow-hidden rounded-[24px] border border-cyan-300/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.10),transparent_35%),linear-gradient(135deg,rgba(7,17,31,0.96),rgba(3,9,19,0.98))]">
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:32px_32px]" />

      {path ? (
        <svg
          viewBox="0 0 600 300"
          className="absolute inset-0 h-full w-full p-3"
          role="img"
          aria-label="RacePod route preview"
        >
          <path
            d={path}
            fill="none"
            stroke="rgba(124,244,255,0.95)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            stroke="rgba(255,107,53,0.70)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div className="relative z-10 grid h-full place-items-center text-center">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
              <Route className="h-5 w-5 text-cyan-100" />
            </div>
            <div className="mt-3 text-sm font-bold text-white">
              Route Preview
            </div>
            <div className="mt-1 text-xs text-white/40">
              GPS path unavailable
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PublishedSessionCard({
  session,
}: {
  session: PublishedRacePodSession;
}) {
  const [, navigate] = useLocation();

  const sessionId = getSessionId(session);
  const routePoints = getRoutePoints(session);
  const claimedAthletes = getClaimedAthletes(session);
  const primaryAthlete = claimedAthletes[0];

  const athleteName = getAthleteName(primaryAthlete);
  const athleteImage =
    primaryAthlete?.profileImageUrl ||
    primaryAthlete?.imageUrl ||
    session.user?.profileImageUrl ||
    session.user?.avatarUrl ||
    "";

  return (
    <button
      type="button"
      onClick={() => navigate(`/racepod/sessions/${sessionId}`)}
      className="group min-w-0 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-4 text-left shadow-[0_24px_70px_rgba(0,0,0,0.26)] transition hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-cyan-300/[0.045] sm:p-5"
    >
      <MiniRouteMap points={routePoints} />

      <div className="mt-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
            <Radio className="h-3.5 w-3.5" />
            Published Replay
          </span>

          {session.publishedAt ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              {formatDate(session.publishedAt)}
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-xl font-black uppercase leading-tight tracking-[-0.02em] text-white">
          {getSessionTitle(session)}
        </h3>

        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-cyan-300/15 bg-cyan-300/10">
            {athleteImage ? (
              <img
                src={athleteImage}
                alt={athleteName || getUserName(session)}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle2 className="h-6 w-6 text-cyan-100" />
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white">
              {athleteName || getUserName(session)}
            </div>

            <div className="truncate text-xs text-white/40">
              {athleteName
                ? `Claimed athlete profile • ${getUserName(session)}`
                : "Corner League user"}
            </div>
          </div>
        </div>

        {claimedAthletes.length > 1 ? (
          <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] px-3 py-2 text-xs text-cyan-100/75">
            +{claimedAthletes.length - 1} more claimed athlete profile
            {claimedAthletes.length - 1 === 1 ? "" : "s"}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
              Distance
            </div>
            <div className="mt-1 text-lg font-black text-white">
              {numberOrDash(session.distanceMiles, " mi")}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
              Max Speed
            </div>
            <div className="mt-1 text-lg font-black text-white">
              {numberOrDash(session.maxSpeedMph, " mph")}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
              Avg Speed
            </div>
            <div className="mt-1 text-lg font-black text-white">
              {numberOrDash(session.avgSpeedMph, " mph")}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
              Duration
            </div>
            <div className="mt-1 text-lg font-black text-white">
              {formatDuration(session.durationSeconds)}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-xs text-white/40">
            {session.pointCount ?? 0} GPS points
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
            View Replay
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function RacePodPublishedSessionsPage() {
  const [, navigate] = useLocation();

  const [sessions, setSessions] = useState<PublishedRacePodSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadPublishedSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(
        "/telemetry/public/sessions?limit=48&sport=aqua",
        {
          method: "GET",
          noRefresh: true,
          skipAuth: true,
        } as any,
      );

      if (!res.ok) {
        if (res.status === 404) {
          setSessions([]);
          return;
        }

        const json = await res.json().catch(() => ({}));
        throw new Error(
          json?.message || "Failed to load published RacePod sessions.",
        );
      }

      const json = await res.json().catch(() => ({}));

      const items =
        json?.data?.sessions ||
        json?.data?.items ||
        json?.sessions ||
        json?.items ||
        json?.data ||
        [];

      setSessions(Array.isArray(items) ? items : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load published RacePod sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return sessions;

    return sessions.filter((session) => {
      const athletes = getClaimedAthletes(session)
        .map((athlete) => getAthleteName(athlete))
        .join(" ");

      return [
        getSessionTitle(session),
        getUserName(session),
        athletes,
        session.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value);
    });
  }, [query, sessions]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#030913]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.10),transparent_28%),radial-gradient(circle_at_50%_55%,rgba(7,17,31,0.82),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,19,0.20)_0%,rgba(3,9,19,0.76)_52%,rgba(3,9,19,0.98)_100%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/scores/aqua")}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Aqua Hub
        </button>

        <section className="overflow-hidden rounded-[38px] border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12)_0%,rgba(7,17,31,0.94)_48%,rgba(255,107,53,0.10)_100%)] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.46)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Public RacePod Replays
              </div>

              <h1 className="mt-6 max-w-4xl bg-[linear-gradient(90deg,#FFFFFF_0%,#7CF4FF_50%,#FF7849_100%)] bg-clip-text text-4xl font-black uppercase italic tracking-[0.04em] text-transparent sm:text-6xl lg:text-7xl">
                Shared AQUA Sessions
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                Explore published RacePod sessions from the Aqua community. View
                route replays, speed data, claimed athlete profiles, and
                shareable activity cards.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/55">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Published sessions:{" "}
                  <span className="font-bold text-white">
                    {sessions.length}
                  </span>
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Sport: <span className="font-bold text-white">Aqua</span>
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Replay links
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-cyan-300/10 bg-black/25 p-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                Search Replays
              </div>

              <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                <Search className="h-4 w-4 text-white/35" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search racer, user, session..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-8 text-center text-white/55 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              Loading published RacePod sessions…
            </div>
          ) : error ? (
            <div className="rounded-[30px] border border-red-400/20 bg-red-500/10 p-8 text-red-100">
              <div className="font-black">Could not load RacePod sessions</div>
              <div className="mt-2 text-sm text-red-100/75">{error}</div>
            </div>
          ) : filteredSessions.length ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredSessions.map((session) => (
                <PublishedSessionCard
                  key={getSessionId(session)}
                  session={session}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
                <Radio className="h-6 w-6 text-cyan-100" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-white">
                No published RacePod sessions yet
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/50">
                Once racers publish their RacePod sessions, they will appear
                here for fans, clubs, sponsors, and other racers to view.
              </p>

              <button
                type="button"
                onClick={() => navigate("/racepod")}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200"
              >
                Open RacePod Dashboard
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
