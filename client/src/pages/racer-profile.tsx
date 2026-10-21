import AthletePerformanceCenter from "@/components/athlete-performance/AthletePerformanceCenter";
import { PUBLIC_RACEPOD_ENABLED } from "@/lib/publicFeatures";
import SportAthletePublic from "./sport-athlete-public";
import { isAthleteSport } from "@/lib/sportRegistration";
import { useSearch } from "wouter";
import OrganizationPhotoGallery from "@/components/OrganizationPhotoGallery";
import React, { useEffect, useState } from "react";
import { PageSEO } from "@/seo/usePageSEO";
import { apiRequest } from "@/lib/apiClient";
import { getAccessToken } from "@/lib/token";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X as XIcon,
  Search as SearchIcon,
  Sparkles,
  Image as ImageIcon,
  Play,
  ExternalLink,
  Globe2,
  Music2,
  Instagram,
  Youtube,
  Radio,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import SocialPostFeed from "@/components/community/SocialPosts";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import {
  getRacerProfileViewCount,
  trackRacerProfileViewToBackend,
} from "@/lib/profileViewApi";
import {
  calculateAge,
  ClaimAthleteModal,
  createAthleteSponsor,
  EditRacerModal,
  EditWorldFinalsModal,
  fetchAthleteGallery,
  fetchAthleteSponsors,
  getGalleryThumb,
  getSponsorLogo,
  getSponsorWebsite,
  humanizeValidationError,
  inchesToMeters,
  isProbablyId,
  logRequestError,
  mapAthlete,
  mapDetail,
  MiniStat,
  PercentStatBox,
  pollUploadProgress,
  PremiumRacerHero,
  RacerGalleryView,
  RacerRatingHero,
  slugify,
  StatBox,
  toDateInputValue,
  toNumOrUndefined,
  updateAthleteSocialLinks,
  uploadAthleteGalleryMedia,
  uploadAthleteHeaderImage,
  uploadAthleteImage,
} from "./racer-profile-parts";
import type {
  AthleteHistoryItem,
  Racer,
  RacerGalleryItem,
  RacerRatingCard,
  RacerSponsor,
} from "./racer-profile-parts";
import RacerProfileShareModal from "./racer-profile-parts/RacerProfileShareModal";

type RacerRacePodSession = {
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
};

function getRacePodSessionId(session: RacerRacePodSession) {
  return String(session.sessionId || session.id || "");
}

function getRacePodSessionTitle(session: RacerRacePodSession) {
  return session.title || session.name || "RacePod Replay";
}

function formatRacePodDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRacePodDuration(seconds?: number | null) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function formatRacePodNumber(value?: number | null, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return `${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}${suffix}`;
}

function RacePodReplayStatCard({
  loading,
  count,
  latestSession,
  onClick,
}: {
  loading: boolean;
  count: number;
  latestSession?: RacerRacePodSession | null;
  onClick: () => void;
}) {
  return (
    <Card className="overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface p-5 shadow-cl-panel">
      <button
        type="button"
        onClick={onClick}
        disabled={loading || count === 0}
        className="group w-full text-left disabled:cursor-not-allowed disabled:opacity-70"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cl-accent">
            <Radio className="h-4 w-4" />
            RacePod Replays
          </div>

          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cl-accent/15 bg-cl-accent/10 text-cl-accent transition group-hover:bg-cl-accent group-hover:text-cl-contrast">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-cl-muted">Loading RacePod sessions…</p>
        ) : count === 0 ? (
          <div>
            <div className="text-3xl font-black text-cl-ink">0</div>
            <p className="mt-2 text-sm leading-6 text-cl-muted">
              No published RacePod replay sessions yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Published Replays" value={count} />

              <div className="rounded-[20px] border border-cl-border bg-cl-subtle p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-cl-muted">
                  Top Speed
                </div>

                <div className="mt-1 text-lg font-black text-cl-ink">
                  {latestSession?.maxSpeedMph
                    ? `${latestSession.maxSpeedMph} mph`
                    : "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-cl-border bg-cl-subtle p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cl-muted">
                Latest Replay
              </div>

              <div className="mt-1 truncate text-sm font-semibold text-cl-ink">
                {latestSession
                  ? getRacePodSessionTitle(latestSession)
                  : "RacePod Replay"}
              </div>

              <div className="mt-1 text-xs text-cl-muted">
                {latestSession
                  ? formatRacePodDate(
                      latestSession.publishedAt || latestSession.startedAt,
                    )
                  : "Tap to view sessions"}
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cl-accent">
              View replay sessions
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </>
        )}
      </button>
    </Card>
  );
}

function RacePodSessionsModal({
  open,
  racerName,
  sessions,
  loading,
  onClose,
  onOpenSession,
}: {
  open: boolean;
  racerName: string;
  sessions: RacerRacePodSession[];
  loading: boolean;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
}) {
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous || "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close RacePod replay sessions"
        className="cl-dark absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface shadow-cl-panel">
        <div className="border-b border-cl-border cl-panel-wash px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cl-accent/15 bg-cl-accent/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
                <Radio className="h-3.5 w-3.5" />
                RacePod Replays
              </div>

              <h2 className="text-2xl font-black text-cl-ink">
                {racerName} RacePod Sessions
              </h2>

              <p className="mt-1 text-sm text-cl-muted">
                Scroll and select a published replay to view the full session.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cl-border bg-cl-subtle text-cl-ink hover:bg-cl-subtle"
              aria-label="Close RacePod sessions modal"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="rounded-2xl border border-cl-border bg-cl-subtle p-6 text-cl-muted">
              Loading RacePod replay sessions…
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-cl-border bg-cl-subtle p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-cl-accent/20 bg-cl-accent/10">
                <Radio className="h-5 w-5 text-cl-accent" />
              </div>

              <div className="mt-4 text-lg font-black text-cl-ink">
                No published replays yet
              </div>

              <p className="mt-2 text-sm leading-6 text-cl-muted">
                When this racer publishes RacePod sessions, they will show here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const sessionId = getRacePodSessionId(session);

                return (
                  <button
                    key={sessionId}
                    type="button"
                    onClick={() => onOpenSession(sessionId)}
                    className="group w-full rounded-[24px] border border-cl-border bg-cl-subtle p-4 text-left transition hover:border-cl-accent/25 hover:bg-cl-accent/[0.055]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cl-accent">
                            Published Replay
                          </span>

                          <span className="text-xs text-cl-muted">
                            {formatRacePodDate(
                              session.publishedAt || session.startedAt,
                            )}
                          </span>
                        </div>

                        <div className="mt-3 truncate text-lg font-black text-cl-ink">
                          {getRacePodSessionTitle(session)}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-cl-muted">
                              Distance
                            </div>
                            <div className="mt-1 text-sm font-black text-cl-ink">
                              {formatRacePodNumber(
                                session.distanceMiles,
                                " mi",
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-cl-muted">
                              Max Speed
                            </div>
                            <div className="mt-1 text-sm font-black text-cl-ink">
                              {formatRacePodNumber(session.maxSpeedMph, " mph")}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-cl-muted">
                              Duration
                            </div>
                            <div className="mt-1 text-sm font-black text-cl-ink">
                              {formatRacePodDuration(session.durationSeconds)}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-cl-muted">
                              Points
                            </div>
                            <div className="mt-1 text-sm font-black text-cl-ink">
                              {session.pointCount ?? 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cl-accent/15 bg-cl-accent/10 text-cl-accent transition group-hover:bg-cl-accent group-hover:text-cl-contrast">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RacerProfilePage(props: { idOrSlugParam?: string }) {
  const sport = new URLSearchParams(useSearch()).get("sport") ?? "";
  return isAthleteSport(sport) && props.idOrSlugParam ? (
    <SportAthletePublic id={props.idOrSlugParam} sportKey={sport} />
  ) : (
    <JetSkiRacerProfilePage {...props} />
  );
}
function JetSkiRacerProfilePage({ idOrSlugParam }: { idOrSlugParam?: string }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const currentUserId = isAuthenticated && user?.id ? String(user.id) : null;

  const [racer, setRacer] = useState<Racer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [worldFinalsOpen, setWorldFinalsOpen] = useState(false);

  const [history, setHistory] = useState<AthleteHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyReload, setHistoryReload] = useState(0);

  const [ratingCard, setRatingCard] = useState<RacerRatingCard | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const [profileViewCount, setProfileViewCount] = useState<number | null>(null);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<RacerGalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryReload, setGalleryReload] = useState(0);

  const [sponsors, setSponsors] = useState<RacerSponsor[]>([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [racePodSessionsOpen, setRacePodSessionsOpen] = useState(false);
  const [racePodSessions, setRacePodSessions] = useState<RacerRacePodSession[]>(
    [],
  );
  const [racePodSessionsLoading, setRacePodSessionsLoading] = useState(false);

  const [claimStatus, setClaimStatus] = useState<{
    hasClaim: boolean;
    status?: "pending" | "approved" | "rejected";
    claimId?: string;
  } | null>(null);

  function getFirstNameFromFullName(name?: string | null) {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    return parts[0] ?? "";
  }

  function getLastNameFromFullName(name?: string | null) {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    return parts.slice(1).join(" ");
  }

  function buildFullName(firstName?: string, lastName?: string) {
    return [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  }

  useEffect(() => {
    let cancelled = false;

    async function getJSON<T = any>(
      method: "GET" | "PUT",
      path: string,
      body?: any,
    ): Promise<T> {
      return apiRequest<T>(method, path, body);
    }

    async function fetchDetailById(id: string) {
      const res = await getJSON<any>(
        "GET",
        `/jet-ski-racer-details/${encodeURIComponent(id)}`,
      );
      const rec =
        res?.racer ?? res?.data?.racer ?? res?.data ?? res?.item ?? res;
      if (!rec) throw new Error("not_found");
      return mapDetail(rec);
    }

    async function searchDetailsByName(name: string) {
      try {
        const q = new URLSearchParams();
        q.set("search", name);
        q.set("limit", "25");
        q.set("order", "DESC");
        const res = await getJSON<any>(
          "GET",
          `/jet-ski-racer-details?${q.toString()}`,
        );
        const arr =
          res?.racers ??
          res?.data?.racers ??
          res?.items ??
          res?.data?.items ??
          (Array.isArray(res) ? res : []);
        const lc = name.toLowerCase();
        const slug = slugify(name);
        const best =
          arr.find(
            (r: any) =>
              String(r?.athlete?.name ?? r?.name ?? "")
                .trim()
                .toLowerCase() === lc,
          ) ||
          arr.find(
            (r: any) =>
              slugify(String(r?.athlete?.name ?? r?.name ?? "")) === slug,
          ) ||
          arr[0];
        if (best) return mapDetail(best);
      } catch {}
      return null;
    }

    async function scanDetailsBySlug(slug: string) {
      const LIMIT = 50;
      const MAX_PAGES = 10;
      for (let page = 0; page < MAX_PAGES; page++) {
        const p = new URLSearchParams();
        p.set("skip", String(page * LIMIT));
        p.set("limit", String(LIMIT));
        p.set("order", "DESC");
        const res = await getJSON<any>("GET", `/jet-ski-racer-details?${p}`);
        const arr =
          res?.racers ??
          res?.data?.racers ??
          res?.items ??
          res?.data?.items ??
          (Array.isArray(res) ? res : []);
        const hit =
          arr.find(
            (r: any) =>
              slugify(String(r?.athlete?.name ?? r?.name ?? "")) === slug,
          ) ||
          arr.find(
            (r: any) =>
              String(r?.athlete?.name ?? r?.name ?? "")
                .trim()
                .toLowerCase() === slug.replace(/-/g, " "),
          );
        if (hit) return mapDetail(hit);
        if (arr.length < LIMIT) break;
      }
      return null;
    }

    async function fetchAthleteById(aid: string) {
      const res = await getJSON<any>(
        "GET",
        `/athletes/${encodeURIComponent(aid)}`,
      );
      const a =
        res?.athlete ?? res?.data?.athlete ?? res?.data ?? res?.item ?? res;
      if (!a) throw new Error("not_found");
      return mapAthlete(a);
    }

    async function searchAthletesByName(name: string) {
      try {
        const q = new URLSearchParams();
        q.set("search", name);
        q.set("limit", "10");
        q.set("order", "DESC");
        const res = await getJSON<any>("GET", `/athletes?${q.toString()}`);
        const arr =
          res?.athletes ??
          res?.data?.athletes ??
          res?.items ??
          (Array.isArray(res) ? res : []);
        if (!Array.isArray(arr) || !arr.length) return null;
        const lc = name.toLowerCase();
        const best =
          arr.find(
            (a: any) =>
              String(a?.name ?? "")
                .trim()
                .toLowerCase() === lc,
          ) ?? arr[0];
        return mapAthlete(best);
      } catch {
        return null;
      }
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const token = decodeURIComponent(idOrSlugParam || "").trim();
        if (!token) throw new Error("Racer not found");

        const url = new URL(window.location.href);
        const kind = url.searchParams.get("kind");

        if (kind === "athlete" && isProbablyId(token)) {
          try {
            const athlete = await fetchAthleteById(token);
            if (!cancelled) {
              setRacer(athlete);
              return;
            }
          } catch {}
        }

        if (isProbablyId(token)) {
          try {
            const detail = await fetchDetailById(token);
            if (!cancelled) {
              setRacer(detail);
              return;
            }
          } catch {}
        }

        const nameSlug = slugify(token);
        let bySearch = await searchDetailsByName(token);
        if (!bySearch) bySearch = await scanDetailsBySlug(nameSlug);

        if (bySearch) {
          if (!cancelled) setRacer(bySearch);
          return;
        }

        const athleteFallback = await searchAthletesByName(token);
        if (athleteFallback) {
          if (!cancelled) setRacer(athleteFallback);
          return;
        }

        throw new Error("Racer not found");
      } catch (e: any) {
        const msg =
          e?.message ||
          e?.data?.message ||
          e?.data?.error ||
          "Failed to load racer";
        setErr(/not found/i.test(msg) ? "Racer not found" : String(msg));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idOrSlugParam]);

  useEffect(() => {
    if (!currentUserId || !racer?.athleteId) {
      setClaimStatus(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await apiRequest<any>(
          "GET",
          `/athlete-claims/status?userId=${encodeURIComponent(
            currentUserId,
          )}&athleteId=${encodeURIComponent(String(racer.athleteId))}`,
        );

        if (!cancelled) {
          setClaimStatus({
            hasClaim: !!res?.hasClaim,
            status: res?.status,
            claimId: res?.claimId,
          });
        }
      } catch {
        if (!cancelled) {
          setClaimStatus({ hasClaim: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, racer?.athleteId]);

  useEffect(() => {
    if (!racer?.athleteId) {
      setHistory([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);

        const res = await apiRequest<any>(
          "GET",
          `/results/athlete/${encodeURIComponent(String(racer.athleteId))}/history`,
        );

        const list =
          res?.results ??
          res?.data?.results ??
          res?.data ??
          (Array.isArray(res) ? res : []);

        if (!cancelled) {
          if (!Array.isArray(list)) throw new Error("Invalid race history response.");
          setHistory(list);
        }
      } catch {
        if (!cancelled) { setHistory([]); setHistoryError("Race history couldn’t be loaded."); }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [racer?.athleteId, historyReload]);

  useEffect(() => {
    const hasSession =
      !!getAccessToken() && !!isAuthenticated && !!currentUserId;
    if (!hasSession && claimOpen) {
      setClaimOpen(false);
    }
  }, [isAuthenticated, currentUserId, claimOpen]);

  const handleClaimProfileClick = () => {
    const hasSession =
      !!getAccessToken() && !!isAuthenticated && !!currentUserId;

    if (!hasSession) {
      setClaimOpen(false);
      toast({
        title: "Please log in to claim profile",
        description: "You need an account to submit an athlete profile claim.",
      });
      return;
    }

    setClaimOpen(true);
  };

  useEffect(() => {
    if (!racer?.athleteId) {
      setRatingCard(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setRatingLoading(true);

        const res = await apiRequest<any>(
          "GET",
          `/ratings/athlete/${encodeURIComponent(String(racer.athleteId))}`,
        );

        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        if (!cancelled) {
          setRatingCard(list[0] ?? null);
        }
      } catch {
        if (!cancelled) {
          setRatingCard(null);
        }
      } finally {
        if (!cancelled) {
          setRatingLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [racer?.athleteId]);

  useEffect(() => {
    if (!racer) return;

    const racerDetailId = String(racer.id);
    const athleteId = racer.athleteId ? String(racer.athleteId) : undefined;

    trackEvent(AnalyticsEvents.RACER_PROFILE_VIEWED, {
      racer_id: String(racer.athleteId ?? racer.id),
      racer_detail_id: racerDetailId,
      racer_name: racer.racerName,
      is_claimed: !!racer.isClaimed,
      claimed_by_user_id: racer.claimedByUserId ?? null,
      claimed_by_username: racer.claimedByUsername ?? null,
      location: racer.location ?? null,
      sport: "jet_ski",
      source_page: "racer_profile",
    });

    trackRacerProfileViewToBackend({
      racerDetailId,
      athleteId,
      racerName: racer.racerName,
      viewerUserId: currentUserId,
    })
      .then((res) => {
        setProfileViewCount(Number(res.totalViews ?? 0));
      })
      .catch(() => {
        getRacerProfileViewCount(racerDetailId)
          .then((res) => setProfileViewCount(Number(res.totalViews ?? 0)))
          .catch(() => {});
      });
  }, [racer?.id, currentUserId]);

  useEffect(() => {
    if (!racer?.athleteId) {
      setGalleryItems([]);
      setGalleryError(null);
      setGalleryLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setGalleryLoading(true);
        setGalleryItems([]);
        setGalleryError(null);
        const list = await fetchAthleteGallery(String(racer.athleteId));

        if (!cancelled) {
          setGalleryItems(list);
        }
      } catch {
        if (!cancelled) {
          setGalleryItems([]);
          setGalleryError("Racer media could not load. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setGalleryLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [racer?.athleteId, galleryReload]);

  useEffect(() => {
    if (!racer?.athleteId) {
      setSponsors([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setSponsorsLoading(true);
        const list = await fetchAthleteSponsors(String(racer.athleteId));

        if (!cancelled) {
          setSponsors(list);
        }
      } catch {
        if (!cancelled) {
          setSponsors([]);
        }
      } finally {
        if (!cancelled) {
          setSponsorsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [racer?.athleteId]);

  useEffect(() => {
    if (!PUBLIC_RACEPOD_ENABLED || !racer?.athleteId) {
      setRacePodSessions([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setRacePodSessionsLoading(true);

        const res = await apiRequest<any>(
          "GET",
          `/telemetry/public/racers/${encodeURIComponent(
            String(racer.athleteId),
          )}/sessions?limit=24`,
        );

        const list =
          res?.sessions ??
          res?.data?.sessions ??
          res?.items ??
          res?.data?.items ??
          res?.data ??
          (Array.isArray(res) ? res : []);

        if (!cancelled) {
          setRacePodSessions(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) {
          setRacePodSessions([]);
        }
      } finally {
        if (!cancelled) {
          setRacePodSessionsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [racer?.athleteId]);

  if (loading || authLoading) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-cl-canvas text-cl-ink">
        <PageSEO title="Racer • Corner League" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 cl-panel-wash" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative rounded-[28px] border border-cl-accent/10 bg-cl-surface px-8 py-7 text-center shadow-cl-panel">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full border border-cl-accent/25 bg-cl-accent/10 shadow-cl-panel" />
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cl-accent">
            Loading Racer Profile
          </div>
          <div className="mt-2 text-sm text-cl-muted">
            Pulling athlete data, rankings, and race history…
          </div>
        </div>
      </div>
    );
  }

  if (err || !racer) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-cl-canvas px-4 text-cl-ink">
        <PageSEO title="Racer • Corner League" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 cl-panel-wash" />
        </div>

        <div className="relative max-w-md rounded-[30px] border border-cl-accent/10 bg-cl-surface p-7 text-center shadow-cl-panel">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
            Racer Profile
          </div>
          <div className="mt-3 text-2xl font-black uppercase text-cl-ink">
            Couldn’t load this racer
          </div>
          <div className="mt-3 text-sm leading-7 text-cl-muted">
            {err || "Not found"}
          </div>

          <Button
            onClick={() => window.history.back()}
            className="mt-6 rounded-full bg-cl-accent px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-cl-contrast hover:bg-cl-accent"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const title = racer.racerName || "Racer";

  const latestRacePodSession = racePodSessions[0] ?? null;

  const socialLinks = [
    racer.instagramUrl && {
      label: "Instagram",
      href: racer.instagramUrl,
      icon: <Instagram className="h-4 w-4" />,
    },
    racer.youtubeUrl && {
      label: "YouTube",
      href: racer.youtubeUrl,
      icon: <Youtube className="h-4 w-4" />,
    },
    racer.tiktokUrl && {
      label: "TikTok",
      href: racer.tiktokUrl,
      icon: <Music2 className="h-4 w-4" />,
    },
    racer.facebookUrl && {
      label: "Facebook",
      href: racer.facebookUrl,
      icon: <ExternalLink className="h-4 w-4" />,
    },
    racer.websiteUrl && {
      label: "Website",
      href: racer.websiteUrl,
      icon: <Globe2 className="h-4 w-4" />,
    },
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: React.ReactNode;
  }[];

  const isOwner =
    !!currentUserId &&
    !!racer?.claimedByUserId &&
    String(racer.claimedByUserId) === String(currentUserId);

  const hasPendingClaim =
    !!claimStatus?.hasClaim && claimStatus.status === "pending";

  const hasApprovedClaim =
    !!claimStatus?.hasClaim && claimStatus.status === "approved";

  const hasRejectedClaim =
    !!claimStatus?.hasClaim && claimStatus.status === "rejected";

  const canClaim =
    !!currentUserId &&
    !!racer?.athleteId &&
    (!racer?.isClaimed || (isOwner && !racer?.isVerifiedAthlete)) &&
    (!claimStatus?.hasClaim || hasRejectedClaim);

  const canEdit = isOwner || hasApprovedClaim;

  if (galleryOpen && racer) {
    return (
      <RacerGalleryView
        racer={racer}
        items={galleryItems}
        loading={galleryLoading}
        error={galleryError}
        onRetry={() => setGalleryReload(n => n + 1)}
        canUpload={canEdit}
        onBack={() => setGalleryOpen(false)}
        onUpload={async (drafts) => {
          if (!racer?.athleteId || !currentUserId) return;

          const uploadedItems: RacerGalleryItem[] = [];

          for (const draft of drafts) {
            if (!draft.file) continue;

            const uploaded = await uploadAthleteGalleryMedia(
              racer.athleteId,
              currentUserId,
              draft.file,
              {
                title: draft.title,
                caption: draft.caption,
                isFeatured: draft.isFeatured,
              },
            );

            uploadedItems.push(uploaded as RacerGalleryItem);
            setGalleryItems((prev) => [uploaded as RacerGalleryItem, ...prev]);
            setGalleryError(null);
          }

          if (uploadedItems.length > 0) {
            toast({
              title: "Gallery updated",
              description: `${uploadedItems.length} media item${
                uploadedItems.length === 1 ? "" : "s"
              } uploaded.`,
            });
          }
        }}
      />
    );
  }

  function formatHeightFromMeters(heightMeters?: number | null) {
    if (typeof heightMeters !== "number" || !Number.isFinite(heightMeters)) {
      return "Coming soon";
    }

    const totalInches = Math.round(heightMeters / 0.0254);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;

    return `${feet}'${inches}"`;
  }

  function formatAgeYearsAndDays(dateOfBirth?: string | Date | null) {
    if (!dateOfBirth) return "Coming soon";

    const birth = new Date(dateOfBirth);
    if (Number.isNaN(birth.getTime())) return "Coming soon";

    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();

    const birthdayThisYear = new Date(
      today.getFullYear(),
      birth.getMonth(),
      birth.getDate(),
    );

    if (today < birthdayThisYear) {
      years -= 1;
    }

    const lastBirthday = new Date(
      today.getFullYear() - (today < birthdayThisYear ? 1 : 0),
      birth.getMonth(),
      birth.getDate(),
    );

    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.floor(
      (today.getTime() - lastBirthday.getTime()) / msPerDay,
    );

    return `${years} years, ${days} days`;
  }

  function buildUpdateBody(
    r: Racer,
    userId: string,
    edited: {
      name?: string;
      nickname?: string;
      skillLevel?: "junior" | "amateur" | "pro";
      dateOfBirth?: string;
      bio?: string;
      heightMeters?: number;
      origin?: string | null;
      formattedAddress?: string | null;
      latitude?: string | null;
      longitude?: string | null;
      placeId?: string | null;
      locationProvider?: string | null;
      city?: string | null;
      stateCode?: string | null;
      countryCode?: string | null;
      boatManufacturers?: string;
    },
  ) {
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const body: Record<string, any> = {
      userId,
    };

    if (edited.name !== undefined) {
      body.name = edited.name;
    } else if (r.racerName && r.racerName.trim()) {
      body.name = r.racerName.trim();
    }

    if (edited.nickname !== undefined) {
      body.nickname = edited.nickname;
    }

    if (edited.skillLevel !== undefined) {
      body.skillLevel = edited.skillLevel;
    }

    if (edited.dateOfBirth !== undefined) {
      body.dateOfBirth = edited.dateOfBirth;
    }

    if (edited.bio && edited.bio.trim()) {
      body.bio = edited.bio.trim();
    }

    if (
      typeof edited.heightMeters === "number" &&
      Number.isFinite(edited.heightMeters) &&
      edited.heightMeters > 0
    ) {
      body.height = round2(edited.heightMeters);
    }

    if (edited.origin && edited.origin.trim()) {
      body.origin = edited.origin.trim();
    }

    if (edited.formattedAddress !== undefined) {
      body.formattedAddress = edited.formattedAddress;
    }

    if (edited.latitude !== undefined) {
      body.latitude = edited.latitude;
    }

    if (edited.longitude !== undefined) {
      body.longitude = edited.longitude;
    }

    if (edited.placeId !== undefined) {
      body.placeId = edited.placeId;
    }

    if (edited.locationProvider !== undefined) {
      body.locationProvider = edited.locationProvider;
    }

    if (edited.city !== undefined) {
      body.city = edited.city;
    }

    if (edited.stateCode !== undefined) {
      body.stateCode = edited.stateCode;
    }

    if (edited.countryCode !== undefined) {
      body.countryCode = edited.countryCode;
    }

    if (edited.boatManufacturers && edited.boatManufacturers.trim()) {
      body.boatManufacturers = edited.boatManufacturers.trim();
    }

    return body;
  }

  return (
    <div className="athlete-performance-page relative min-w-0 bg-cl-canvas text-cl-ink">
      <PageSEO title={`${title} • Corner League`} />

      <div className="athlete-performance-page-content relative z-10 w-full pb-10">
        <PremiumRacerHero
          racer={racer}
          ratingCard={ratingCard}
          canEdit={canEdit}
          canClaim={canClaim}
          hasPendingClaim={!!hasPendingClaim}
          hasRejectedClaim={!!hasRejectedClaim}
          socialLinks={socialLinks}
          profileViewCount={profileViewCount}
          onEdit={() => setEditOpen(true)}
          onClaim={handleClaimProfileClick}
          onGallery={() => setGalleryOpen(true)}
          onSearch={() => window.dispatchEvent(new Event("racer-search:open"))}
          onProfileImageClick={() => {
            if (racer.racerImage) {
              setLightboxUrl(racer.racerImage);
            }
          }}
          onClaimedUserClick={() => {
            if (!racer.claimedByUsername) return;

            navigate(`/profile/${encodeURIComponent(racer.claimedByUsername)}`);
          }}
          onShare={() => {
            trackEvent(AnalyticsEvents.RACER_PROFILE_SHARED, {
              racer_id: racer ? String(racer.athleteId ?? racer.id) : null,
              racer_detail_id: racer ? String(racer.id) : null,
              racer_name: racer?.racerName ?? null,
              sport: "jet_ski",
              source_page: "racer_profile",
            });

            setShareOpen(true);
          }}
        />

        <AthletePerformanceCenter
          key={String(racer.athleteId || racer.id)} racer={racer} history={history}
          loading={historyLoading} error={historyError} onRetry={() => setHistoryReload(n => n + 1)}
          sponsors={sponsors} sponsorsLoading={sponsorsLoading} galleryItems={galleryItems} galleryLoading={galleryLoading}
          rating={ratingCard} canEdit={canEdit} isOwner={isOwner}
          ageLabel={formatAgeYearsAndDays(racer.dateOfBirth)} heightLabel={formatHeightFromMeters(racer.height)}
          onGallery={() => setGalleryOpen(true)} onWorldFinals={() => setWorldFinalsOpen(true)}
        />
      </div>

      {lightboxUrl && (
        <div
          className="cl-dark fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-cl-surface text-cl-ink"
            aria-label="Close image"
          >
            <XIcon size={18} />
          </button>
          <img
            src={lightboxUrl}
            className="max-h-[85vh] max-w-[92vw] rounded-xl border border-cl-border object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {editOpen && racer && (
        <EditRacerModal
          profileImageUrl={racer.racerImage}
          headerImageUrl={racer.headerImageUrl}
          sponsors={sponsors}
          initial={{
            firstName: getFirstNameFromFullName(racer.racerName),
            lastName: getLastNameFromFullName(racer.racerName),
            nickname: racer.nickname ?? "",
            skillLevel: racer.skillLevel ?? "amateur",
            dateOfBirth: toDateInputValue(racer.dateOfBirth),
            bio: racer.bio ?? "",
            heightInches:
              typeof racer.height === "number"
                ? Math.round(racer.height / 0.0254)
                : "",
            origin: racer.location ?? "",
            formattedAddress: racer.formattedAddress ?? "",
            latitude: racer.latitude ?? "",
            longitude: racer.longitude ?? "",
            placeId: racer.placeId ?? "",
            locationProvider: racer.locationProvider ?? "",
            city: racer.city ?? "",
            stateCode: racer.stateCode ?? "",
            countryCode: racer.countryCode ?? "",
            boatManufacturers: racer.boatManufacturers ?? "",
            instagramUrl: racer.instagramUrl ?? "",
            youtubeUrl: racer.youtubeUrl ?? "",
            tiktokUrl: racer.tiktokUrl ?? "",
            facebookUrl: racer.facebookUrl ?? "",
            websiteUrl: racer.websiteUrl ?? "",
          }}
          onClose={() => setEditOpen(false)}
          onSave={async (vals) => {
            if (!racer?.id) return;

            if (!canEdit) {
              toast({
                title: "Not allowed",
                description:
                  "Only the verified athlete owner can edit this profile.",
              });
              return;
            }

            const heightInchesNum = toNumOrUndefined(vals.heightInches);

            const edited: {
              name?: string;
              nickname?: string;
              skillLevel?: "junior" | "amateur" | "pro";
              dateOfBirth?: string;
              bio?: string;
              heightMeters?: number;
              origin?: string | null;
              formattedAddress?: string | null;
              latitude?: string | null;
              longitude?: string | null;
              placeId?: string | null;
              locationProvider?: string | null;
              city?: string | null;
              stateCode?: string | null;
              countryCode?: string | null;
              boatManufacturers?: string;
            } = {};

            const newFullName = buildFullName(vals.firstName, vals.lastName);

            if (newFullName && newFullName !== racer.racerName) {
              edited.name = newFullName;
            }

            if (!newFullName) {
              toast({
                title: "Name required",
                description:
                  "Please enter at least a first name or keep the existing name.",
                variant: "destructive",
              });
              return;
            }

            const newNickname = (vals.nickname ?? "").trim();

            if (newNickname !== (racer.nickname ?? "")) {
              edited.nickname = newNickname;
            }

            const newSkillLevel = vals.skillLevel ?? "amateur";

            if (newSkillLevel !== (racer.skillLevel ?? "amateur")) {
              edited.skillLevel = newSkillLevel;
            }

            const newDateOfBirth = (vals.dateOfBirth ?? "").trim();

            if (newDateOfBirth !== toDateInputValue(racer.dateOfBirth)) {
              edited.dateOfBirth = newDateOfBirth;
            }

            const newBio = (vals.bio ?? "").trim();
            if (newBio !== (racer.bio ?? "")) {
              if (newBio) edited.bio = newBio;
            }

            if (typeof heightInchesNum === "number") {
              if (heightInchesNum < 36 || heightInchesNum > 96) {
                toast({
                  title: "Please fix the form",
                  description:
                    "Height must be between 36 and 96 inches (3′0″–8′0″).",
                });
                return;
              }
              const newMeters = parseFloat(
                inchesToMeters(heightInchesNum).toFixed(2),
              );
              const currentMeters =
                typeof racer.height === "number"
                  ? parseFloat(racer.height.toFixed(2))
                  : undefined;
              if (newMeters !== currentMeters) edited.heightMeters = newMeters;
            }

            const newOrigin = (vals.origin ?? "").trim();
            const newFormattedAddress = (vals.formattedAddress ?? "").trim();
            const newLatitude = (vals.latitude ?? "").trim();
            const newLongitude = (vals.longitude ?? "").trim();
            const newPlaceId = (vals.placeId ?? "").trim();
            const newLocationProvider = (vals.locationProvider ?? "").trim();
            const newCity = (vals.city ?? "").trim();
            const newStateCode = (vals.stateCode ?? "").trim();
            const newCountryCode = (vals.countryCode ?? "").trim();

            const locationChanged =
              newOrigin !== (racer.location ?? "") ||
              newFormattedAddress !== (racer.formattedAddress ?? "") ||
              newLatitude !== String(racer.latitude ?? "") ||
              newLongitude !== String(racer.longitude ?? "") ||
              newPlaceId !== (racer.placeId ?? "") ||
              newLocationProvider !== (racer.locationProvider ?? "") ||
              newCity !== (racer.city ?? "") ||
              newStateCode !== (racer.stateCode ?? "") ||
              newCountryCode !== (racer.countryCode ?? "");

            if (locationChanged) {
              edited.origin = newOrigin || null;
              edited.formattedAddress = newFormattedAddress || null;
              edited.latitude = newLatitude || null;
              edited.longitude = newLongitude || null;
              edited.placeId = newPlaceId || null;
              edited.locationProvider = newLocationProvider || null;
              edited.city = newCity || null;
              edited.stateCode = newStateCode || null;
              edited.countryCode = newCountryCode || null;
            }

            const newBoat = (vals.boatManufacturers ?? "").trim();
            if (newBoat !== (racer.boatManufacturers ?? "")) {
              if (newBoat) edited.boatManufacturers = newBoat;
            }

            const hasEdits = Object.keys(edited).length > 0;
            const hasImage = !!vals.imageFile && !!racer.athleteId;
            const hasHeaderImage = !!vals.headerImageFile && !!racer.athleteId;
            const sponsorDrafts = vals.sponsorsToCreate ?? [];
            const hasSponsor = sponsorDrafts.some((sponsor) =>
              sponsor.name.trim(),
            );

            const hasSocialEdits =
              (vals.instagramUrl ?? "") !== (racer.instagramUrl ?? "") ||
              (vals.youtubeUrl ?? "") !== (racer.youtubeUrl ?? "") ||
              (vals.tiktokUrl ?? "") !== (racer.tiktokUrl ?? "") ||
              (vals.facebookUrl ?? "") !== (racer.facebookUrl ?? "") ||
              (vals.websiteUrl ?? "") !== (racer.websiteUrl ?? "");

            if (
              !hasEdits &&
              !hasImage &&
              !hasHeaderImage &&
              !hasSponsor &&
              !hasSocialEdits
            ) {
              setEditOpen(false);
              return;
            }

            const endpoint = `/athletes/${encodeURIComponent(
              String(racer.athleteId),
            )}/profile`;

            try {
              if (!currentUserId) {
                toast({
                  title: "Not allowed",
                  description: "You must be signed in to edit this profile.",
                });
                return;
              }

              if (hasImage) {
                setUploadPct(0);
                void pollUploadProgress(vals.imageFile!.name, (p) =>
                  setUploadPct(p),
                );

                const mediaUrl = await uploadAthleteImage(
                  racer.athleteId!,
                  currentUserId,
                  vals.imageFile!,
                );

                setRacer((prev) =>
                  prev ? { ...prev, racerImage: mediaUrl } : prev,
                );
                setUploadPct(100);
                toast({ title: "Photo uploaded" });
              }

              if (hasHeaderImage) {
                setUploadPct(0);

                const headerUrl = await uploadAthleteHeaderImage(
                  racer.athleteId!,
                  currentUserId,
                  vals.headerImageFile!,
                );

                setRacer((prev) =>
                  prev ? { ...prev, headerImageUrl: headerUrl } : prev,
                );

                setUploadPct(100);
                toast({ title: "Header photo uploaded" });
              }

              if (hasEdits) {
                const body = buildUpdateBody(racer, currentUserId, edited);

                await apiRequest("PATCH", endpoint, body);

                setRacer((prev): Racer | null => {
                  if (!prev) return prev;

                  const nextDateOfBirth =
                    edited.dateOfBirth !== undefined
                      ? edited.dateOfBirth || null
                      : (prev.dateOfBirth ?? null);

                  const nextAge =
                    edited.dateOfBirth !== undefined
                      ? (calculateAge(edited.dateOfBirth) ?? undefined)
                      : prev.racerAge;

                  return {
                    ...prev,
                    racerName:
                      edited.name !== undefined ? edited.name : prev.racerName,
                    nickname:
                      edited.nickname !== undefined
                        ? edited.nickname || null
                        : (prev.nickname ?? null),
                    skillLevel:
                      edited.skillLevel !== undefined
                        ? edited.skillLevel
                        : (prev.skillLevel ?? "amateur"),
                    dateOfBirth: nextDateOfBirth,
                    racerAge: nextAge,
                    bio:
                      edited.bio !== undefined
                        ? edited.bio
                        : (prev.bio ?? null),
                    location:
                      edited.origin !== undefined
                        ? edited.origin
                        : (prev.location ?? null),

                    formattedAddress:
                      edited.formattedAddress !== undefined
                        ? edited.formattedAddress
                        : (prev.formattedAddress ?? null),

                    latitude:
                      edited.latitude !== undefined
                        ? edited.latitude
                        : (prev.latitude ?? null),

                    longitude:
                      edited.longitude !== undefined
                        ? edited.longitude
                        : (prev.longitude ?? null),

                    placeId:
                      edited.placeId !== undefined
                        ? edited.placeId
                        : (prev.placeId ?? null),

                    locationProvider:
                      edited.locationProvider !== undefined
                        ? edited.locationProvider
                        : (prev.locationProvider ?? null),

                    city:
                      edited.city !== undefined
                        ? edited.city
                        : (prev.city ?? null),

                    stateCode:
                      edited.stateCode !== undefined
                        ? edited.stateCode
                        : (prev.stateCode ?? null),

                    countryCode:
                      edited.countryCode !== undefined
                        ? edited.countryCode
                        : (prev.countryCode ?? null),
                    boatManufacturers:
                      edited.boatManufacturers !== undefined
                        ? edited.boatManufacturers
                        : (prev.boatManufacturers ?? null),
                    height:
                      typeof edited.heightMeters === "number"
                        ? edited.heightMeters
                        : (prev.height ?? null),
                  };
                });
              }

              if (hasSocialEdits) {
                await updateAthleteSocialLinks(
                  racer.athleteId!,
                  currentUserId,
                  {
                    instagramUrl: vals.instagramUrl,
                    youtubeUrl: vals.youtubeUrl,
                    tiktokUrl: vals.tiktokUrl,
                    facebookUrl: vals.facebookUrl,
                    websiteUrl: vals.websiteUrl,
                  },
                );

                setRacer((prev) =>
                  prev
                    ? {
                        ...prev,
                        instagramUrl: vals.instagramUrl || null,
                        youtubeUrl: vals.youtubeUrl || null,
                        tiktokUrl: vals.tiktokUrl || null,
                        facebookUrl: vals.facebookUrl || null,
                        websiteUrl: vals.websiteUrl || null,
                      }
                    : prev,
                );
              }

              if (hasSponsor) {
                const createdSponsors: RacerSponsor[] = [];

                for (const sponsor of sponsorDrafts) {
                  if (!sponsor.name.trim()) continue;

                  const newSponsor = await createAthleteSponsor(
                    racer.athleteId!,
                    currentUserId,
                    {
                      name: sponsor.name.trim(),
                      websiteUrl: sponsor.websiteUrl,
                      logoFile: sponsor.logoFile,
                    },
                  );

                  createdSponsors.push(newSponsor as RacerSponsor);
                }

                if (createdSponsors.length > 0) {
                  setSponsors((prev) => [...createdSponsors, ...prev]);
                }
              }

              setEditOpen(false);
              setUploadPct(null);
              toast({ title: "Profile updated" });
            } catch (err: any) {
              setUploadPct(null);
              logRequestError("[RacerProfile] save", err, endpoint, edited);
              const nice =
                humanizeValidationError(err) ||
                err?.data?.message ||
                err?.data?.error ||
                err?.message ||
                "Validation error";
              toast({ title: "Update failed", description: String(nice) });
            }
          }}
          uploadPct={uploadPct}
        />
      )}

      {worldFinalsOpen && racer && (
        <EditWorldFinalsModal
          initial={{
            careerWorldFinalsWins: racer.careerWorldFinalsWins ?? 0,
          }}
          onClose={() => setWorldFinalsOpen(false)}
          onSave={async (values) => {
            if (!racer?.id || !racer?.athleteId) return;

            if (!currentUserId) {
              toast({
                title: "Please log in",
                description:
                  "You need to be signed in to update World Finals wins.",
              });
              return;
            }

            if (!canEdit) {
              toast({
                title: "Not allowed",
                description:
                  "Only the verified athlete owner can edit this profile.",
              });
              return;
            }

            const endpoint = `/jet-ski-racer-details/${encodeURIComponent(
              String(racer.id),
            )}/world-finals`;

            try {
              await apiRequest("PATCH", endpoint, {
                userId: currentUserId,
                careerWordFinalsWins: values.careerWorldFinalsWins,
              });

              setRacer((prev) =>
                prev
                  ? {
                      ...prev,
                      careerWorldFinalsWins: values.careerWorldFinalsWins,
                    }
                  : prev,
              );

              setWorldFinalsOpen(false);

              toast({
                title: "World Finals updated",
                description: "Your World Finals wins have been saved.",
              });
            } catch (err: any) {
              logRequestError("[WorldFinals] save", err, endpoint, {
                userId: currentUserId,
                careerWordFinalsWins: values.careerWorldFinalsWins,
              });

              const nice =
                humanizeValidationError(err) ||
                err?.data?.message ||
                err?.data?.error ||
                err?.message ||
                "Could not update World Finals wins.";

              toast({
                title: "World Finals update failed",
                description: String(nice),
                variant: "destructive",
              });
            }
          }}
        />
      )}
      {claimOpen &&
        racer?.athleteId &&
        isAuthenticated &&
        currentUserId &&
        getAccessToken() && (
          <ClaimAthleteModal
            racerName={racer.racerName}
            onClose={() => setClaimOpen(false)}
            onSubmit={async ({ additionalInfo, idCardImage }) => {
              try {
                setClaimLoading(true);

                const form = new FormData();
                form.append("userId", String(currentUserId));
                form.append("athleteId", String(racer.athleteId));
                if (additionalInfo?.trim()) {
                  form.append("additionalInfo", additionalInfo.trim());
                }
                form.append("idCardImage", idCardImage);

                const res = await apiRequest<any>(
                  "POST",
                  "/athlete-claims",
                  form as any,
                );

                setClaimStatus({
                  hasClaim: true,
                  status: "pending",
                  claimId: res?.claimId,
                });

                setClaimOpen(false);
                toast({
                  title: "Claim submitted",
                  description:
                    "Your athlete claim has been sent for admin review.",
                });
              } catch (err: any) {
                logRequestError(
                  "[AthleteClaim] submit",
                  err,
                  "/athlete-claims",
                );
                const nice =
                  humanizeValidationError(err) ||
                  err?.data?.message ||
                  err?.data?.error ||
                  err?.message ||
                  "Could not submit claim";

                toast({
                  title: "Claim failed",
                  description: String(nice),
                });
              } finally {
                setClaimLoading(false);
              }
            }}
            loading={claimLoading}
          />
        )}

      {PUBLIC_RACEPOD_ENABLED && <RacePodSessionsModal
        open={racePodSessionsOpen}
        racerName={racer.racerName}
        sessions={racePodSessions}
        loading={racePodSessionsLoading}
        onClose={() => setRacePodSessionsOpen(false)}
        onOpenSession={(sessionId) => {
          setRacePodSessionsOpen(false);
          navigate(`/racepod/sessions/${encodeURIComponent(sessionId)}`);
        }}
      />}

      <RacerProfileShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        racer={racer}
        ratingCard={ratingCard}
        profileViewCount={profileViewCount}
        sponsors={sponsors}
      />
    </div>
  );
}
