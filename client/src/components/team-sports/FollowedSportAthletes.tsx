import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { publicSportData, sportLabels } from "@/lib/sportRegistration";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";
export default function FollowedSportAthletes({
  username,
}: {
  username: string;
}) {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["followed-sport-athletes", username, page],
    queryFn: () =>
      publicSportData<{
        items: {
          id: string;
          name: string;
          sportKey: string;
          imageUrl: string | null;
          profileUrl: string;
        }[];
        total: number;
        hasNextPage: boolean;
      }>(
        `/sport-athlete-social/accounts/${encodeURIComponent(username)}/following?page=${page}&limit=12`,
      ),
    staleTime: 30000,
    retry: false,
  });
  if (q.isPending) return <p role="status">Loading followed sport athletes…</p>;
  if (q.isError)
    return (
      <p role="alert">
        Could not load followed sport athletes.{" "}
        <button onClick={() => q.refetch()}>Retry</button>
      </p>
    );
  if (!q.data.total) return null;
  return (
    <section className="cl-team-panel">
      <h2>Following sport athletes</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {q.data.items.map((p) => (
          <Link
            key={p.id}
            href={p.profileUrl}
            className="flex items-center gap-3 rounded-xl border border-cl-border p-3"
          >
            <img
              className="h-12 w-12 rounded-full object-cover"
              src={p.imageUrl || stockAvatar}
              alt=""
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = stockAvatar;
              }}
            />
            <span>
              <strong>{p.name}</strong>
              <small className="block text-cl-muted">
                {sportLabels[p.sportKey] || p.sportKey}
              </small>
            </span>
          </Link>
        ))}
      </div>
      {(page > 1 || q.data.hasNextPage) && (
        <div className="flex justify-between mt-4">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {page}</span>
          <button
            disabled={!q.data.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
