import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { myTeamInvitations, respondToTeamInvitation } from "@/lib/teamSports";
export default function TeamRosterInvites() {
  const auth = useAuth();
  return auth.isAuthenticated && auth.user?.id ? (
    <Invitations key={auth.user.id} account={String(auth.user.id)} />
  ) : null;
}
function Invitations({ account }: { account: string }) {
  const [page, setPage] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pending, setPending] = useState<{
      id: string;
      action: "accept" | "decline" | "leave";
      team: string;
    } | null>(null),
    cache = useQueryClient(),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const query = useQuery({
    queryKey: ["team-roster-invitations", account, page],
    queryFn: () => myTeamInvitations(page),
    staleTime: 15_000,
  });
  async function respond() {
    if (!pending || busy) return;
    const p = pending;
    setBusy(true);
    setError("");
    try {
      await respondToTeamInvitation(p.id, p.action);
      await cache.invalidateQueries({
        queryKey: ["team-roster-invitations", account],
      });
      await cache.invalidateQueries({ queryKey: ["team-season"] });
      if (alive.current) setPending(null);
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-2xl border border-white/15 bg-[#07111f] p-5">
      <h2 className="text-xl font-bold">Your teams & invitations</h2>
      <p className="text-slate-300">
        Accept an invitation to join a team. Your name, number and position can
        appear on its published roster. You can leave later. Only one active
        team per sport season is supported.
      </p>
      {query.isPending ? (
        <p role="status">Loading invitations…</p>
      ) : query.isError ? (
        <p role="alert">
          Unable to load invitations.{" "}
          <button className="underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <>
          {!query.data.items.length && (
            <p className="text-slate-400">No team invitations yet.</p>
          )}
          {query.data.items.map((r) => (
            <article
              key={r.id}
              className="space-y-3 border-t border-white/10 pt-4"
            >
              <h3 className="font-bold">
                {r.teamName} · {r.seasonName}
              </h3>
              <p>
                {r.organizationName} · {r.status} ·{" "}
                {r.number ? `#${r.number} ` : ""}
                {r.position}
              </p>
              <div className="flex flex-wrap gap-4">
                {(r.status === "pending"
                  ? ["accept", "decline"]
                  : ["leave"]
                ).map((action) => (
                  <button
                    key={action}
                    disabled={busy}
                    className="min-h-11 rounded-xl border border-white/20 px-5 capitalize disabled:opacity-40"
                    onClick={() =>
                      setPending({
                        id: r.id,
                        action: action as "accept" | "decline" | "leave",
                        team: r.teamName,
                      })
                    }
                  >
                    {action}
                  </button>
                ))}
                <Link
                  className="inline-flex min-h-11 items-center text-cyan-200 underline"
                  href={`/sports/${r.sportKey}/organizations/${r.organizationId}?season=${r.seasonId}`}
                >
                  View published season
                </Link>
              </div>
            </article>
          ))}
          <div className="flex items-center gap-4">
            <button
              disabled={page === 1 || busy}
              className="min-h-11 disabled:opacity-40"
              onClick={() => setPage((p) => p - 1)}
            >
              Previous invitations
            </button>
            <span>Page {page}</span>
            <button
              disabled={busy || page * 20 >= query.data.total}
              className="min-h-11 disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
            >
              Next invitations
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-orange-300">
          {error}
        </p>
      )}
      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm roster response"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"
        >
          <div className="max-w-md space-y-5 rounded-2xl border border-white/20 bg-[#07111f] p-6">
            <p>
              Confirm {pending.action} for {pending.team}?
            </p>
            <div className="flex gap-5">
              <button
                autoFocus
                disabled={busy}
                className="min-h-11"
                onClick={() => setPending(null)}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="min-h-11 text-cyan-200"
                onClick={() => void respond()}
              >
                {busy ? "Saving…" : "Confirm"}
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
