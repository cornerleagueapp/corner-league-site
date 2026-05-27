// /pages/user-profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { PageSEO } from "@/seo/usePageSEO";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  X as XIcon,
  Heart,
  MessageCircle,
  Share2,
  Plus as PlusIcon,
  Search as SearchIcon,
  Trophy,
  Users,
  Sparkles,
  UserRound,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTeamLogo } from "@/constants/teamLogos";
import UserSearchModal from "@/components/userSearchModal";
import stockAvatar from "../../assets/stockprofilepicture.jpeg";

import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

// ---------- types ----------
type FavoriteTeam = { id: string; name: string; sr_id?: string };

type ProfileUser = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  bio?: string | null;
  tags?: { profile?: string[] };
};

type ProfilePost = {
  id: string;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  user?: { id?: string | number; firstName?: string; lastName?: string };
  reaction?: string | null;
  reactionCount?: number;
  commentCount?: number;
};

// ---------- utils ----------
const EMOJI: Record<string, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  sad: "😢",
  angry: "😡",
  sigh: "😮‍💨",
  clown: "🤡",
};

function timeAgo(d: string | number | Date) {
  const now = Date.now();
  const diff = Math.max(0, now - new Date(d).getTime());
  const m = 60_000;
  const h = 60 * m;
  const day = 24 * h;
  const wk = 7 * day;

  if (diff < h) return `${Math.floor(diff / m) || 1}m`;
  if (diff < day) return `${Math.floor(diff / h)}h`;
  if (diff < wk) return `${Math.floor(diff / day)}d`;

  return `${Math.floor(diff / wk)}w`;
}

async function followUser(viewerId: string, targetId: string) {
  return apiRequest(
    "POST",
    `/users/${encodeURIComponent(viewerId)}/follow-user`,
    {
      userToFollowId: String(targetId),
    },
  );
}

async function unfollowUser(viewerId: string, targetId: string) {
  return apiRequest(
    "DELETE",
    `/users/${encodeURIComponent(viewerId)}/unfollow-user`,
    { userToUnfollowId: String(targetId) },
  );
}

async function createFollowNotification({
  recipientUserId,
  senderUserId,
  senderUsername,
  senderAvatar,
}: {
  recipientUserId: string | number;
  senderUserId: string | number;
  senderUsername?: string | null;
  senderAvatar?: string | null;
}) {
  try {
    await apiRequest("POST", "/notifications", {
      type: "follow",
      userId: String(recipientUserId),
      senderId: String(senderUserId),
      content: `${senderUsername ?? "Someone"} followed you.`,
      profilePicture: senderAvatar ?? null,
    });
  } catch {
    // non-blocking
  }
}

// ---------- page ----------
export default function UserProfilePage({ username }: { username: string }) {
  const { user: viewer } = useAuth();
  const viewerId = viewer?.id ? String(viewer.id) : null;

  const isOwn = useMemo(() => {
    const v = (viewer as any)?.username;
    return !!(v && username && v.toLowerCase() === username.toLowerCase());
  }, [viewer, username]);

  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const [me, setMe] = useState<ProfileUser | null>(null);
  const [teams, setTeams] = useState<FavoriteTeam[]>([]);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersTab, setFollowersTab] = useState<"followers" | "following">(
    "followers",
  );
  const [followSearch, setFollowSearch] = useState("");

  const [followersList, setFollowersList] = useState<
    Array<{
      id: string | number;
      username: string;
      profilePicture?: string | null;
    }>
  >([]);
  const [followingList, setFollowingList] = useState<
    Array<{
      id: string | number;
      username: string;
      profilePicture?: string | null;
    }>
  >([]);
  const [loadingFollows, setLoadingFollows] = useState(false);

  const [activeTab, setActiveTab] = useState<"scores" | "posts" | "clubs">(
    "scores",
  );

  if (!username) return <div style={{ padding: 24 }}>no username param</div>;

  const apiGet = <T,>(path: string) => apiRequest<T>("GET", path);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const uRes = await apiGet<{ data: ProfileUser }>(
          `/users/get-user-by-username/${encodeURIComponent(username)}`,
        );

        const u = uRes?.data;
        if (!u) throw new Error("User not found");

        const [counts, favTeams] = await Promise.all([
          apiGet<{ data: { followersCount: number; followingCount: number } }>(
            `/users/${u.id}/get-followers-count`,
          ),
          apiGet<{ data: { teams: FavoriteTeam[] } }>(
            `/users/${u.id}/get-favorite-teams`,
          ),
        ]);

        const all = await apiGet<{ data: { profilePosts: any[] } }>(
          `/social/profile-posts`,
        );

        const onlyMine = (all?.data?.profilePosts || []).filter(
          (p) => String(p?.user?.id) === String(u.id),
        );

        const normalized = onlyMine
          .map((p: any) => ({
            ...p,
            mediaUrls: Array.isArray(p.mediaUrls)
              ? p.mediaUrls
              : Array.isArray(p.media_urls)
                ? p.media_urls
                : (() => {
                    try {
                      return JSON.parse(p.mediaUrls ?? "[]");
                    } catch {
                      return [];
                    }
                  })(),
          }))
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

        const enriched = await Promise.all(
          normalized.map(async (p: any) => {
            try {
              const [userReaction, reactionCount, commentCount] =
                await Promise.all([
                  apiGet<{ reaction: string | null }>(
                    `/social/post-reactions/${p.id}/${viewerId}`,
                  ),
                  apiGet<{ count: number }>(
                    `/social/post-reactions/count/${p.id}`,
                  ),
                  apiGet<{ count: number }>(
                    `/social/profile-posts/${p.id}/comments-count`,
                  ),
                ]);

              return {
                ...p,
                reaction:
                  (userReaction as any)?.reaction ??
                  (userReaction as any)?.reaction?.reaction ??
                  null,
                reactionCount: reactionCount?.count ?? 0,
                commentCount: commentCount?.count ?? 0,
              } as ProfilePost;
            } catch {
              return {
                ...p,
                reaction: null,
                reactionCount: 0,
                commentCount: 0,
              } as ProfilePost;
            }
          }),
        );

        if (ignore) return;

        setMe(u);
        setFollowers(counts?.data?.followersCount ?? 0);
        setFollowingCount(counts?.data?.followingCount ?? 0);
        setPoints(counts?.data?.followingCount ?? 0);
        setTeams(
          Array.isArray(favTeams?.data?.teams) ? favTeams.data.teams : [],
        );
        setPosts(enriched);

        try {
          if (viewerId && String(u.id) !== String(viewerId)) {
            const following = await apiGet<{
              data: { followingList: Array<{ id: string | number }> };
            }>(`/users/${viewerId}/get-following-list`);

            const amIFollowing = (following?.data?.followingList ?? []).some(
              (f) => String(f.id) === String(u.id),
            );

            if (!ignore) setIsFollowing(amIFollowing);
          }
        } catch {}
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load profile");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [username, viewerId]);

  async function authHeaders() {
    const token = localStorage.getItem("authToken");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function postReaction(postId: string, uid: string, reaction: string) {
    const res = await apiFetch("/social/post-reactions", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        profilePostId: String(postId),
        userId: String(uid),
        reaction,
      }),
    });

    if (!res.ok) throw new Error(await res.text());

    return res.json();
  }

  async function deleteReaction(postId: string, uid: string) {
    const res = await apiFetch(`/social/post-reactions/${postId}/${uid}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });

    if (!res.ok) throw new Error(await res.text());
  }

  function setPostOptimistic(
    postId: string,
    updater: (p: ProfilePost) => ProfilePost,
  ) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
  }

  async function refreshOne(postId: string) {
    try {
      const [userReaction, reactionCount, commentCount] = await Promise.all([
        apiGet<{ reaction: string | null }>(
          `/social/post-reactions/${postId}/${viewerId}`,
        ),
        apiGet<{ count: number }>(`/social/post-reactions/count/${postId}`),
        apiGet<{ count: number }>(
          `/social/profile-posts/${postId}/comments-count`,
        ),
      ]);

      setPostOptimistic(postId, (p) => ({
        ...p,
        reaction:
          (userReaction as any)?.reaction ??
          (userReaction as any)?.reaction?.reaction ??
          null,
        reactionCount: reactionCount?.count ?? 0,
        commentCount: commentCount?.count ?? 0,
      }));
    } catch {}
  }

  async function loadFollowers(userId: string | number) {
    setLoadingFollows(true);

    try {
      const res = await apiGet<{ data: { followersList: any[] } }>(
        `/users/${userId}/get-followers-list`,
      );

      setFollowersList(res?.data?.followersList ?? []);
    } finally {
      setLoadingFollows(false);
    }
  }

  async function loadFollowing(userId: string | number) {
    setLoadingFollows(true);

    try {
      const res = await apiGet<{ data: { followingList: any[] } }>(
        `/users/${userId}/get-following-list`,
      );

      setFollowingList(res?.data?.followingList ?? []);
    } finally {
      setLoadingFollows(false);
    }
  }

  const norm = followSearch.trim().toLowerCase();

  const filteredFollowers = followersList.filter(
    (u) =>
      !norm ||
      String(u.username || "")
        .toLowerCase()
        .includes(norm),
  );

  const filteredFollowing = followingList.filter(
    (u) =>
      !norm ||
      String(u.username || "")
        .toLowerCase()
        .includes(norm),
  );

  useEffect(() => {
    const anyModal = followersOpen || !!lightboxUrl;
    const prev = document.body.style.overflow;

    if (anyModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = prev || "";

    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [followersOpen, lightboxUrl]);

  useEffect(() => {
    if (!me) return;

    trackEvent(AnalyticsEvents.USER_PROFILE_VIEWED, {
      profile_user_id: me.id,
      profile_username: me.username,
      is_own_profile: isOwn,
      viewer_id: viewerId,
      source_page: "user_profile",
    });
  }, [me?.id, isOwn, viewerId]);

  if (loading) {
    return (
      <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
        <PageSEO title="Profile • Corner League" />
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative grid min-h-dvh place-items-center overflow-x-hidden bg-[#030913] px-4 text-white">
        <PageSEO title="Profile • Corner League" />

        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        </div>

        <div className="max-w-md rounded-[28px] border border-cyan-300/10 bg-[#07111F]/90 p-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
          <div className="text-xl font-black uppercase text-white">
            Couldn’t load this profile
          </div>
          <div className="mt-2 text-sm text-white/60">{error}</div>
          <Button
            onClick={() => window.history.back()}
            className="mt-5 rounded-full bg-cyan-300 px-6 text-[#06111d] hover:bg-cyan-200"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
      <PageSEO
        title={`${me ? `${me.firstName} ${me.lastName}` : "Profile"} • Corner League`}
      />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setSearchOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)] hover:bg-cyan-300/15"
            aria-label="Search users"
          >
            <SearchIcon size={18} />
          </button>
        </div>

        <section className="relative overflow-hidden rounded-[32px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.94)_0%,rgba(4,10,19,0.98)_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:p-7">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="mx-auto shrink-0 rounded-full border border-cyan-300/25 bg-black/40 p-1 shadow-[0_0_34px_rgba(34,211,238,0.18)] sm:mx-0">
              <img
                src={me?.profilePicture || stockAvatar}
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.src !== stockAvatar) img.src = stockAvatar;
                }}
                className="h-28 w-28 rounded-full bg-black object-cover sm:h-36 sm:w-36"
                alt={`${me?.username || "User"} profile`}
              />
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="mb-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
                  <UserRound className="h-3.5 w-3.5" />
                  Profile
                </div>

                {!!me?.tags?.profile?.length &&
                  me.tags.profile.map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199]"
                    >
                      {t}
                    </span>
                  ))}
              </div>

              <h1 className="break-words bg-[linear-gradient(90deg,#FFFFFF_0%,#7CF4FF_48%,#FF7849_100%)] bg-clip-text text-3xl font-black uppercase tracking-[-0.04em] text-transparent sm:text-5xl">
                {me ? `${me.firstName} ${me.lastName}` : " "}
              </h1>

              <p className="mt-2 text-sm font-semibold text-white/60">
                @{me?.username}
              </p>

              <BioBlock text={me?.bio} className="mt-4 sm:hidden" />

              <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <button
                  onClick={() => {
                    if (!me?.id) return;
                    setFollowersOpen(true);
                    setFollowersTab("followers");
                    loadFollowers(me.id);
                    loadFollowing(me.id);
                  }}
                  className="text-left"
                  aria-label="Open followers list"
                >
                  <StatBox label="Followers" value={followers} />
                </button>

                <StatBox label="Points" value={points} trophy />
              </div>
            </div>

            <div
              className={cn(
                "relative flex w-full gap-2 sm:w-auto sm:self-end",
                isOwn ? "justify-center" : "justify-start",
                "sm:justify-end",
              )}
            >
              {!isOwn && (
                <Button
                  onClick={async () => {
                    if (!viewerId || !me?.id) return;

                    const wasFollowing = isFollowing;
                    setIsFollowing(!wasFollowing);
                    setFollowers((c) =>
                      Math.max(0, c + (wasFollowing ? -1 : 1)),
                    );

                    try {
                      if (wasFollowing) {
                        await unfollowUser(viewerId, String(me.id));
                      } else {
                        await followUser(viewerId, String(me.id));
                        await createFollowNotification({
                          recipientUserId: me.id,
                          senderUserId: viewerId,
                          senderUsername: (viewer as any)?.username,
                          senderAvatar: (viewer as any)?.profilePicture,
                        });
                      }
                    } catch (e: any) {
                      setIsFollowing(wasFollowing);
                      setFollowers((c) =>
                        Math.max(0, c + (wasFollowing ? 1 : -1)),
                      );
                      toast({
                        title: wasFollowing
                          ? "Unfollow failed"
                          : "Follow failed",
                        description: e?.message || "Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className={cn(
                    "h-12 flex-1 rounded-full text-xs font-black uppercase tracking-[0.14em] sm:flex-none sm:px-6",
                    isFollowing
                      ? "border border-[#FF6B35]/20 bg-[#FF6B35]/15 text-[#FFB199] hover:bg-[#FF6B35]/20"
                      : "bg-cyan-300 text-[#06111d] hover:bg-cyan-200",
                  )}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}

              <Button
                onClick={async () => {
                  const url = new URL(window.location.href);
                  try {
                    await navigator.clipboard.writeText(url.toString());
                    toast({ title: "Copied to clipboard" });
                  } catch {}
                }}
                className={cn(
                  "h-12 rounded-full border border-white/10 bg-white/[0.05] px-5 text-white hover:bg-white/10",
                  isOwn ? "mx-auto" : "flex-1 sm:flex-none",
                )}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <BioBlock text={me?.bio} className="relative mt-5 hidden sm:block" />
        </section>

        <div className="mt-6 overflow-hidden rounded-[26px] border border-cyan-300/10 bg-[#07111F]/90 shadow-[0_20px_60px_rgba(0,0,0,0.26)]">
          <div className="border-b border-white/10">
            <div className="grid grid-cols-3 text-sm">
              <Tab
                label="Scores"
                active={activeTab === "scores"}
                onClick={() => setActiveTab("scores")}
              />
              <Tab
                label="Posts"
                active={activeTab === "posts"}
                onClick={() => {
                  trackEvent(AnalyticsEvents.USER_PROFILE_TAB_CHANGED, {
                    profile_user_id: me?.id ?? null,
                    profile_username: me?.username ?? username,
                    selected_tab: "posts",
                    is_own_profile: isOwn,
                  });

                  setActiveTab("posts");
                }}
              />
              <Tab
                label="Clubs"
                active={activeTab === "clubs"}
                onClick={() => setActiveTab("clubs")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-4 sm:p-5 lg:grid-cols-3">
            <div className="order-2 space-y-6 lg:order-1 lg:col-span-1">
              <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300/80">
                    Favorite Teams
                  </p>

                  {isOwn && (
                    <button
                      onClick={() => toast({ title: "Add team coming soon" })}
                      className="grid h-9 w-9 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                      aria-label="Add favorite team"
                      title="Add favorite team"
                    >
                      <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {teams.map((t) => {
                    const logo = getTeamLogo(t.name);

                    return (
                      <div
                        key={t.id}
                        className="grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04]"
                        title={t.name}
                      >
                        {logo ? (
                          <img
                            src={logo}
                            alt={t.name}
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <span className="text-xs text-white/70">
                            {t.name.slice(0, 2)}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {!teams.length && (
                    <p className="text-sm text-white/55">
                      {isOwn
                        ? "Add your favorite teams."
                        : "No favorite teams yet."}
                    </p>
                  )}
                </div>
              </Card>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-2">
              {activeTab === "scores" && (
                <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Scores widgets coming here.
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        Racing and profile score cards can live in this section.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === "clubs" && (
                <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 text-white/70">
                  <p>Clubs content goes here</p>
                </Card>
              )}

              {activeTab === "posts" && (
                <div className="space-y-4">
                  {isOwn && (
                    <Composer
                      avatarSrc={me?.profilePicture || stockAvatar}
                      onPosted={async () => {
                        try {
                          const all = await apiGet<{
                            data: { profilePosts: any[] };
                          }>(`/social/profile-posts`);

                          const mine = (all?.data?.profilePosts || []).filter(
                            (p) => String(p?.user?.id) === String(me?.id),
                          );

                          const normalized = mine
                            .map((p: any) => ({
                              ...p,
                              mediaUrls: Array.isArray(p.mediaUrls)
                                ? p.mediaUrls
                                : Array.isArray(p.media_urls)
                                  ? p.media_urls
                                  : (() => {
                                      try {
                                        return JSON.parse(p.mediaUrls ?? "[]");
                                      } catch {
                                        return [];
                                      }
                                    })(),
                            }))
                            .sort(
                              (a, b) =>
                                +new Date(b.createdAt) - +new Date(a.createdAt),
                            );

                          setPosts(normalized);
                        } catch {}
                      }}
                    />
                  )}

                  {posts.length === 0 && (
                    <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-6 text-center text-white/60">
                      No posts yet.
                    </Card>
                  )}

                  {posts.map((p) => (
                    <Card
                      key={p.id}
                      className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4"
                    >
                      <div className="flex gap-3">
                        <img
                          src={me?.profilePicture || stockAvatar}
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (img.src !== stockAvatar) img.src = stockAvatar;
                          }}
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                          alt="Post author"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-white">
                              {p.user?.firstName || me?.firstName}{" "}
                              {p.user?.lastName || me?.lastName}
                            </span>
                            <span className="text-white/55">
                              @{me?.username}
                            </span>
                            <span className="text-white/35">
                              • {timeAgo(p.createdAt)}
                            </span>
                          </div>

                          {!!p.content && (
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/85">
                              {p.content}
                            </p>
                          )}

                          {!!p.mediaUrls?.length && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {p.mediaUrls.map((u, i) => (
                                <img
                                  key={`${u}-${i}`}
                                  src={u}
                                  onClick={() => setLightboxUrl(u)}
                                  className="aspect-[4/3] w-full cursor-zoom-in rounded-[18px] border border-white/10 bg-black object-cover"
                                  alt="Post media"
                                />
                              ))}
                            </div>
                          )}

                          <footer className="mt-3 flex items-center gap-5 text-sm text-white/65">
                            <button
                              disabled={!viewerId}
                              onClick={async () => {
                                if (!viewerId) return;

                                const had = !!p.reaction;

                                trackEvent(AnalyticsEvents.USER_POST_REACTED, {
                                  post_id: p.id,
                                  profile_user_id: me?.id ?? null,
                                  profile_username: me?.username ?? username,
                                  viewer_id: viewerId,
                                  action: had
                                    ? "remove_reaction"
                                    : "add_reaction",
                                  reaction: had ? p.reaction : "like",
                                  source_page: "user_profile",
                                });

                                setPostOptimistic(p.id, (pp) => ({
                                  ...pp,
                                  reaction: had ? null : "like",
                                  reactionCount: Math.max(
                                    0,
                                    (pp.reactionCount ?? 0) + (had ? -1 : 1),
                                  ),
                                }));

                                try {
                                  if (had) await deleteReaction(p.id, viewerId);
                                  else
                                    await postReaction(p.id, viewerId, "like");
                                } finally {
                                  await refreshOne(p.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 hover:text-white"
                              title="Like"
                              type="button"
                            >
                              {p.reaction ? (
                                <span className="text-lg">
                                  {EMOJI[p.reaction] ?? "👍"}
                                </span>
                              ) : (
                                <Heart size={18} />
                              )}

                              <span className="tabular-nums">
                                {p.reactionCount ?? 0}
                              </span>
                            </button>

                            <div className="inline-flex items-center gap-1">
                              <MessageCircle size={18} />
                              <span className="tabular-nums">
                                {p.commentCount ?? 0}
                              </span>
                            </div>

                            <button
                              onClick={async () => {
                                trackEvent(AnalyticsEvents.USER_POST_SHARED, {
                                  post_id: p.id,
                                  profile_user_id: me?.id ?? null,
                                  profile_username: me?.username ?? username,
                                  source_page: "user_profile",
                                });

                                const url = new URL(window.location.href);
                                url.searchParams.set("post", p.id);

                                try {
                                  await navigator.clipboard.writeText(
                                    url.toString(),
                                  );
                                  toast({ title: "Copied to clipboard" });
                                } catch {}
                              }}
                              className="ml-auto inline-flex items-center gap-2 hover:text-white"
                              title="Share"
                              type="button"
                            >
                              <Share2 size={18} />
                            </button>
                          </footer>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {followersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setFollowersOpen(false)}
          />

          <div className="relative z-10 max-h-[86vh] w-full max-w-lg overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#07111F] shadow-[0_30px_90px_rgba(0,0,0,0.52)]">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex gap-2">
                <button
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em]",
                    followersTab === "followers"
                      ? "bg-cyan-300 text-[#06111d]"
                      : "border border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10 hover:text-white",
                  )}
                  onClick={() => {
                    setFollowersTab("followers");
                    me?.id && loadFollowers(me.id);
                  }}
                >
                  Followers ({followers})
                </button>

                <button
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em]",
                    followersTab === "following"
                      ? "bg-cyan-300 text-[#06111d]"
                      : "border border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10 hover:text-white",
                  )}
                  onClick={() => {
                    setFollowersTab("following");
                    me?.id && loadFollowing(me.id);
                  }}
                >
                  Following ({followingCount})
                </button>
              </div>

              <button
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setFollowersOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="border-b border-white/10 p-4">
              <input
                value={followSearch}
                onChange={(e) => setFollowSearch(e.target.value)}
                placeholder="Search users…"
                className="h-11 w-full rounded-[16px] border border-white/10 bg-white/[0.055] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
              />
            </div>

            <div className="max-h-[58vh] space-y-2 overflow-y-auto p-4">
              {loadingFollows && (
                <div className="py-8 text-center text-white/60">Loading…</div>
              )}

              {!loadingFollows && followersTab === "followers" && (
                <>
                  {filteredFollowers.length === 0 ? (
                    <div className="py-6 text-center text-white/60">
                      No followers found.
                    </div>
                  ) : (
                    filteredFollowers.map((u) => (
                      <FollowerRow
                        key={String(u.id)}
                        user={u}
                        currentProfileUserId={me?.id ?? null}
                        currentProfileUsername={me?.username ?? username}
                        sourcePage="user_profile_followers_modal"
                        onClick={() => {
                          setFollowersOpen(false);
                          navigate(`/profile/${u.username}`);
                        }}
                      />
                    ))
                  )}
                </>
              )}

              {!loadingFollows && followersTab === "following" && (
                <>
                  {filteredFollowing.length === 0 ? (
                    <div className="py-6 text-center text-white/60">
                      No following found.
                    </div>
                  ) : (
                    filteredFollowing.map((u) => (
                      <FollowerRow
                        key={String(u.id)}
                        user={u}
                        currentProfileUserId={me?.id ?? null}
                        currentProfileUsername={me?.username ?? username}
                        sourcePage="user_profile_followers_modal"
                        onClick={() => {
                          setFollowersOpen(false);
                          navigate(`/profile/${u.username}`);
                        }}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white text-black"
            aria-label="Close image"
          >
            <XIcon size={18} />
          </button>

          <img
            src={lightboxUrl}
            className="max-h-[85vh] max-w-[92vw] rounded-[24px] border border-white/10 object-contain"
            onClick={(e) => e.stopPropagation()}
            alt="Expanded post media"
          />
        </div>
      )}

      <UserSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectUser={(u) => {
          setSearchOpen(false);
          navigate(`/profile/${u.username}`);
        }}
      />
    </div>
  );
}

// ---------- small bits reused locally ----------
function StatBox({
  label,
  value,
  trophy,
}: {
  label: string;
  value: number;
  trophy?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.045] px-4 py-3 transition hover:border-cyan-300/20 hover:bg-white/[0.06] sm:min-w-[140px]">
      <div className="flex items-center gap-2 text-2xl font-black text-white">
        {value}
        {trophy ? <Trophy className="h-5 w-5 text-[#FFB199]" /> : null}
      </div>

      <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
        {label}
      </div>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative py-4 text-xs font-black uppercase tracking-[0.14em] text-white/55 transition hover:text-white",
        active && "text-white",
      )}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_45%,#FF7849_100%)] shadow-[0_0_16px_rgba(34,211,238,0.45)]" />
      )}
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
      </div>

      <div className="animate-pulse overflow-hidden rounded-[32px] border border-cyan-300/10 bg-[#07111F]/90 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="h-28 w-28 rounded-full bg-white/10 sm:h-36 sm:w-36" />
          <div className="flex-1">
            <div className="h-8 w-56 rounded bg-white/10" />
            <div className="mt-3 h-4 w-28 rounded bg-white/10" />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:flex">
              <div className="h-20 rounded-[20px] bg-white/10 sm:w-[140px]" />
              <div className="h-20 rounded-[20px] bg-white/10 sm:w-[140px]" />
            </div>
          </div>
          <div className="h-12 w-32 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="mt-6 h-80 rounded-[26px] border border-cyan-300/10 bg-[#07111F]/70" />
    </div>
  );
}

function Composer({
  avatarSrc,
  onPosted,
}: {
  avatarSrc: string;
  onPosted: () => Promise<void> | void;
}) {
  const [postText, setPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadMediaIfNeeded(): Promise<string[]> {
    if (!selectedImage) return [];

    const form = new FormData();
    form.append("media", selectedImage);

    const res = await apiFetch("/social/profile-posts/upload-media", {
      method: "POST",
      body: form,
    });

    if (!res.ok) throw new Error(await res.text());

    const json = await res.json();
    const url = json?.data?.mediaUrl as string | undefined;

    return url ? [url] : [];
  }

  async function handleCreatePost() {
    if (!postText.trim() && !selectedImage) return;

    try {
      setUploading(true);

      const mediaUrls = await uploadMediaIfNeeded();

      await apiRequest("POST", "/social/profile-posts", {
        content: postText.trim(),
        mediaUrls,
      });

      setPostText("");
      setSelectedImage(null);
      setImagePreview(null);

      await onPosted();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <img
          src={avatarSrc || stockAvatar}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src !== stockAvatar) img.src = stockAvatar;
          }}
          className="h-12 w-12 self-start rounded-full object-cover md:self-auto"
          alt="Composer avatar"
        />

        <div className="flex-1">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="What's happening?"
            maxLength={500}
            className="min-h-[74px] w-full resize-y rounded-[20px] border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
          />

          {imagePreview && (
            <div className="relative mt-3 inline-block">
              <img
                src={imagePreview}
                className="max-h-36 rounded-[18px] border border-white/10 object-cover"
                alt="Selected post preview"
              />
              <button
                aria-label="Remove image"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-black shadow"
                title="Remove"
              >
                <XIcon size={16} />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <label
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 text-sm text-cyan-100 hover:bg-cyan-300/15"
              title="Add photo/video"
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setSelectedImage(f ?? null);
                  setImagePreview(f ? URL.createObjectURL(f) : null);
                }}
              />
              <ImageIcon size={18} />
            </label>

            <Button
              disabled={uploading || (!postText.trim() && !selectedImage)}
              onClick={handleCreatePost}
              className="ml-auto rounded-full bg-cyan-300 px-5 text-[#06111d] hover:bg-cyan-200 disabled:opacity-60"
            >
              {uploading ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BioBlock({
  text,
  className,
}: {
  text?: string | null;
  className?: string;
}) {
  const content = (text ?? "").trim();

  return (
    <div
      className={cn(
        "rounded-[20px] border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-7 text-white/75",
        className,
      )}
    >
      {content ? content : "No bio yet."}
    </div>
  );
}

function FollowerRow({
  user,
  currentProfileUserId,
  currentProfileUsername,
  sourcePage,
  onClick,
}: {
  user: {
    id: string | number;
    username: string;
    profilePicture?: string | null;
  };
  currentProfileUserId: string | number | null;
  currentProfileUsername: string;
  sourcePage: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        trackEvent(AnalyticsEvents.USER_PROFILE_CLICKED, {
          clicked_user_id: String(user.id),
          clicked_username: user.username,
          source_page: sourcePage,
          current_profile_user_id: currentProfileUserId,
          current_profile_username: currentProfileUsername,
        });

        onClick();
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-[18px] border border-white/10 p-3 text-left",
        "bg-white/[0.035] hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-cyan-300/20",
      )}
      aria-label={`Open @${user.username}'s profile`}
    >
      <img
        src={user.profilePicture || stockAvatar}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (img.src !== stockAvatar) img.src = stockAvatar;
        }}
        className="h-10 w-10 rounded-full object-cover"
        alt={`${user.username} avatar`}
      />

      <div className="text-sm">
        <div className="font-semibold text-white">@{user.username}</div>
      </div>
    </button>
  );
}
