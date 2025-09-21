// src/pages/ClubDetails.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";

type ClubOwner = {
  id: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
};
type Channel = { id: string; name: string; type?: string };
type ClubDetails = {
  id: string;
  clubName: string;
  clubImage?: string;
  clubDescription?: string;
  isPrivate?: boolean;
  memberCount?: number;
  owner?: ClubOwner;
  coOwners?: ClubOwner[];
};

export default function ClubDetails() {
  const [match, params] = useRoute("/clubs/:id");
  const clubId = params?.id!;
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>("General");

  // ----- Queries -----
  const {
    data: details,
    isLoading: loadingDetails,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ["club-details", clubId, user?.id],
    queryFn: async () => {
      const json = await apiRequest<any>(
        "GET",
        `/clubs/${clubId}/details?user_id=${user?.id ?? ""}`
      );
      return json?.data as ClubDetails;
    },
    enabled: !!clubId,
  });

  const { data: channelsData } = useQuery({
    queryKey: ["club-channels", clubId],
    queryFn: async () => {
      const json = await apiRequest<any>("GET", `/club-channels/${clubId}`);
      return (json?.data?.channels ?? []) as Channel[];
    },
    enabled: !!clubId,
  });

  const { data: membership } = useQuery({
    queryKey: ["club-is-member", clubId, user?.id],
    queryFn: async () => {
      const json = await apiRequest<any>(
        "GET",
        `/clubs/${clubId}/is-member?userId=${user?.id ?? ""}`
      );
      return !!json?.data?.isMember;
    },
    enabled: !!clubId && !!user?.id,
  });

  const allTabs = useMemo(() => {
    const base = ["General", "Chat"];
    const dynamic = (channelsData ?? []).map((c) => c.name);
    return [...base, ...dynamic];
  }, [channelsData]);

  const activeChannel = (channelsData ?? []).find((c) => c.name === activeTab);

  // ----- Mutations: join/leave -----
  const joinMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", `/clubs/${clubId}/join`, { userId: user?.id }),
    onSuccess: async () => {
      toast({ title: "Joined club" });
      await Promise.allSettled([refetchDetails()]);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () =>
      apiRequest("DELETE", `/clubs/${clubId}/leave`, { userId: user?.id }),
    onSuccess: async () => {
      toast({ title: "Left club" });
      await Promise.allSettled([refetchDetails()]);
    },
  });

  // ----- Posts (General) -----
  const {
    data: posts,
    refetch: refetchPosts,
    isFetching: loadingPosts,
  } = useQuery({
    queryKey: ["club-posts", clubId],
    queryFn: async () => {
      const json = await apiRequest<any>(
        "GET",
        `/club-social/club-posts?clubId=${clubId}`
      );
      return json?.data?.posts ?? [];
    },
    enabled: !!clubId,
  });

  const [composerText, setComposerText] = useState("");

  const createPost = useMutation({
    mutationFn: async () => {
      const payload = {
        userId: user?.id,
        clubId,
        content: (composerText || "").trim(),
        mediaUrls: [], // image upload can be layered in next pass (same endpoint as mobile)
      };
      if (!payload.content) return;
      return apiRequest("POST", "/club-social/club-posts", payload);
    },
    onSuccess: async () => {
      setComposerText("");
      await refetchPosts();
      toast({ title: "Posted to club" });
    },
    onError: () => toast({ title: "Failed to post", variant: "destructive" }),
  });

  const isOwner =
    details?.owner?.id && user?.id
      ? details.owner.id === user.id ||
        (details?.coOwners ?? []).some((co) => co.id === user.id)
      : false;

  // ----- UI -----
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <Link href="/clubs">
            <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800">
              ← Back
            </button>
          </Link>

          <h1 className="text-xl sm:text-2xl font-semibold">Club</h1>

          <div />
        </div>
      </div>

      {/* Gradient hero (matches mobile vibe) */}
      <div className="px-4 sm:px-6">
        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-orange-400/20 p-5">
          {/* top row: name + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold">
                {loadingDetails ? "Loading..." : details?.clubName ?? "Club"}
              </div>
              <div className="mt-1 text-sm text-gray-200/80">
                {details?.memberCount ?? 0} members
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner ? (
                <Link href={`/create-club?edit=${clubId}`}>
                  <button className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20">
                    Settings
                  </button>
                </Link>
              ) : membership ? (
                <button
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-60"
                >
                  {leaveMutation.isPending ? "Leaving..." : "Leave"}
                </button>
              ) : (
                <button
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  className="px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200 disabled:opacity-60"
                >
                  {joinMutation.isPending ? "Joining..." : "Join"}
                </button>
              )}
            </div>
          </div>

          {/* owner */}
          {details?.owner && (
            <div className="mt-5 flex items-center gap-3">
              <img
                src={
                  details.owner.profilePicture ||
                  "https://unavatar.io/github/placeholder"
                }
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <div className="font-medium">
                  {details.owner.firstName} {details.owner.lastName}
                </div>
                <div className="text-xs text-white/60">Owner</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 mt-5 overflow-x-auto">
        <div className="flex items-center gap-2">
          {allTabs.map((name) => (
            <button
              key={name}
              onClick={() => setActiveTab(name)}
              className={`whitespace-nowrap px-4 py-2 rounded-full border ${
                activeTab === name
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-white/85 border-white/10 hover:bg-white/5"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="px-4 sm:px-6 py-6">
        {activeTab === "General" && (
          <div className="max-w-4xl">
            {/* composer (text-only for now) */}
            {membership && (
              <div className="mb-4 rounded-xl border border-gray-800 bg-[#121212] p-4">
                <textarea
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="Share something with the club..."
                  className="w-full bg-transparent outline-none resize-none h-20 text-sm"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => createPost.mutate()}
                    disabled={!composerText.trim() || createPost.isPending}
                    className="px-4 py-2 rounded-md bg-white text-black hover:bg-gray-200 disabled:opacity-60"
                  >
                    {createPost.isPending ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            )}

            {/* posts */}
            <div className="space-y-4">
              {loadingPosts ? (
                <div className="text-white/70">Loading posts…</div>
              ) : posts?.length ? (
                posts.map((p: any) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-gray-800 bg-[#111111] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          p.author?.profilePicture ||
                          "https://unavatar.io/placeholder"
                        }
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div className="text-sm">
                        <div className="font-medium">
                          {p.author?.firstName} {p.author?.lastName}
                        </div>
                        <div className="text-white/50 text-xs">
                          {new Date(p.createdAt ?? Date.now()).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm whitespace-pre-wrap">
                      {p.content}
                    </div>
                    {Array.isArray(p.mediaUrls) && p.mediaUrls[0] && (
                      <img
                        src={p.mediaUrls[0]}
                        className="mt-3 rounded-lg border border-gray-800 max-h-[420px] object-cover"
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-white/60">No posts yet.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Chat" && (
          <div className="max-w-3xl">
            {/* simple placeholder to mirror your mobile note */}
            <div className="rounded-xl border border-gray-800 bg-[#121212] p-6 text-white/80">
              Club live chat coming soon…
            </div>
          </div>
        )}

        {/* dynamic channel tabs — you can later render a real feed here */}
        {activeChannel && activeTab === activeChannel.name && (
          <div className="max-w-3xl">
            <div className="rounded-xl border border-gray-800 bg-[#121212] p-6 text-white/80">
              Channel “{activeChannel.name}” chat coming soon…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
