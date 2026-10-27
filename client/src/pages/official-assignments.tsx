import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
import { Button } from "@/components/ui/button";
import { PageSEO } from "@/seo/usePageSEO";
type Detail = {
  id: string;
  version: number;
  name: string;
  leagueName: string;
  organizationName: string;
  accessOpen: boolean;
  assignments: { id: string; gameId: string; slot: string; status: string }[];
  games: {
    id: string;
    name: string;
    startsAt: string;
    venue: string;
    status: string;
  }[];
};
export default function OfficialAssignments() {
  const { user, isAuthenticated, isLoading } = useAuth(),
    season = new URLSearchParams(window.location.search).get("season") || "";
  const valid = /^[a-f0-9-]{36}$/i.test(season),
    next = `/official-assignments?season=${encodeURIComponent(season)}`;
  const q = useQuery({
    queryKey: ["my-official-games", user?.id, season],
    enabled: valid && isAuthenticated,
    retry: false,
    staleTime: 30000,
    gcTime: 0,
    queryFn: async () =>
      unwrapSportData<Detail>(
        await apiRequest("GET", `/season-officials/${season}/mine`, undefined, {
          refreshOn401: true,
        }),
      ),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    writing = useRef(false);
  async function respond(assignmentId: string, action: string) {
    if (!q.data || writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await apiRequest("POST", `/season-officials/${season}/game-response`, {
        version: q.data.version,
        assignmentId,
        action,
      });
      await q.refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      writing.current = false;
    }
  }
  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8 text-cl-ink">
      <PageSEO
        title="My official assignments"
        canonicalPath="/official-assignments"
        noindex
      />
      <h1 className="text-3xl font-bold">My official assignments</h1>
      {valid && isAuthenticated && (
        <Button asChild>
          <a
            href={`https://admin.cornerleague.com/sign-in?next=${encodeURIComponent(`/my-schedule?season=${season}`)}`}
          >
            Open My Schedule in Corner League OS
          </a>
        </Button>
      )}
      {!valid ? (
        <p role="alert">
          Open the season link from your invitation or assignment notification.
        </p>
      ) : isLoading || q.isLoading ? (
        <p role="status">Loading assignments…</p>
      ) : !isAuthenticated ? (
        <Button asChild>
          <Link href={`/auth?next=${encodeURIComponent(next)}`}>
            Sign in to view assignments
          </Link>
        </Button>
      ) : q.error ? (
        <p role="alert">{q.error.message}</p>
      ) : (
        q.data && (
          <>
            <p className="text-lg">
              {q.data.organizationName} · {q.data.leagueName} · {q.data.name}
            </p>
            <p className="text-sm text-cl-muted">
              Times use {Intl.DateTimeFormat().resolvedOptions().timeZone}.
              Confirm each assignment after checking other commitments. Changed
              game times or venues need a new confirmation.
            </p>
            {!q.data.accessOpen && (
              <p>Season access has ended. These assignments are read-only.</p>
            )}
            {!q.data.assignments.length && (
              <p>
                No game assignments yet. Your organizer will notify you when
                assigned.
              </p>
            )}
            {q.data.assignments.map((a) => {
              const game = q.data!.games.find((g) => g.id === a.gameId);
              return (
                <article
                  key={a.id}
                  className="space-y-3 rounded-2xl border border-cl-border bg-cl-surface p-4"
                >
                  <h2 className="text-xl font-bold">
                    {game?.name || "Removed game"}
                  </h2>
                  <p>
                    {game
                      ? new Date(game.startsAt).toLocaleString(undefined, {
                          dateStyle: "full",
                          timeStyle: "short",
                        })
                      : "Schedule unavailable"}
                  </p>
                  <p>
                    {game?.venue || "Venue to be confirmed"} · {a.slot}
                  </p>
                  <p className="font-semibold">
                    {game?.status === "cancelled" ? "Cancelled" : a.status}
                  </p>
                  {game &&
                    game.status !== "cancelled" &&
                    q.data!.accessOpen && (
                      <div className="flex flex-wrap gap-3">
                        <Button
                          disabled={busy || a.status === "accepted"}
                          onClick={() => void respond(a.id, "accept")}
                        >
                          Confirm assignment
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy || a.status === "declined"}
                          onClick={() => void respond(a.id, "decline")}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                </article>
              );
            })}
          </>
        )
      )}
      {!!error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {valid && isAuthenticated && (
        <Button
          variant="outline"
          disabled={busy || q.isFetching}
          onClick={() => void q.refetch()}
        >
          Refresh assignments
        </Button>
      )}
    </main>
  );
}
