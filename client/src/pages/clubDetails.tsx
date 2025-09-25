import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getRefreshToken } from "@/lib/token";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";
import ClubPostFeed from "@/components/club/ClubPostFeed";
import ClubChannelFeed from "@/components/club/ClubChannelFeed";
import { PageSEO } from "@/seo/usePageSEO";
import gearIcon from "../assets/clubSettingsIcon.png";

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
  const [, params] = useRoute("/clubs/:id");
  const clubId = params?.id!;
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

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
  function ensureSignedIn() {
    if (!getAccessToken() && !getRefreshToken()) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join this club.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Missing user id");
      if (!ensureSignedIn()) throw new Error("No auth token");
      return apiRequest("POST", `/clubs/${clubId}/join`, { userId: user.id });
    },
    onSuccess: async () => {
      // optimistic membership flip for instant UI update
      qc.setQueryData(["club-is-member", clubId, user?.id], true);
      toast({ title: "Joined club" });
      await Promise.allSettled([
        // refresh everything that depends on membership/details
        qc.invalidateQueries({ queryKey: ["club-details", clubId, user?.id] }),
        qc.invalidateQueries({
          queryKey: ["club-is-member", clubId, user?.id],
        }),
        qc.invalidateQueries({ queryKey: ["club-channels", clubId] }),
        qc.invalidateQueries({
          queryKey: ["club-posts-feed", clubId, user?.id],
        }),
      ]);
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.message ||
        e?.data?.message ||
        e?.message ||
        "Failed to join club";
      toast({ title: "Join failed", description: msg, variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () =>
      apiRequest("DELETE", `/clubs/${clubId}/leave`, { userId: user?.id }),
    onSuccess: async () => {
      // optimistic flip to lock down composer immediately
      qc.setQueryData(["club-is-member", clubId, user?.id], false);
      toast({ title: "Left club" });
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ["club-details", clubId, user?.id] }),
        qc.invalidateQueries({
          queryKey: ["club-is-member", clubId, user?.id],
        }),
        qc.invalidateQueries({ queryKey: ["club-channels", clubId] }),
        qc.invalidateQueries({
          queryKey: ["club-posts-feed", clubId, user?.id],
        }),
      ]);
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.message ||
        e?.data?.message ||
        e?.message ||
        "Failed to leave club";
      toast({
        title: "Leave failed",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const isOwner =
    details?.owner?.id && user?.id
      ? details.owner.id === user.id ||
        (details?.coOwners ?? []).some((co) => co.id === user.id)
      : false;

  // ----- UI -----
  return (
    <div className="min-h-screen bg-black text-white">
      <PageSEO
        title={details?.clubName ?? "Club"}
        description={(
          details?.clubDescription ??
          details?.clubName ??
          "Join this Corner League club."
        ).slice(0, 155)}
        canonicalPath={`/clubs/${clubId}`}
        image={details?.clubImage || "https://cornerleague.com/og/club.png"}
      />
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/clubs">
            <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-gray-800">
              ← Back
            </button>
          </Link>

          <h1 className="text-xl sm:text-2xl font-semibold">
            {loadingDetails ? "Club" : details?.clubName ?? "Club"}
          </h1>

          <div className="flex items-center gap-2">
            <Link href={`/club-settings/${clubId}`}>
              <button
                aria-label="Club settings"
                className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Settings"
              >
                <img
                  src={gearIcon}
                  alt="Settings"
                  className="h-5 w-5 object-contain"
                />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-orange-400/20 p-5">
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
                {isOwner ? null : membership ? (
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
      </div>

      <div className="px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[220px_minmax(0,720px)] lg:gap-8">
          {/* --- Mobile/Small: keep horizontal tabs exactly as before --- */}
          <div className="mb-4 lg:hidden overflow-x-auto">
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

          {/* --- Desktop/Tablet: sticky left sidebar tabs --- */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-white/10 p-2">
                {allTabs.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveTab(name)}
                    className={`w-full text-left px-4 py-2 rounded-xl mb-2 last:mb-0 border ${
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
          </aside>

          {/* --- Main column: posts/feed centered --- */}
          <main className="max-w-3xl w-full">
            {activeTab === "General" && (
              <ClubPostFeed
                key={`${clubId}:${membership ? "member" : "guest"}`}
                clubId={clubId}
                userId={user?.id as string | undefined}
                isMember={membership}
                clubName={details?.clubName}
              />
            )}

            {activeTab === "Chat" && (
              <div className="rounded-xl border border-gray-800 bg-[#121212] p-6 text-white/80">
                Club live chat coming soon…
              </div>
            )}

            {activeChannel && activeTab === activeChannel.name && (
              <ClubChannelFeed
                channelId={activeChannel.id}
                clubId={clubId}
                userId={user?.id as string | undefined}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
