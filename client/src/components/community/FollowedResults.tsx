import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { RefreshCw, Trophy } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { racerResponseData } from "@/lib/selfRacerLookup";
import { Pagination, SocialFailure, socialButton } from "./SocialPosts";
type Row = {
  id: string;
  athleteName: string;
  eventName: string;
  divisionName: string;
  raceName: string;
  position: number | null;
  points: number | null;
  status: string | null;
  updatedAt: string;
  profileUrl: string;
  racerId: string;
};
export default function FollowedResults({
  username,
  isOwn,
}: {
  username: string;
  isOwn: boolean;
}) {
  const [page, setPage] = useState(1);
  const query = useQuery<{ items: Row[]; hasNextPage: boolean }>({
    queryKey: ["followed-results", username, page],
    queryFn: async ({ signal }) => {
      const response = await apiFetch(
        `/community/profiles/${encodeURIComponent(username)}/followed-results?page=${page}`,
        { signal, skipAuth: true, noRefresh: true, cache: "no-store" },
      );
      if (!response.ok) throw new Error("Unable to load followed results.");
      const data = racerResponseData(await response.json());
      if (
        !Array.isArray(data.items) ||
        typeof data.hasNextPage !== "boolean" ||
        !data.items.every(
          (r: any) =>
            typeof r.id === "string" &&
            typeof r.athleteName === "string" &&
            r.profileUrl === `/racer/${encodeURIComponent(r.racerId)}` &&
            Number.isFinite(Date.parse(r.updatedAt)),
        )
      )
        throw new Error("Invalid result feed.");
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
  return (
    <section className="community-following-card">
      <div className="community-section-heading">
        <div>
          <h2>
            <Trophy size={21} /> Latest results
          </h2>
          <p>
            {isOwn
              ? "Results from athletes you follow."
              : "Results from athletes this user follows."}
          </p>
        </div>
        <button
          type="button"
          aria-label="Refresh followed results"
          className={socialButton}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {query.isPending ? (
        <p role="status">Loading results…</p>
      ) : query.isError ? (
        <>
          <SocialFailure error={query.error} />
          <button className={socialButton} onClick={() => void query.refetch()}>
            Retry results
          </button>
        </>
      ) : (
        <>
          {!query.data.items.length && (
            <div className="community-empty-state">
              <Trophy size={30} />
              <h3>No result updates yet</h3>
              <p>
                Finalized results from followed racers will appear here when
                posted or corrected.
              </p>
            </div>
          )}
          <div className="community-result-feed">
            {query.data.items.map((row) => (
              <article key={row.id}>
                <div className="community-result-place">
                  {row.position != null ? `#${row.position}` : "—"}
                </div>
                <div>
                  <Link className="font-bold" href={row.profileUrl}>
                    {row.athleteName}
                  </Link>
                  <h3>{row.eventName}</h3>
                  <p>
                    {row.divisionName} · {row.raceName}
                  </p>
                  <p>
                    {row.status ?? "Result posted"}
                    {row.points != null ? ` · ${row.points} points` : ""}
                  </p>
                  <time dateTime={row.updatedAt}>
                    Updated {new Date(row.updatedAt).toLocaleString()}
                  </time>
                </div>
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
