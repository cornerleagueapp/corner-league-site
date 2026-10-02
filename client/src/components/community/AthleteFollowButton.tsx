import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAthleteFollowState,
  getAthleteFollowSummary,
  setAthleteFollow,
} from "@/lib/communityApi";

export default function AthleteFollowButton({
  athleteId,
}: {
  athleteId: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const cache = useQueryClient();
  const key = ["athlete-follow-state", user?.id, athleteId];
  const summary = useQuery({
    queryKey: ["athlete-follow-summary", athleteId],
    queryFn: () => getAthleteFollowSummary(athleteId),
    staleTime: 30_000,
    retry: false,
  });
  const state = useQuery({
    queryKey: key,
    queryFn: () => getAthleteFollowState(athleteId),
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });
  const follow = useMutation({
    mutationFn: (change: {
      athleteId: string;
      accountId: string | number;
      following: boolean;
    }) => setAthleteFollow(change.athleteId, change.following),
    onSuccess: (data, change) => {
      cache.setQueryData(
        ["athlete-follow-state", change.accountId, change.athleteId],
        data,
      );
      cache.setQueryData(["athlete-follow-summary", change.athleteId], {
        athleteId: change.athleteId,
        followerCount: data.followerCount,
      });
      void cache.invalidateQueries({ queryKey: ["profile-athletes"] });
    },
  });
  const count = isAuthenticated
    ? state.data?.followerCount
    : summary.data?.followerCount;
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        aria-pressed={state.data?.isFollowing ?? false}
        disabled={
          follow.isPending ||
          (isAuthenticated &&
            (state.isPending ||
              state.isError ||
              (state.data?.isOwnAthlete === true && !state.data.isFollowing)))
        }
        onClick={() => {
          if (!isAuthenticated) {
            navigate(
              `/login?next=${encodeURIComponent(window.location.pathname)}`,
            );
            return;
          }
          if (state.data && user?.id)
            follow.mutate({
              athleteId,
              accountId: user.id,
              following: !state.data.isFollowing,
            });
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-60"
      >
        {follow.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className="h-4 w-4"
            fill={state.data?.isFollowing ? "currentColor" : "none"}
          />
        )}
        {state.data?.isOwnAthlete
          ? state.data.isFollowing
            ? "Unfollow your athlete profile"
            : "Your athlete profile"
          : isAuthenticated && state.isPending
            ? "Checking…"
            : state.data?.isFollowing
              ? "Following athlete"
              : "Follow athlete"}
        {count !== undefined && (
          <span className="text-xs text-white/60">
            {count.toLocaleString()} {count === 1 ? "follower" : "followers"}
          </span>
        )}
      </button>
      {(state.isError && isAuthenticated) ||
      (!isAuthenticated && summary.isError) ? (
        <button
          type="button"
          onClick={() => {
            void state.refetch();
            void summary.refetch();
          }}
          className="text-xs text-amber-200"
        >
          Unable to load following. Retry
        </button>
      ) : null}
      {follow.isError && (
        <p role="alert" className="max-w-xs text-xs text-rose-200">
          {follow.error instanceof Error
            ? follow.error.message
            : "Follow change failed. Please try again."}
        </p>
      )}
    </div>
  );
}
