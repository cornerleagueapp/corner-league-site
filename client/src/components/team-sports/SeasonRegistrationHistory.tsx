import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
type Entry = {
  id: string;
  seasonId: string;
  name: string;
  leagueName: string;
  organizationName: string;
  sportKey: string;
  status: string;
  teamName: string | null;
  startsOn: string;
  endsOn: string;
};
export default function SeasonRegistrationHistory({
  account,
}: {
  account: string;
}) {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["season-enrollment-history", account, page],
    queryFn: async () =>
      unwrapSportData<{ items: Entry[]; total: number }>(
        await apiRequest(
          "GET",
          `/season-registration/me/registrations?page=${page}`,
        ),
      ),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  return (
    <section className="min-w-0 rounded-2xl border border-cl-border bg-cl-surface p-5">
      <h2 className="text-xl font-bold">Your league & season registrations</h2>
      {q.isPending ? (
        <p role="status">Loading season registrations…</p>
      ) : q.isError ? (
        <div role="alert">
          <p>Season registrations could not load.</p>
          <button
            type="button"
            className="min-h-11 underline"
            onClick={() => void q.refetch()}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {!q.data.items.length && (
            <p className="mt-3 text-cl-muted">No season registrations yet.</p>
          )}
          {q.data.items.map((e) => (
            <article
              key={e.id}
              className="mt-4 space-y-2 border-t border-cl-border pt-4"
            >
              <h3 className="break-words font-bold">
                {e.leagueName} · {e.name}
              </h3>
              <p className="text-sm text-cl-muted">
                {e.organizationName} · {e.sportKey.replace(/-/g, " ")} ·{" "}
                {e.startsOn} – {e.endsOn}
              </p>
              <p>
                {e.status === "assigned"
                  ? `Assigned to ${e.teamName || "a team"}`
                  : e.status === "registered"
                    ? "Registered · awaiting team assignment"
                    : e.status === "withdrawn"
                      ? "Withdrawn"
                      : "No longer in the player pool"}
              </p>
              <Link
                className="inline-flex min-h-11 items-center text-cl-accent underline"
                href={`/season-registration?season=${encodeURIComponent(e.seasonId)}`}
              >
                View season registration
              </Link>
            </article>
          ))}
          {(page > 1 || q.data.total > 20) && (
            <nav
              className="mt-4 flex gap-5"
              aria-label="Season registration pages"
            >
              <button
                disabled={page === 1 || q.isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                disabled={page * 20 >= q.data.total || q.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
