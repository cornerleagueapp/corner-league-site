// src/pages/profile.tsx
import React, { useEffect, useRef, useState } from "react";
import { PageSEO } from "@/seo/usePageSEO";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  X as XIcon,
  Plus as PlusIcon,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😂" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
  { type: "sigh", emoji: "😮‍💨" },
  { type: "clown", emoji: "🤡" },
] as const;

const EMOJI: Record<string, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  sad: "😢",
  angry: "😡",
  sigh: "😮‍💨",
  clown: "🤡",
};

// ---- Page ----
export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id;
  const apiGet = <T,>(path: string) => apiRequest<T>("GET", path);
  const [showPickerFor, setShowPickerFor] = useState<string | null>(null);
  const longPress = useRef<{
    tid: number | null;
    did: boolean;
    id: string | null;
  }>({
    tid: null,
    did: false,
    id: null,
  });
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

  const pickReaction = (r: any): string | null =>
    r?.reaction?.reaction ?? r?.reaction ?? null;

  useEffect(() => {
    const anyModal = followersOpen || teamsModalOpen || !!lightboxUrl;
    const prev = document.body.style.overflow;
    if (anyModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [followersOpen, teamsModalOpen, lightboxUrl]);

  // ---- fetch profile shell ----
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!userId) return;
      setLoading(true);
      try {
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
          first_name?: string | null;
          last_name?: string | null;
          profile_picture?: string | null;
        };

        const u = (user || {}) as AuthUser;
        const composed: ProfileUser = {
          id: String(u.id),
          username: (u.username ?? "") as string,
          firstName: (u.firstName ?? u.first_name ?? "") as string,
          lastName: (u.lastName ?? u.last_name ?? "") as string,
          profilePicture: (u.profilePicture ?? u.profile_picture ?? null) as
            | string
            | null,
          bio: null,
          tags: { profile: [] },
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

  async function hydratePosts(raw: any[]) {
    const mine = raw.filter((p) => String(p?.user?.id) === String(userId));
    const normalized = mine
      .map((p) => ({
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
            reaction: pickReaction(userReaction as any),
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

    setPosts(enriched);
  }

  async function fetchAndHydrate() {
    const res = await apiGet<{ data: { profilePosts: any[] } }>(
      `/social/profile-posts`
    );
    await hydratePosts(res?.data?.profilePosts || []);
  }

  useEffect(() => {
    if (userId) fetchAndHydrate();
  }, [userId]);
  async function reloadPosts() {
    await fetchAndHydrate();
  }

  if (!userId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Please sign in to view your profile.
      </div>
    );
  }

  async function loadAllTeams() {
    const candidates = [
      "/sports/teams",
      "/teams",
      "/sports/all-teams",
      "/leagues/ALL/teams",
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
      } catch {}
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
      await apiRequest("POST", "/social/profile-posts", {
        userId: userId,
        content: postText.trim(),
        mediaUrls,
      });
      setPostText("");
      setSelectedImage(null);
      setImagePreview(null);
      await reloadPosts();
    } catch (e) {
      console.error("Create post failed", e);
      alert("Failed to create post.");
    } finally {
      setUploading(false);
      await reloadPosts();
    }
  }

  async function authHeaders() {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function postReaction(postId: string, uid: string, reaction: string) {
    const body = {
      profilePostId: String(postId),
      userId: String(uid),
      reaction,
    };
    console.log("[POST] /social/post-reactions", body);
    const res = await apiFetch("/social/post-reactions", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[postReaction] server said:", text);
      throw new Error(`postReaction failed: ${res.status} ${text}`);
    }
    return res.json();
  }

  async function deleteReaction(postId: string, uid: string) {
    const url = `/social/post-reactions/${postId}/${uid}`;
    console.log("[DELETE]", url);
    const res = await apiFetch(url, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[deleteReaction] server said:", text);
      throw new Error(`deleteReaction failed: ${res.status} ${text}`);
    }
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
          `/social/post-reactions/${postId}/${userId}`
        ),
        apiGet<{ count: number }>(`/social/post-reactions/count/${postId}`),
        apiGet<{ count: number }>(
          `/social/profile-posts/${postId}/comments-count`
        ),
      ]);
      setPostOptimistic(postId, (p) => ({
        ...p,
        reaction: pickReaction(userReaction as any),
        reactionCount: reactionCount?.count ?? 0,
        commentCount: commentCount?.count ?? 0,
      }));
    } catch (e) {
      console.warn("[refreshOne] failed", e);
    }
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

  if (!userId) {
    return (
      <div className="p-6 text-center text-muted-foreground text-white">
        Please sign in to view your profile.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white">
        <PageSEO title="Profile • Corner League" />
        <ProfileSkeleton />
      </div>
    );
  }

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
                src={me?.profilePicture || "../assets/stockprofilepicture.jpeg"}
                alt="avatar"
                className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover bg-black"
              />
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">
              {me ? `${me.firstName} ${me.lastName}` : " "}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm text-white/70">@{me?.username}</p>
              {!!me?.tags?.profile?.length &&
                me.tags!.profile!.map((t, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full border border-white/10 text-[11px] text-white/90"
                  >
                    {t}
                  </span>
                ))}
            </div>

            {me?.bio && (
              <p className="text-white/80 mt-2 max-w-2xl">{me.bio}</p>
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
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Copied to clipboard" });
                } catch {
                  toast({
                    title: "Couldn’t copy URL",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-white text-black hover:bg-white/90"
            >
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
          {/* Left column */}
          <div className="order-2 lg:order-1 lg:col-span-1 space-y-6">
            <Card className="relative bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/80">Favorite Teams</p>
                <button
                  onClick={() => {
                    setTeamsModalOpen(true);
                    loadAllTeams();
                  }}
                  className="h-8 w-8 grid place-items-center rounded-full bg-white/10 border border-white/10 hover:bg-white/15"
                  aria-label="Add favorite team"
                  title="Add favorite team"
                >
                  <PlusIcon className="text-white" strokeWidth={2.5} />
                </button>
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
                    Add your favorite teams to see scores here.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Main column */}
          <div className="order-1 lg:order-2 lg:col-span-2">
            {/* {loading && <ProfileSkeleton />} */}

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
                      src={
                        me?.profilePicture ||
                        "../assets/stockprofilepicture.jpeg"
                      }
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
                              setImagePreview(
                                f ? URL.createObjectURL(f) : null
                              );
                            }}
                          />
                          <ImageIcon size={18} className="text-white" />
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

                {/* Posts list */}
                {posts.length === 0 && (
                  <Card className="bg-white/5 border-white/10 p-6 text-center text-white/70">
                    No posts yet.
                  </Card>
                )}

                {posts.map((p) => (
                  <Card key={p.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex gap-3">
                      <img
                        src={
                          me?.profilePicture ||
                          "../assets/stockprofilepicture.jpeg"
                        }
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

                        {p.content && (
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
                          {/* Reaction toggle (tap) */}
                          <button
                            onClick={async () => {
                              setPostOptimistic(p.id, (pp) => ({
                                ...pp,
                                reaction: pp.reaction ? null : "like",
                                reactionCount: Math.max(
                                  0,
                                  (pp.reactionCount ?? 0) +
                                    (pp.reaction ? -1 : 1)
                                ),
                              }));
                              try {
                                if (p.reaction) {
                                  await deleteReaction(p.id, String(userId));
                                } else {
                                  await postReaction(
                                    p.id,
                                    String(userId),
                                    "like"
                                  );
                                }
                              } catch (e) {
                                console.error("[reaction:single] failed", e);
                              } finally {
                                await refreshOne(p.id);
                              }
                            }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              longPress.current.id = p.id;
                              longPress.current.did = false;
                              longPress.current.tid = window.setTimeout(() => {
                                setShowPickerFor(p.id);
                                longPress.current.did = true;
                              }, 350);
                            }}
                            onPointerUp={() => {
                              if (longPress.current.tid) {
                                clearTimeout(longPress.current.tid);
                                longPress.current.tid = null;
                              }
                            }}
                            onPointerLeave={() => {
                              if (longPress.current.tid) {
                                clearTimeout(longPress.current.tid);
                                longPress.current.tid = null;
                              }
                            }}
                            className="inline-flex items-center gap-1 text-white/70 hover:text-white"
                            title="Like"
                            type="button"
                          >
                            {p.reaction ? (
                              <span className="text-lg leading-none">
                                {EMOJI[p.reaction] ?? "👍"}
                              </span>
                            ) : (
                              <Heart size={18} className="stroke-current" />
                            )}
                            <span className="tabular-nums">
                              {p.reactionCount ?? 0}
                            </span>
                          </button>

                          {/* Comments count (placeholder) */}
                          <div className="inline-flex items-center gap-1 text-white/70">
                            <MessageCircle
                              size={18}
                              className="stroke-current"
                            />
                            <span className="tabular-nums">
                              {p.commentCount ?? 0}
                            </span>
                          </div>

                          {/* Share */}
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
                            className="ml-auto inline-flex items-center gap-2 text-white/70 hover:text-white"
                            title="Share"
                            type="button"
                          >
                            <Share2 size={18} className="stroke-current" />
                          </button>
                        </footer>

                        {/* Reaction picker (long‑press) */}
                        {showPickerFor === p.id && (
                          <div
                            className="mt-2 inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2"
                            onMouseLeave={() => setShowPickerFor(null)}
                          >
                            {REACTIONS.map((r) => (
                              <button
                                key={r.type}
                                className="text-2xl leading-none"
                                onClick={async () => {
                                  setShowPickerFor(null);
                                  setPostOptimistic(p.id, (pp) => ({
                                    ...pp,
                                    reaction: r.type,
                                    reactionCount: pp.reaction
                                      ? pp.reactionCount ?? 0
                                      : (pp.reactionCount ?? 0) + 1,
                                  }));
                                  try {
                                    if (p.reaction) {
                                      await deleteReaction(
                                        p.id,
                                        String(userId)
                                      );
                                    }
                                    await postReaction(
                                      p.id,
                                      String(userId),
                                      r.type
                                    );
                                  } catch (e) {
                                    console.error(
                                      "[reaction:picker] failed",
                                      e
                                    );
                                  } finally {
                                    await refreshOne(p.id);
                                  }
                                }}
                                title={r.type}
                                type="button"
                              >
                                {r.emoji}
                              </button>
                            ))}
                          </div>
                        )}
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
                            u.profilePicture ||
                            "../assets/stockprofilepicture.jpeg"
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
                            u.profilePicture ||
                            "../assets/stockprofilepicture.jpeg"
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

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-white text-black"
            aria-label="Close image"
            type="button"
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

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-1 lg:grid-cols-2">
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

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 mt-16 sm:mt-20 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="relative">
          <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-white/10" />
        </div>
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

      {/* Tabs skeleton */}
      <div className="mt-8 border-b border-white/10">
        <div className="flex gap-8 text-sm">
          <div className="h-9 w-16 bg-white/10 rounded" />
          <div className="h-9 w-16 bg-white/10 rounded" />
          <div className="h-9 w-16 bg-white/10 rounded" />
        </div>
      </div>

      {/* Content skeleton grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column card */}
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

        {/* Main column */}
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

          {/* A couple of post skeleton cards */}
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
