import ProfileListAvatar from "./ProfileListAvatar";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  parsePage,
  socialRequest,
  type Person,
  type UserFollow,
} from "@/lib/socialApi";
import {
  Pagination,
  SocialFailure,
  socialButton,
  socialBox,
} from "./SocialPosts";
export function UserSocialControls({ targetId }: { targetId: string }) {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["user-follow", user?.id, targetId],
    queryFn: () =>
      socialRequest<UserFollow>("GET", `me/users/${targetId}/follow`),
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });
  const change = useMutation({
    mutationFn: (action: {
      accountId: string | number;
      targetId: string;
      method: string;
      kind: string;
    }) =>
      socialRequest(
        action.method,
        `me/users/${action.targetId}/${action.kind}`,
      ),
    onSuccess: (_data, action) => {
      void cache.invalidateQueries({
        queryKey: ["user-follow", action.accountId, action.targetId],
      });
      void cache.invalidateQueries({ queryKey: ["user-social-summary"] });
      void cache.invalidateQueries({ queryKey: ["social-people"] });
      void cache.invalidateQueries({ queryKey: ["social-posts"] });
      if (action.kind === "block")
        for (const key of [
          "profile-athletes",
          "athlete-follow-state",
          "athlete-follow-summary",
          "direct-threads",
        ])
          void cache.invalidateQueries({ queryKey: [key] });
    },
  });
  const message = useMutation({
    mutationFn: () =>
      socialRequest<{ id: string }>("POST", "me/threads", {
        targetUserId: targetId,
      }),
    onSuccess: (data) => navigate(`/messages?thread=${data.id}`),
  });
  const doChange = (method: string, kind: string) => {
    if (user?.id) change.mutate({ accountId: user.id, targetId, method, kind });
  };
  if (String(user?.id) === targetId)
    return (
      <Link href="/settings" className={socialButton}>
        Edit profile
      </Link>
    );
  if (!isAuthenticated)
    return (
      <Link
        href={`/auth?next=${encodeURIComponent(location)}`}
        className={socialButton}
      >
        Sign in to follow or message
      </Link>
    );
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={
            query.isPending ||
            query.isError ||
            change.isPending ||
            query.data?.interactionBlocked
          }
          className={socialButton}
          aria-pressed={query.data?.isFollowing ?? false}
          onClick={() =>
            doChange(query.data?.isFollowing ? "DELETE" : "PUT", "follow")
          }
        >
          {query.data?.isFollowing ? "Following user" : "Follow user"}
        </button>
        <button
          className={socialButton}
          disabled={message.isPending || query.data?.interactionBlocked}
          onClick={() => message.mutate()}
        >
          {message.isPending ? "Opening…" : "Message"}
        </button>
        <button
          className={socialButton}
          disabled={change.isPending || query.isPending || query.isError}
          onClick={() => {
            if (
              query.data?.isBlocked ||
              window.confirm(
                "Block this user? This prevents new interactions and removes your user follows in both directions.",
              )
            )
              doChange(query.data?.isBlocked ? "DELETE" : "PUT", "block");
          }}
        >
          {query.data?.isBlocked ? "Unblock user" : "Block user"}
        </button>
      </div>
      {query.isError && (
        <>
          <SocialFailure error={query.error} />
          <button className={socialButton} onClick={() => void query.refetch()}>
            Retry
          </button>
        </>
      )}
      {query.data?.interactionBlocked && (
        <p className="mt-2 text-xs text-cl-muted">
          Interactions with this user are unavailable.
        </p>
      )}
      {change.isError && <SocialFailure error={change.error} />}
      {message.isError && <SocialFailure error={message.error} />}
    </div>
  );
}
function People({
  username,
  kind,
}: {
  username: string;
  kind: "followers" | "following";
}) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["social-people", username, kind, page],
    queryFn: async () =>
      parsePage<Person>(
        await socialRequest(
          "GET",
          `profiles/${encodeURIComponent(username)}/people?kind=${kind}&page=${page}&limit=20`,
        ),
        (item) =>
          typeof item?.username === "string" && typeof item?.id === "string",
      ),
    retry: false,
  });
  return (
    <section className={socialBox}>
      <h2 className="mb-3 font-bold">
        {kind === "followers" ? "Followers" : "Following users"}
      </h2>
      {query.isPending ? (
        <p role="status">Loading people…</p>
      ) : query.isError ? (
        <SocialFailure error={query.error} />
      ) : (
        <>
          {query.data.items.map((person) => (
            <div key={person.id} className="community-person-row">
              <Link
                href={`/profile/${encodeURIComponent(person.username)}`}
                className="community-person-identity"
              >
                <ProfileListAvatar key={person.profilePicture} src={person.profilePicture} name={person.firstName || person.username} />
                <span className="min-w-0"><strong className="block break-words">{[person.firstName,person.lastName].filter(Boolean).join(" ") || person.username}</strong><span className="block break-all text-sm text-cl-muted">@{person.username}</span></span>
              </Link>
              <UserSocialControls targetId={person.id} />
            </div>
          ))}
          {!query.data.items.length && (
            <p className="text-cl-muted">No users yet.</p>
          )}
          <Pagination
            page={page}
            hasNext={query.data.hasNextPage}
            setPage={setPage}
          />
        </>
      )}
    </section>
  );
}
export function PeoplePanel(props: {
  username: string;
  kind: "followers" | "following";
}) {
  return <People key={`${props.username}:${props.kind}`} {...props} />;
}
