import React, { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import RacerSearchModal from "@/components/RacerSearchModal";
import { generateRacerAnalysis } from "@/lib/geminiRacerAnalysis";
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

export default function RacerProfilePage({
  idOrSlugParam,
}: {
  idOrSlugParam?: string;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const currentUserId = isAuthenticated && user?.id ? String(user.id) : null;

  const [racer, setRacer] = useState<Racer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const [history, setHistory] = useState<AthleteHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [ratingCard, setRatingCard] = useState<RacerRatingCard | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const [profileViewCount, setProfileViewCount] = useState<number | null>(null);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<RacerGalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [sponsors, setSponsors] = useState<RacerSponsor[]>([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);

  const [claimStatus, setClaimStatus] = useState<{
    hasClaim: boolean;
    status?: "pending" | "approved" | "rejected";
    claimId?: string;
  } | null>(null);

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisErr, setAnalysisErr] = useState<string | null>(null);

  const seasonMotoWins = useMemo(() => {
    return history.filter(
      (item) => item.motoSequence != null && Number(item.position) === 1,
    ).length;
  }, [history]);

  const overallRows = useMemo(
    () => history.filter((item) => item.motoSequence == null),
    [history],
  );

  const motoRows = useMemo(
    () => history.filter((item) => item.motoSequence != null),
    [history],
  );

  const overallWinsCount = useMemo(
    () => overallRows.filter((item) => Number(item.position) === 1).length,
    [overallRows],
  );

  const podiumCount = useMemo(
    () =>
      overallRows.filter((item) => {
        const pos = Number(item.position);
        return pos >= 1 && pos <= 3;
      }).length,
    [overallRows],
  );

  const timelineMaxEvents = 4;

  const visibleTimelineRows = useMemo(() => {
    const seenMatchIds = new Set<string>();
    const allowedMatchIds = new Set<string>();

    for (const item of history) {
      if (!seenMatchIds.has(item.matchId)) {
        seenMatchIds.add(item.matchId);

        if (allowedMatchIds.size < timelineMaxEvents) {
          allowedMatchIds.add(item.matchId);
        }
      }
    }

    return history.filter((item) => allowedMatchIds.has(item.matchId));
  }, [history]);

  const hasTimelineOverflow = useMemo(() => {
    const uniqueMatchIds = new Set(history.map((item) => item.matchId));
    return uniqueMatchIds.size > timelineMaxEvents;
  }, [history]);

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
    if (!racer) return;

    let cancelled = false;

    (async () => {
      try {
        setAnalysisLoading(true);
        setAnalysisErr(null);
        const text = await generateRacerAnalysis(racer);
        if (!cancelled) setAnalysis(text);
      } catch (e: any) {
        console.error("[RacerProfile] AI analysis error", e);
        if (!cancelled) {
          setAnalysisErr("Ai Analysis to come soon.");
          // setAnalysisErr("Could not generate AI analysis for this racer.");
        }
      } finally {
        if (!cancelled) setAnalysisLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [racer?.id]);

  useEffect(() => {
    if (!racer?.athleteId) {
      setHistory([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setHistoryLoading(true);

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
          setHistory(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [racer?.athleteId]);

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
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setGalleryLoading(true);
        const list = await fetchAthleteGallery(String(racer.athleteId));

        if (!cancelled) {
          setGalleryItems(list);
        }
      } catch {
        if (!cancelled) {
          setGalleryItems([]);
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
  }, [racer?.athleteId]);

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

  if (loading || authLoading) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#030913] text-white">
        <PageSEO title="Racer • Corner League" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,107,53,0.08),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative rounded-[28px] border border-cyan-300/10 bg-[#07111F]/80 px-8 py-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_26px_rgba(34,211,238,0.18)]" />
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
            Loading Racer Profile
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Pulling athlete data, rankings, and race history…
          </div>
        </div>
      </div>
    );
  }

  if (err || !racer) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#030913] px-4 text-white">
        <PageSEO title="Racer • Corner League" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,107,53,0.08),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        </div>

        <div className="relative max-w-md rounded-[30px] border border-cyan-300/10 bg-[#07111F]/85 p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
            Racer Profile
          </div>
          <div className="mt-3 text-2xl font-black uppercase text-white">
            Couldn’t load this racer
          </div>
          <div className="mt-3 text-sm leading-7 text-slate-300">
            {err || "Not found"}
          </div>

          <Button
            onClick={() => window.history.back()}
            className="mt-6 rounded-full bg-cyan-300 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] hover:bg-cyan-200"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const title = racer.racerName || "Racer";

  const stats = [
    { label: "Season Moto Wins", value: seasonMotoWins, trophy: true },
    { label: "Season Overall Wins", value: overallWinsCount },
    { label: "Season Podiums", value: podiumCount },
  ];

  const motoWinPct =
    motoRows.length > 0 ? (seasonMotoWins / motoRows.length) * 100 : 0;

  const overallWinPct =
    overallRows.length > 0 ? (overallWinsCount / overallRows.length) * 100 : 0;

  const podiumPct =
    overallRows.length > 0 ? (podiumCount / overallRows.length) * 100 : 0;

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
    !racer?.isClaimed &&
    (!claimStatus?.hasClaim || hasRejectedClaim);

  const canEdit = isOwner || hasApprovedClaim;

  if (galleryOpen && racer) {
    return (
      <RacerGalleryView
        racer={racer}
        items={galleryItems}
        loading={galleryLoading}
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
          }

          if (uploadedItems.length > 0) {
            setGalleryItems((prev) => [...uploadedItems, ...prev]);
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] text-white">
      <PageSEO title={`${title} • Corner League`} />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-cyan-400/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-3 pb-12 sm:pt-10 pt-0 sm:px-4">
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
          onSearch={() => setSearchOpen(true)}
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

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-[24px] border border-cyan-300/10 bg-[#07111F]/80 p-4 sm:grid-cols-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
              Height
            </div>
            <div className="mt-2 text-sm text-white/80">
              {formatHeightFromMeters(racer.height)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
              Age
            </div>
            <div className="mt-2 text-sm text-white/80">
              {formatAgeYearsAndDays(racer.dateOfBirth)}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
              Ride
            </div>
            <div className="mt-2 text-sm text-white/80">
              {racer.boatManufacturers || "Coming soon"}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
              Sponsored By
            </div>
            <div className="mt-2 text-sm text-white/80">
              {sponsors[0]?.name || "Coming soon"}
            </div>
          </div>
        </div>

        <RacerRatingHero rating={ratingCard} />

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map((item) => (
            <StatBox
              key={item.label}
              label={item.label}
              value={item.value}
              trophy={item.trophy}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <PercentStatBox label="Moto Win %" value={motoWinPct} />
          <PercentStatBox label="Overall Win %" value={overallWinPct} />
          <PercentStatBox label="Podium %" value={podiumPct} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-1">
            <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
                Sponsors
              </div>

              {sponsorsLoading ? (
                <p className="text-sm text-white/60">Loading sponsors…</p>
              ) : sponsors.length === 0 ? (
                <p className="text-sm text-white/55">Sponsors coming soon.</p>
              ) : (
                <div className="space-y-3">
                  {sponsors.map((sponsor) => {
                    const logo = getSponsorLogo(sponsor);
                    const website = getSponsorWebsite(sponsor);

                    const content = (
                      <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.06]">
                        {logo ? (
                          <img
                            src={logo}
                            alt={sponsor.name}
                            className="h-10 w-10 rounded-xl object-contain"
                          />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white">
                            {sponsor.name}
                          </div>
                          {website ? (
                            <div className="truncate text-xs text-white/45">
                              {website}
                            </div>
                          ) : null}
                        </div>

                        {website ? (
                          <ExternalLink className="h-4 w-4 text-white/40" />
                        ) : null}
                      </div>
                    );

                    return website ? (
                      <a
                        key={sponsor.id}
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={sponsor.id}>{content}</div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
                World Finals
              </div>
              <div className="grid grid-cols-2 gap-3 text-white/80">
                <MiniStat
                  label="Career WF Wins"
                  value={racer.careerWorldFinalsWins ?? 0}
                />
              </div>
            </Card>

            <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
                <Sparkles className="h-4 w-4" />
                AI Racer Analysis
              </div>
              {analysisLoading ? (
                <p className="text-sm text-white/60">Analyzing this racer…</p>
              ) : analysisErr ? (
                <p className="text-sm text-red-300">{analysisErr}</p>
              ) : analysis ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-white/80">
                  {analysis}
                </p>
              ) : (
                <p className="text-sm text-white/60">
                  Analysis will appear here once available.
                </p>
              )}
            </Card>
          </div>

          <div className="order-1 space-y-4 lg:order-2 lg:col-span-2">
            <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 text-lg font-semibold text-white">
                    Racer Gallery
                  </div>
                  <p className="text-sm leading-7 text-slate-300">
                    Videos, photos, highlights, sponsor content, and race
                    moments.
                  </p>
                </div>

                <Button
                  onClick={() => setGalleryOpen(true)}
                  className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 hover:bg-cyan-300 hover:text-[#06111d]"
                >
                  <Play className="mr-2 h-4 w-4" />
                  View Racer Gallery
                </Button>
              </div>

              {galleryItems.length > 0 ? (
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {galleryItems.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGalleryOpen(true)}
                      className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-white/10 bg-black"
                    >
                      <img
                        src={getGalleryThumb(item)}
                        alt={item.title || "Racer media"}
                        className="h-full w-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/55">
                        {item.type === "video" ? (
                          <Play className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </Card>

            <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6">
              <div className="mb-4 text-lg font-semibold text-white">
                Performance Timeline
              </div>

              {historyLoading ? (
                <p className="text-sm text-slate-300">Loading race history…</p>
              ) : history.length === 0 ? (
                <p className="text-sm leading-7 text-slate-300">
                  No personal race results found yet.
                </p>
              ) : (
                <div
                  className={`overflow-x-auto rounded-[24px] border border-white/10 bg-black/25 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20 ${
                    hasTimelineOverflow
                      ? "max-h-[540px] overflow-y-auto pr-1"
                      : ""
                  }`}
                >
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-white/[0.04] text-white/70">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">
                          Event
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Class
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Moto
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Finish
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Points
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTimelineRows.map((item) => {
                        const isOverall = item.motoSequence == null;

                        return (
                          <tr
                            key={item.resultId}
                            className={`border-t ${
                              isOverall
                                ? "border-cyan-400/15 bg-cyan-400/[0.045]"
                                : "border-white/10"
                            }`}
                          >
                            <td className="px-4 py-3 text-white">
                              <div className="flex items-start gap-3">
                                {isOverall ? (
                                  <span className="mt-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
                                    Overall
                                  </span>
                                ) : (
                                  <span className="mt-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                                    Moto
                                  </span>
                                )}

                                <div>
                                  <div
                                    className={`font-medium ${isOverall ? "text-cyan-100" : "text-white"}`}
                                  >
                                    {item.eventName || "Unknown Event"}
                                  </div>
                                  <div className="text-xs text-white/50">
                                    {item.eventStartDate
                                      ? new Date(
                                          item.eventStartDate,
                                        ).toLocaleDateString()
                                      : "—"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td
                              className={`px-4 py-3 ${isOverall ? "text-cyan-100" : "text-white/85"}`}
                            >
                              {item.divisionName || item.matchName || "—"}
                            </td>

                            <td className="px-4 py-3">
                              {isOverall ? (
                                <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
                                  Overall
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/75">
                                  Moto {item.motoSequence}
                                </span>
                              )}
                            </td>

                            <td
                              className={`px-4 py-3 font-medium ${isOverall ? "text-cyan-100" : "text-white/85"}`}
                            >
                              {item.position ?? "—"}
                            </td>

                            <td
                              className={`px-4 py-3 font-medium ${isOverall ? "text-cyan-100" : "text-white/85"}`}
                            >
                              {item.score ?? "—"}
                            </td>

                            <td className="px-4 py-3 text-white/85">
                              {item.status ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-black"
            aria-label="Close image"
          >
            <XIcon size={18} />
          </button>
          <img
            src={lightboxUrl}
            className="max-h-[85vh] max-w-[92vw] rounded-xl border border-white/10 object-contain"
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

      <RacerSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectRacer={(r) => {
          setSearchOpen(false);
          const idStr = encodeURIComponent(String(r.id));
          navigate(`/racer/${idStr}`);
        }}
      />

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
