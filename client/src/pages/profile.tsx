// src/pages/profile.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PageSEO } from "@/seo/usePageSEO";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, X as XIcon } from "lucide-react";
import { getTeamLogo } from "@/constants/teamLogos";

// ---- Types ----
interface ProfileUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  bio?: string | null;
  tags?: { profile?: string[] };
}

interface FavoriteTeam {
  id: string;
  name: string;
  sr_id?: string;
}
interface ProfilePost {
  id: string;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  user?: { firstName?: string; lastName?: string };
  reaction?: string | null;
  reactionCount?: number;
  commentCount?: number;
}

// ---- Utils ----
function timeAgo(d: string | number | Date) {
  const now = new Date().getTime();
  const then = new Date(d).getTime();
  const diff = Math.max(0, now - then);
  const m = 60_000,
    h = 60 * m,
    day = 24 * h,
    wk = 7 * day;
  if (diff < h) return `${Math.floor(diff / m) || 1}m`;
  if (diff < day) return `${Math.floor(diff / h)}h`;
  if (diff < wk) return `${Math.floor(diff / day)}d`;
  return `${Math.floor(diff / wk)}w`;
}

// ---- Page ----
export default function ProfilePage() {
  const { user } = useAuth();
  const userId = user?.id;
  const apiGet = <T,>(path: string) => apiRequest<T>("GET", path);

  const [me, setMe] = useState<ProfileUser | null>(null);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [teams, setTeams] = useState<FavoriteTeam[]>([]);
  const [activeTab, setActiveTab] = useState<"scores" | "posts" | "clubs">(
    "scores"
  );
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followSearch, setFollowSearch] = useState("");

  const [postText, setPostText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersTab, setFollowersTab] = useState<"followers" | "following">(
    "followers"
  );
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

  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  const [allTeams, setAllTeams] = useState<
    Array<{ id: string; name: string; logo?: string }>
  >([]);
  const [teamsSearch, setTeamsSearch] = useState("");
  const [savingTeams, setSavingTeams] = useState(false);
  const selectedTeamIds = new Set(teams.map((t) => String(t.id)));

  const apiPost = <T,>(path: string, body?: any) =>
    apiRequest<T>("POST", path, body);

  // ---- fetch profile shell ----
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!userId) return;
      setLoading(true);
      try {
        // Followers / following & points (same endpoint in your mobile code)
        const counts = await apiGet<{
          data: { followersCount: number; followingCount: number };
        }>(`/users/${userId}/get-followers-count`);
        const favTeams = await apiGet<{ data: { teams: FavoriteTeam[] } }>(
          `/users/${userId}/get-favorite-teams`
        );

        type AuthUser = {
          id: string | number;
          username?: string | null;
          firstName?: string | null;
          lastName?: string | null;
          profilePicture?: string | null;
          // some backends use snake_case:
          first_name?: string | null;
          last_name?: string | null;
          profile_picture?: string | null;
        };

        // In web, we assume user already has names/pic from auth; otherwise compose from auth + counts
        const u = (user || {}) as AuthUser;
        const composed: ProfileUser = {
          id: String(u.id),
          username: (u.username ?? "") as string,
          firstName: (u.firstName ?? u.first_name ?? "") as string,
          lastName: (u.lastName ?? u.last_name ?? "") as string,
          profilePicture: (u.profilePicture ?? u.profile_picture ?? null) as
            | string
            | null,
          bio: null, // if you don’t have it yet, keep null
          tags: { profile: [] }, // default empty
        };
        if (!ignore) {
          setMe(composed);
          setFollowers(counts?.data?.followersCount ?? 0);
          setFollowingCount(counts?.data?.followingCount ?? 0);
          setPoints(counts?.data?.followingCount ?? 0);
          setTeams(
            Array.isArray(favTeams?.data?.teams) ? favTeams.data.teams : []
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [userId]);

  // ---- fetch posts (same shape as mobile) ----
  useEffect(() => {
    let ignore = false;

    async function loadPosts() {
      if (!userId) return;

      const res = await apiGet<{ data: { profilePosts: any[] } }>(
        `/social/profile-posts`
      );
      const allPosts = res?.data?.profilePosts || [];

      const filtered = allPosts.filter(
        (p) => String(p?.user?.id) === String(userId)
      );

      const normalized = filtered.map((p) => {
        let media: string[] = [];
        if (Array.isArray(p.mediaUrls)) media = p.mediaUrls;
        else if (Array.isArray(p.media_urls)) media = p.media_urls;
        else if (typeof p.mediaUrls === "string") {
          try {
            media = JSON.parse(p.mediaUrls);
          } catch {}
        }

        return {
          ...p,
          mediaUrls: media,
        } as ProfilePost & { mediaUrls: string[] };
      });

      normalized.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const enriched = await Promise.all(
        normalized.map(async (p) => {
          try {
            const [userReaction, reactionCount, commentCount] =
              await Promise.all([
                apiGet<{ reaction: string | null }>(
                  `/social/post-reactions/${p.id}/${userId}`
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
              reaction: userReaction?.reaction ?? null,
              reactionCount: reactionCount?.count ?? 0,
              commentCount: commentCount?.count ?? 0,
            };
          } catch {
            return { ...p, reaction: null, reactionCount: 0, commentCount: 0 };
          }
        })
      );

      console.log("[Profile] posts for user", userId, enriched);
      setPosts(enriched);
    }

    loadPosts();
    return () => {
      ignore = true;
    };
  }, [userId]);

  if (!userId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Please sign in to view your profile.
      </div>
    );
  }

  async function loadAllTeams() {
    // Try a few likely endpoints in order; stop on first success.
    const candidates = [
      "/sports/teams", // your first attempt (404 on staging)
      "/teams", // common alias
      "/sports/all-teams", // sometimes used
      "/leagues/ALL/teams", // sometimes used
    ];

    for (const path of candidates) {
      try {
        const res = await apiGet<{
          data?: { teams?: Array<{ id: string; name: string; logo?: string }> };
          teams?: Array<{ id: string; name: string; logo?: string }>;
        }>(path);

        const teamsData =
          res?.data?.teams ??
          (Array.isArray((res as any)?.teams) ? (res as any).teams : null);

        if (Array.isArray(teamsData)) {
          setAllTeams(teamsData);
          return;
        }
      } catch (err) {
        // try next candidate
      }
    }

    console.error("Failed to load all teams from known endpoints");
    setAllTeams([]);
  }

  async function saveFavoriteTeams(newIds: string[]) {
    if (!userId) return;
    setSavingTeams(true);
    try {
      await apiRequest("PATCH", "/users/update-favorite-teams", {
        userId: String(userId),
        favoriteTeams: newIds,
      });

      const favTeams = await apiGet<{ data: { teams: FavoriteTeam[] } }>(
        `/users/${userId}/get-favorite-teams`
      );
      setTeams(Array.isArray(favTeams?.data?.teams) ? favTeams.data.teams : []);
      setTeamsModalOpen(false);
    } catch (e) {
      console.error("Saving favorite teams failed", e);
      alert("Could not save favorite teams.");
    } finally {
      setSavingTeams(false);
    }
  }

  async function loadFollowers() {
    if (!userId) return;
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

  async function loadFollowing() {
    if (!userId) return;
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

  async function uploadMediaIfNeeded(): Promise<string[]> {
    if (!selectedImage) return [];
    const form = new FormData();
    form.append("media", selectedImage);

    // Raw fetch so we don't force JSON headers
    const res = await apiFetch("/social/profile-posts/upload-media", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Upload failed: ${msg || res.statusText}`);
    }
    const json = await res.json();
    const url = json?.data?.mediaUrl as string | undefined;
    return url ? [url] : [];
  }

  async function handleCreatePost() {
    if (!userId) return;
    if (!postText.trim() && !selectedImage) return;

    try {
      setUploading(true);
      const mediaUrls = await uploadMediaIfNeeded();

      // matches mobile: { userId, content, mediaUrls }
      await apiRequest("POST", "/social/profile-posts", {
        userId: userId,
        content: postText.trim(),
        mediaUrls,
      });

      // reset UI
      setPostText("");
      setSelectedImage(null);
      setImagePreview(null);

      // reload posts
      await reloadPosts();
    } catch (e) {
      console.error("Create post failed", e);
      alert("Failed to create post.");
    } finally {
      setUploading(false);
    }
  }

  async function reloadPosts() {
    // same logic as your loadPosts, pulled into a function so we can reuse after posting
    const res = await apiGet<{ data: { profilePosts: any[] } }>(
      `/social/profile-posts`
    );
    const allPosts = res?.data?.profilePosts || [];
    const mine = allPosts.filter((p) => String(p?.user?.id) === String(userId));

    const normalized = mine.map((p) => {
      let media: string[] = [];
      if (Array.isArray(p.mediaUrls)) media = p.mediaUrls;
      else if (Array.isArray(p.media_urls)) media = p.media_urls;
      else if (typeof p.mediaUrls === "string") {
        try {
          media = JSON.parse(p.mediaUrls);
        } catch {}
      }
      return { ...p, mediaUrls: media } as ProfilePost & {
        mediaUrls: string[];
      };
    });

    normalized.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const enriched = await Promise.all(
      normalized.map(async (p) => {
        try {
          const [userReaction, reactionCount, commentCount] = await Promise.all(
            [
              apiGet<{ reaction: string | null }>(
                `/social/post-reactions/${p.id}/${userId}`
              ),
              apiGet<{ count: number }>(`/social/post-reactions/count/${p.id}`),
              apiGet<{ count: number }>(
                `/social/profile-posts/${p.id}/comments-count`
              ),
            ]
          );
          return {
            ...p,
            reaction: userReaction?.reaction ?? null,
            reactionCount: reactionCount?.count ?? 0,
            commentCount: commentCount?.count ?? 0,
          };
        } catch {
          return { ...p, reaction: null, reactionCount: 0, commentCount: 0 };
        }
      })
    );

    console.log("[Profile] posts for user", userId, enriched);
    setPosts(enriched);
  }

  const normalizedQuery = followSearch.trim().toLowerCase();
  const filteredFollowers = followersList.filter(
    (u) =>
      !normalizedQuery ||
      String(u.username || "")
        .toLowerCase()
        .includes(normalizedQuery)
  );
  const filteredFollowing = followingList.filter(
    (u) =>
      !normalizedQuery ||
      String(u.username || "")
        .toLowerCase()
        .includes(normalizedQuery)
  );

  return (
    <div className="min-h-screen bg-[#090D16] text-white">
      <PageSEO
        title={`${
          me ? `${me.firstName} ${me.lastName}` : "Profile"
        } • Corner League`}
      />

      {/* Banner gradient */}
      {/* <div className="relative">
        <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-violet-600/80 via-fuchsia-600/80 to-amber-500/80" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#090D16]" />
      </div> */}

      {/* Header / avatar stack (Twitter-like) */}
      <div className="mx-auto max-w-5xl px-4 mt-16 sm:mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative">
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-amber-400 inline-block">
              <img
                src={me?.profilePicture || "/images/stockProfilePic.png"}
                alt="avatar"
                className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover bg-black"
              />
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">
              {me ? `${me.firstName} ${me.lastName}` : " "}
            </h1>
            <p className="text-sm text-white/70 mt-1">@{me?.username}</p>

            {/* Tags */}
            {!!me?.tags?.profile?.length && (
              <div className="flex flex-wrap gap-2 mt-3">
                {me.tags!.profile!.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full border border-white/10 text-xs text-white/90"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {me?.bio && (
              <p className="text-white/80 mt-3 max-w-2xl">{me.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setFollowersOpen(true);
                  setFollowersTab("followers");
                  loadFollowers();
                  loadFollowing();
                }}
                className="text-left"
                aria-label="Open followers list"
              >
                <StatBox label="Followers" value={followers} />
              </button>
              <StatBox label="Points" value={points} trophy />
            </div>
          </div>
          <div className="flex gap-2 self-start sm:self-end">
            <Button className="bg-white text-black hover:bg-white/90">
              Share
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-white/10">
          <div className="flex gap-8 text-sm">
            <Tab
              label="Scores"
              active={activeTab === "scores"}
              onClick={() => setActiveTab("scores")}
            />
            <Tab
              label="Posts"
              active={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
            />
            <Tab
              label="Clubs"
              active={activeTab === "clubs"}
              onClick={() => setActiveTab("clubs")}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column (about) for desktop */}
          <div className="order-2 lg:order-1 lg:col-span-1 space-y-6">
            <Card className="relative bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/80">Favorite Teams</p>
                <button
                  onClick={() => {
                    setTeamsModalOpen(true);
                    loadAllTeams();
                  }}
                  className="h-8 w-8 grid place-items-center rounded-full bg-white/10 border border-white/10 text-xl leading-none hover:bg-white/15"
                  aria-label="Add favorite team"
                  title="Add favorite team"
                >
                  +
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teams.map((t) => {
                  const logo = getTeamLogo(t.name);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                    >
                      {logo ? (
                        <img
                          src={logo}
                          alt={t.name}
                          className="w-7 h-7 rounded-md object-contain bg-black/30"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-white/10 grid place-items-center text-[11px]">
                          {t.name.slice(0, 2)}
                        </div>
                      )}
                      <span className="truncate">{t.name}</span>
                    </div>
                  );
                })}

                {!teams.length && (
                  <p className="text-white/60 text-sm">
                    Add your favorite teams to see scores here.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Main column */}
          <div className="order-1 lg:order-2 lg:col-span-2">
            {loading && (
              <div className="py-10 text-center text-white/60">Loading…</div>
            )}

            {activeTab === "scores" && (
              <Card className="bg-white/5 border-white/10 p-4">
                <p className="text-white/70 text-sm">
                  Scores widgets coming here (Sportradar embeds styled for dark
                  theme).
                </p>
              </Card>
            )}

            {activeTab === "posts" && (
              <div className="space-y-3">
                {/* Composer */}
                <Card className="bg-white/5 border-white/10 p-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <img
                      src={me?.profilePicture || "/images/stockProfilePic.png"}
                      className="h-10 w-10 rounded-full object-cover self-start md:self-auto"
                    />

                    <div className="flex-1">
                      <textarea
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        placeholder="What's happening?"
                        maxLength={500}
                        className="w-full min-h-[64px] resize-y rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/7"
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
                          className="cursor-pointer inline-flex items-center gap-2 text-sm px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/7"
                          title="Add photo/video"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            // on many mobile browsers this opens the camera/album
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              setSelectedImage(f ?? null);
                              setImagePreview(
                                f ? URL.createObjectURL(f) : null
                              );
                            }}
                          />
                          <ImageIcon size={18} />
                        </label>

                        <Button
                          disabled={
                            uploading || (!postText.trim() && !selectedImage)
                          }
                          onClick={handleCreatePost}
                          className="ml-auto rounded-full px-5 bg-white text-black hover:bg-white/90 disabled:opacity-60"
                        >
                          {uploading ? "Posting…" : "Post"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* list */}
                {posts.length === 0 && (
                  <Card className="bg-white/5 border-white/10 p-6 text-center text-white/70">
                    No posts yet.
                  </Card>
                )}
                {posts.map((p) => (
                  <Card key={p.id} className="bg-white/5 border-white/10 p-4">
                    {/* existing post item UI unchanged */}
                    <div className="flex gap-3">
                      <img
                        src={
                          me?.profilePicture || "/images/stockProfilePic.png"
                        }
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">
                            {p.user?.firstName || me?.firstName}{" "}
                            {p.user?.lastName || me?.lastName}
                          </span>
                          <span className="text-white/60">@{me?.username}</span>
                          <span className="text-white/40">
                            • {timeAgo(p.createdAt)}
                          </span>
                        </div>
                        {p.content && (
                          <p className="mt-2 whitespace-pre-wrap">
                            {p.content}
                          </p>
                        )}
                        {!!p.mediaUrls?.length && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {p.mediaUrls!.map((u, i) => (
                              <img
                                key={i}
                                src={u}
                                className="rounded-lg object-cover w-full aspect-[4/3] bg-black"
                              />
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-5 text-sm text-white/70">
                          <span>❤ {p.reactionCount ?? 0}</span>
                          <span>💬 {p.commentCount ?? 0}</span>
                          <button className="ml-auto hover:underline">
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === "clubs" && (
              <Card className="bg-white/5 border-white/10 p-4 text-white/70">
                Clubs content goes here
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Followers/Following Modal */}
      {followersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setFollowersOpen(false)}
          />
          {/* panel */}
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
                    loadFollowers();
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
                    loadFollowing();
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
                      <div
                        key={String(u.id)}
                        className="flex items-center gap-3 rounded-lg border border-white/10 p-3"
                      >
                        <img
                          src={
                            u.profilePicture || "/images/stockProfilePic.png"
                          }
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div className="text-sm">
                          <div className="font-medium">{u.username}</div>
                        </div>
                      </div>
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
                      <div
                        key={String(u.id)}
                        className="flex items-center gap-3 rounded-lg border border-white/10 p-3"
                      >
                        <img
                          src={
                            u.profilePicture || "/images/stockProfilePic.png"
                          }
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div className="text-sm">
                          <div className="font-medium">{u.username}</div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {teamsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setTeamsModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-xl border border-white/10 bg-[#0b0f18] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Pick your favorite teams
              </h3>
              <button
                className="text-white/70 hover:text-white"
                onClick={() => setTeamsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <input
                value={teamsSearch}
                onChange={(e) => setTeamsSearch(e.target.value)}
                placeholder="Search teams…"
                className="h-10 w-full rounded-lg bg-white/5 border border-white/10 px-3 text-sm outline-none placeholder:text-white/40 focus:bg-white/7"
              />
            </div>

            <div
              className="mt-4
                grid grid-cols-1 gap-3
                sm:grid-cols-1
                lg:grid-cols-2
              "
            >
              {allTeams
                .filter(
                  (t) =>
                    !teamsSearch.trim() ||
                    t.name
                      .toLowerCase()
                      .includes(teamsSearch.trim().toLowerCase())
                )
                .map((t) => {
                  const isSelected = selectedTeamIds.has(String(t.id));
                  const logo = getTeamLogo(t.name);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        const next = new Set(selectedTeamIds);
                        if (isSelected) next.delete(String(t.id));
                        else next.add(String(t.id));
                        const nextTeams = allTeams
                          .filter((x) => next.has(String(x.id)))
                          .map((x) => ({ id: String(x.id), name: x.name }));
                        setTeams(nextTeams);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-3 text-left",
                        isSelected
                          ? "border-violet-400/40 bg-violet-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/7"
                      )}
                    >
                      {logo ? (
                        <img
                          src={logo}
                          alt={t.name}
                          className="w-8 h-8 rounded-md object-contain bg-black/30"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-white/10 grid place-items-center text-[11px]">
                          {t.name.slice(0, 2)}
                        </div>
                      )}
                      <span className="truncate">{t.name}</span>
                      <span className="ml-auto text-xs opacity-70">
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="h-9 px-4 rounded-md border border-white/10 text-white/80 hover:text-white"
                onClick={() => setTeamsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                disabled={savingTeams}
                onClick={() =>
                  saveFavoriteTeams(teams.map((t) => String(t.id)))
                }
                className="h-9 px-4 rounded-md bg-white text-black hover:bg-white/90 disabled:opacity-60"
              >
                {savingTeams ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative py-3 text-white/70 hover:text-white",
        active && "text-white font-medium"
      )}
    >
      {label}
      {active && (
        <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400" />
      )}
    </button>
  );
}
