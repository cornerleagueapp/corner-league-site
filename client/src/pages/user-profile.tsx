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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTeamLogo } from "@/constants/teamLogos";
import UserSearchModal from "@/components/userSearchModal";
import stockAvatar from "../assets/stockprofilepicture.jpeg";

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
  const m = 60_000,
    h = 60 * m,
    day = 24 * h,
    wk = 7 * day;
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
    }
  );
}

async function unfollowUser(viewerId: string, targetId: string) {
  return apiRequest(
    "DELETE",
    `/users/${encodeURIComponent(viewerId)}/unfollow-user`,
    { userToUnfollowId: String(targetId) }
  );
}

// fire-and-forget create notification
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
      userId: String(recipientUserId), // who receives the notification
      senderId: String(senderUserId), // who performed the action
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
    "followers"
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

  // tabs
  const [activeTab, setActiveTab] = useState<"scores" | "posts" | "clubs">(
    "scores"
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
          `/users/get-user-by-username/${encodeURIComponent(username)}`
        );
        const u = uRes?.data;
        if (!u) throw new Error("User not found");

        const [counts, favTeams] = await Promise.all([
          apiGet<{ data: { followersCount: number; followingCount: number } }>(
            `/users/${u.id}/get-followers-count`
          ),
          apiGet<{ data: { teams: FavoriteTeam[] } }>(
            `/users/${u.id}/get-favorite-teams`
          ),
        ]);

        const all = await apiGet<{ data: { profilePosts: any[] } }>(
          `/social/profile-posts`
        );
        const onlyMine = (all?.data?.profilePosts || []).filter(
          (p) => String(p?.user?.id) === String(u.id)
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
                    `/social/post-reactions/${p.id}/${viewerId}`
                  ),
                  apiGet<{ count: number }>(
                    `/social/post-reactions/count/${p.id}`
                  ),
                  apiGet<{ count: number }>(
                    `/social/profile-posts/${p.id}/comments-count`
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
          })
        );

        if (ignore) return;
        setMe(u);
        setFollowers(counts?.data?.followersCount ?? 0);
        setFollowingCount(counts?.data?.followingCount ?? 0);
        setPoints(counts?.data?.followingCount ?? 0);
        setTeams(
          Array.isArray(favTeams?.data?.teams) ? favTeams.data.teams : []
        );
        setPosts(enriched);

        try {
          if (viewerId && String(u.id) !== String(viewerId)) {
            const following = await apiGet<{
              data: { followingList: Array<{ id: string | number }> };
            }>(`/users/${viewerId}/get-following-list`);
            const amIFollowing = (following?.data?.followingList ?? []).some(
              (f) => String(f.id) === String(u.id)
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

  // reactions
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
    updater: (p: ProfilePost) => ProfilePost
  ) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
  }
  async function refreshOne(postId: string) {
    try {
      const [userReaction, reactionCount, commentCount] = await Promise.all([
        apiGet<{ reaction: string | null }>(
          `/social/post-reactions/${postId}/${viewerId}`
        ),
        apiGet<{ count: number }>(`/social/post-reactions/count/${postId}`),
        apiGet<{ count: number }>(
          `/social/profile-posts/${postId}/comments-count`
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
        `/users/${userId}/get-followers-list`
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
        `/users/${userId}/get-following-list`
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
        .includes(norm)
  );
  const filteredFollowing = followingList.filter(
    (u) =>
      !norm ||
      String(u.username || "")
        .toLowerCase()
        .includes(norm)
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

  // ----- loading / error -----
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white">
        <PageSEO title="Profile • Corner League" />
        <ProfileSkeleton />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white grid place-items-center">
        <div className="text-center space-y-3">
          <div className="text-xl font-semibold">
            Couldn’t load this profile
          </div>
          <div className="text-white/70">{error}</div>
          <Button
            onClick={() => window.history.back()}
            className="bg-white text-black"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  // ----- UI -----
  return (
    <div className="min-h-screen bg-[#090D16] text-white">
      <PageSEO
        title={`${
          me ? `${me.firstName} ${me.lastName}` : "Profile"
        } • Corner League`}
      />

      {/* top-right search */}
      <div className="mx-auto max-w-5xl px-4 pt-4 flex justify-end">
        <button
          onClick={() => setSearchOpen(true)}
          className="h-9 w-9 grid place-items-center rounded-full bg-white/10 border border-white/10 hover:bg-white/15"
          aria-label="Search users"
        >
          <SearchIcon size={18} />
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-4 mt-8">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-amber-400 inline-block self-center sm:self-auto">
            <img
              src={me?.profilePicture || stockAvatar}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== stockAvatar) img.src = stockAvatar;
              }}
              className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover bg-black"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-center sm:text-left">
              {me ? `${me.firstName} ${me.lastName}` : " "}
            </h1>

            <div className="mt-1 flex flex-col items-center sm:flex-row sm:items-center sm:gap-2">
              <p className="text-sm text-white/70">@{me?.username}</p>

              {!!me?.tags?.profile?.length && (
                <div className="mt-1 sm:mt-0 flex flex-wrap justify-center sm:justify-start gap-2">
                  {me.tags!.profile!.map((t, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full border border-white/10 text-[11px] text-white/90"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <BioBlock text={me?.bio} className="mt-3 w-full sm:hidden" />

            <div className="flex gap-3 mt-4 justify-center sm:justify-start">
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
              "flex w-full gap-2 self-center sm:self-end sm:w-auto",
              isOwn ? "justify-center" : "justify-start",
              "sm:justify-end"
            )}
          >
            {!isOwn && (
              <Button
                onClick={async () => {
                  if (!viewerId || !me?.id) return;

                  const wasFollowing = isFollowing;
                  setIsFollowing(!wasFollowing);
                  setFollowers((c) => Math.max(0, c + (wasFollowing ? -1 : 1)));

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
                      Math.max(0, c + (wasFollowing ? 1 : -1))
                    );
                    toast({
                      title: wasFollowing ? "Unfollow failed" : "Follow failed",
                      description: e?.message || "Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className={cn(
                  "h-11 w-[70%] sm:h-9 sm:w-auto border hover:bg-white/15",
                  isFollowing
                    ? "bg-purple-500/45 border-white-400/30"
                    : "bg-white/10 border-white/10"
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
                "h-11 sm:h-9 sm:w-auto bg-white text-black hover:bg-white/90",
                isOwn ? "mx-auto w-auto" : "w-[30%]"
              )}
            >
              Share
            </Button>
          </div>
        </div>

        <BioBlock text={me?.bio} className="mt-3 hidden sm:block" />

        {/* tabs */}
        <div className="mt-8 border-b border-white/10">
          {/* Mobile: centered 3-up; Desktop: left-aligned with gap */}
          <div className="flex text-sm justify-center sm:justify-start sm:gap-8">
            <Tab
              label="Scores"
              active={activeTab === "scores"}
              onClick={() => setActiveTab("scores")}
              className="w-1/3 text-center sm:w-auto sm:px-0"
            />
            <Tab
              label="Posts"
              active={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
              className="w-1/3 text-center sm:w-auto sm:px-0"
            />
            <Tab
              label="Clubs"
              active={activeTab === "clubs"}
              onClick={() => setActiveTab("clubs")}
              className="w-1/3 text-center sm:w-auto sm:px-0"
            />
          </div>
        </div>

        {/* content */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left column: favorite teams */}
          <div className="order-2 lg:order-1 lg:col-span-1 space-y-6">
            <Card className="relative bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/80">Favorite Teams</p>
                {isOwn && (
                  <button
                    onClick={() => toast({ title: "Add team coming soon" })}
                    className="h-8 w-8 grid place-items-center rounded-full bg-white/10 border border-white/10 hover:bg-white/15"
                    aria-label="Add favorite team"
                    title="Add favorite team"
                  >
                    <PlusIcon className="text-white" strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {teams.map((t) => {
                  const logo = getTeamLogo(t.name);
                  return (
                    <div
                      key={t.id}
                      className="h-12 w-12 rounded-full bg-white/5 border border-white/10 grid place-items-center overflow-hidden"
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
                  <p className="text-white/60 text-sm">
                    {isOwn
                      ? "Add your favorite teams."
                      : "No favorite teams yet."}
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* main column */}
          <div className="order-1 lg:order-2 lg:col-span-2">
            {activeTab === "scores" && (
              <Card className="bg-white/5 border-white/10 p-4">
                <p className="text-white/70 text-sm">
                  Scores widgets coming here.
                </p>
              </Card>
            )}

            {activeTab === "clubs" && (
              <Card className="bg-white/5 border-white/10 p-4 text-white/70">
                <p>Clubs content goes here</p>
              </Card>
            )}

            {activeTab === "posts" && (
              <div className="space-y-3">
                {/* composer only if viewing own profile */}
                {isOwn && (
                  <Composer
                    avatarSrc={me?.profilePicture || stockAvatar}
                    onPosted={async () => {
                      // simple refresh by reloading posts part
                      try {
                        const all = await apiGet<{
                          data: { profilePosts: any[] };
                        }>(`/social/profile-posts`);
                        const mine = (all?.data?.profilePosts || []).filter(
                          (p) => String(p?.user?.id) === String(me?.id)
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
                              +new Date(b.createdAt) - +new Date(a.createdAt)
                          );
                        setPosts(normalized);
                      } catch {}
                    }}
                  />
                )}

                {/* posts list */}
                {posts.length === 0 && (
                  <Card className="bg-white/5 border-white/10 p-6 text-center text-white/70">
                    No posts yet.
                  </Card>
                )}

                {posts.map((p) => (
                  <Card key={p.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex gap-3">
                      <img
                        src={me?.profilePicture || stockAvatar}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (img.src !== stockAvatar) img.src = stockAvatar;
                        }}
                        className="h-12 w-12 rounded-full object-cover"
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-white">
                            {p.user?.firstName || me?.firstName}{" "}
                            {p.user?.lastName || me?.lastName}
                          </span>
                          <span className="text-white/60">@{me?.username}</span>
                          <span className="text-white/40">
                            • {timeAgo(p.createdAt)}
                          </span>
                        </div>

                        {!!p.content && (
                          <p className="mt-2 whitespace-pre-wrap text-white">
                            {p.content}
                          </p>
                        )}

                        {!!p.mediaUrls?.length && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {p.mediaUrls!.map((u, i) => (
                              <img
                                key={i}
                                src={u}
                                onClick={() => setLightboxUrl(u)}
                                className="cursor-zoom-in rounded-lg object-cover w-full aspect-[4/3] bg-black"
                              />
                            ))}
                          </div>
                        )}

                        <footer className="mt-3 flex items-center gap-5 text-sm text-white/70">
                          <button
                            disabled={!viewerId}
                            onClick={async () => {
                              if (!viewerId) return;
                              const had = !!p.reaction;
                              setPostOptimistic(p.id, (pp) => ({
                                ...pp,
                                reaction: had ? null : "like",
                                reactionCount: Math.max(
                                  0,
                                  (pp.reactionCount ?? 0) + (had ? -1 : 1)
                                ),
                              }));
                              try {
                                if (had) await deleteReaction(p.id, viewerId);
                                else await postReaction(p.id, viewerId, "like");
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
                              const url = new URL(window.location.href);
                              url.searchParams.set("post", p.id);
                              try {
                                await navigator.clipboard.writeText(
                                  url.toString()
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

      {followersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setFollowersOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-white/10 bg-[#0b0f18] p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  className={cn(
                    "px-3 py-2 rounded-md text-sm",
                    followersTab === "followers"
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white"
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
                    "px-3 py-2 rounded-md text-sm",
                    followersTab === "following"
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white"
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
                className="text-white/70 hover:text-white"
                onClick={() => setFollowersOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <input
                value={followSearch}
                onChange={(e) => setFollowSearch(e.target.value)}
                placeholder="Search users…"
                className="h-10 w-full rounded-lg bg-white/5 border border-white/10 px-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/7"
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2">
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
                      <button
                        key={String(u.id)}
                        type="button"
                        onClick={() => {
                          setFollowersOpen(false);
                          navigate(`/profile/${u.username}`);
                        }}
                        className={cn(
                          "w-full text-left flex items-center gap-3 rounded-lg border border-white/10 p-3",
                          "hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                        )}
                        aria-label={`Open @${u.username}'s profile`}
                      >
                        <img
                          src={u.profilePicture || stockAvatar}
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (img.src !== stockAvatar) img.src = stockAvatar;
                          }}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div className="text-sm">
                          <div className="font-medium">{u.username}</div>
                        </div>
                      </button>
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
                      <button
                        key={String(u.id)}
                        type="button"
                        onClick={() => {
                          setFollowersOpen(false);
                          navigate(`/profile/${u.username}`);
                        }}
                        className={cn(
                          "w-full text-left flex items-center gap-3 rounded-lg border border-white/10 p-3",
                          "hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                        )}
                        aria-label={`Open @${u.username}'s profile`}
                      >
                        <img
                          src={u.profilePicture || stockAvatar}
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            if (img.src !== stockAvatar) img.src = stockAvatar;
                          }}
                          className="h-9 w-9 rounded-full object-cover"
                        />

                        <div className="text-sm">
                          <div className="font-medium">{u.username}</div>
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-white text-black"
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

      {/* user search */}
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
    <div className="min-w-[140px] rounded-lg bg-white/5 border border-white/10 px-4 py-3">
      <div className="text-2xl font-semibold flex items-center gap-2">
        {value}
        {trophy && <span>🏆</span>}
      </div>
      <div className="text-sm text-white/70">{label}</div>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
  className,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative py-3 text-white/70 hover:text-white",
        "sm:px-4", // spacing on desktop
        active && "text-white font-medium",
        className // allow caller to set w-1/3 text-center on mobile
      )}
    >
      {label}
      {active && (
        <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400" />
      )}
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 mt-16 sm:mt-20 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-6 w-48 bg-white/10 rounded" />
          <div className="mt-2 flex gap-2">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-4 w-16 bg-white/10 rounded" />
          </div>
          <div className="mt-4 flex gap-3">
            <div className="min-w-[140px] rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <div className="h-7 w-12 bg-white/10 rounded" />
              <div className="mt-1 h-4 w-20 bg-white/10 rounded" />
            </div>
            <div className="min-w-[140px] rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <div className="h-7 w-12 bg-white/10 rounded" />
              <div className="mt-1 h-4 w-14 bg-white/10 rounded" />
            </div>
          </div>
        </div>
        <div className="h-9 w-24 bg-white/10 rounded-full" />
      </div>

      <div className="mt-8 border-b border-white/10">
        <div className="flex gap-8 text-sm">
          <div className="h-9 w-16 bg-white/10 rounded" />
          <div className="h-9 w-16 bg-white/10 rounded" />
          <div className="h-9 w-16 bg-white/10 rounded" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="order-2 lg:order-1 lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-white/10 rounded" />
              <div className="h-8 w-8 bg-white/10 rounded-full" />
            </div>
            <div className="mt-3 flex gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="h-12 w-12 rounded-full bg-white/10" />
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-2 space-y-3">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="flex-1 space-y-3">
                <div className="h-16 bg-white/10 rounded-2xl" />
                <div className="h-8 w-28 bg-white/10 rounded-full ml-auto" />
              </div>
            </div>
          </div>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 p-4 rounded-xl"
            >
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-full bg-white/10" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-white/10 rounded" />
                  <div className="mt-2 h-12 w-full bg-white/10 rounded" />
                  <div className="mt-3 flex gap-5">
                    <div className="h-5 w-10 bg-white/10 rounded" />
                    <div className="h-5 w-10 bg-white/10 rounded" />
                    <div className="ml-auto h-5 w-5 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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
    <Card className="bg-white/5 border-white/10 p-4">
      <div className="flex flex-col md:flex-row gap-3">
        <img
          src={avatarSrc || stockAvatar}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src !== stockAvatar) img.src = stockAvatar;
          }}
          className="h-12 w-12 rounded-full object-cover self-start md:self-auto"
        />

        <div className="flex-1">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="What's happening?"
            maxLength={500}
            className="w-full min-h-[64px] resize-y rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/7 text-white"
          />

          {imagePreview && (
            <div className="relative mt-3 inline-block">
              <img
                src={imagePreview}
                className="max-h-36 rounded-xl object-cover border border-white/10"
              />
              <button
                aria-label="Remove image"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-white text-black grid place-items-center shadow"
                title="Remove"
              >
                <XIcon size={16} />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <label
              className="cursor-pointer inline-flex items-center gap-2 text-sm px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/7 text-white"
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
              className="ml-auto rounded-full px-5 bg-white text-black hover:bg-white/90 disabled:opacity-60"
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
        "rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/80",
        className
      )}
    >
      {content ? content : "No bio yet."}
    </div>
  );
}
