import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Heart, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { racerResponseData } from "@/lib/selfRacerLookup";
import { sportOrganization } from "@/lib/sportNavigation";
import { sportVisual } from "@/lib/sportVisuals";
import { SocialFailure, Pagination, socialButton } from "./SocialPosts";
type State = { organizationId: string; isFollowing: boolean };
export function OrganizationFollowButton({
  organizationId,
}: {
  organizationId: string;
}) {
  const auth = useAuth(),
    cache = useQueryClient();
  const [location] = useLocation();
  const key = ["organization-follow", auth.user?.id, organizationId];
  const query = useQuery<State>({
    queryKey: key,
    queryFn: async () => {
      const r = racerResponseData(
        await apiRequest(
          "GET",
          `/community/me/organization-follows/${encodeURIComponent(organizationId)}`,
        ),
      );
      if (
        r.organizationId !== organizationId ||
        typeof r.isFollowing !== "boolean"
      )
        throw new Error("Unable to load organization follow state.");
      return r;
    },
    enabled: auth.isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });
  const change = useMutation({
    mutationFn: (on: boolean) =>
      apiRequest(
        on ? "PUT" : "DELETE",
        `/community/me/organization-follows/${encodeURIComponent(organizationId)}`,
      ),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: key }),
        cache.invalidateQueries({ queryKey: ["followed-organizations"] }),
      ]);
    },
  });
  if (!auth.isAuthenticated)
    return (
      <Link
        className={socialButton}
        href={`/auth?next=${encodeURIComponent(location)}`}
      >
        <Heart size={16} /> Follow organization
      </Link>
    );
  return (
    <div className="organization-follow-control">
      <button
        type="button"
        className={socialButton}
        aria-pressed={query.data?.isFollowing ?? false}
        disabled={query.isPending || query.isError || change.isPending}
        onClick={() => change.mutate(!query.data?.isFollowing)}
      >
        <Heart
          size={16}
          fill={query.data?.isFollowing ? "currentColor" : "none"}
        />
        {change.isPending
          ? "Saving…"
          : query.data?.isFollowing
            ? "Following organization"
            : "Follow organization"}
      </button>
      {query.isError && (
        <button
          type="button"
          className={socialButton}
          onClick={() => void query.refetch()}
        >
          Retry
        </button>
      )}
      {(query.isError || change.isError) && (
        <SocialFailure error={query.error || change.error} />
      )}
    </div>
  );
}
export function FollowedOrganizations({ username }: { username: string }) {
  const [page, setPage] = useState(1);
  const query = useQuery<{
    items: { id: string; name: string; sportKey: string }[];
    hasNextPage: boolean;
  }>({
    queryKey: ["followed-organizations", username, page],
    queryFn: async () => {
      const data = racerResponseData(
        await apiRequest(
          "GET",
          `/community/profiles/${encodeURIComponent(username)}/followed-organizations?page=${page}`,
        ),
      );
      if (
        !Array.isArray(data.items) ||
        typeof data.hasNextPage !== "boolean" ||
        !data.items.every(
          (o: any) =>
            typeof o.id === "string" &&
            typeof o.name === "string" &&
            typeof o.sportKey === "string",
        )
      )
        throw new Error("Unable to read organizations.");
      return data;
    },
    staleTime: 30_000,
    retry: false,
  });
  return (
    <section className="community-following-card">
      <h2>
        <Building2 size={21} /> Following organizations
      </h2>
      {query.isPending ? (
        <p role="status">Loading organizations…</p>
      ) : query.isError ? (
        <>
          <SocialFailure error={query.error} />
          <button className={socialButton} onClick={() => void query.refetch()}>
            Retry
          </button>
        </>
      ) : (
        <>
          {!query.data.items.length && (
            <p>
              No organizations followed yet. Follow an organization from its
              public page.
            </p>
          )}
          <div className="community-org-grid">
            {query.data.items.map((org) => (
              <article key={org.id}>
                <Link
                  className="font-bold"
                  href={sportOrganization(org.sportKey, org.id)}
                >
                  {org.name}
                </Link>
                <p>{sportVisual(org.sportKey).label}</p>
              </article>
            ))}
          </div>
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
