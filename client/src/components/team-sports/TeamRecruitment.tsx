import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
const button =
  "min-h-11 rounded-xl border border-cl-border px-4 disabled:opacity-40";
const input =
  "mt-1 block min-h-11 w-full rounded-lg border border-cl-border bg-cl-surface p-2";
export default function TeamRecruitment({
  seasonId,
  teamId,
  sportKey,
}: {
  seasonId: string;
  teamId: string;
  sportKey: string;
}) {
  const auth = useAuth();
  return auth.isAuthenticated && auth.user?.id ? (
    <JoinTeam
      key={`${auth.user.id}:${seasonId}:${teamId}`}
      seasonId={seasonId}
      teamId={teamId}
      sportKey={sportKey}
      account={String(auth.user.id)}
    />
  ) : (
    <p className="mt-3 text-sm text-cl-muted">
      Sign in to request a place on this team.
    </p>
  );
}
function JoinTeam({
  seasonId,
  teamId,
  sportKey,
  account,
}: {
  seasonId: string;
  teamId: string;
  sportKey: string;
  account: string;
}) {
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const cache = useQueryClient();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const profiles = useQuery({
    queryKey: ["my-sport-profiles", account],
    queryFn: async () => {
      const rows = unwrapSportData<
        { id: string; sportKey: string; name: string }[]
      >(
        await apiRequest("GET", "/sport-registration/profiles/me", undefined, {
          refreshOn401: true,
        }),
      );
      if (!Array.isArray(rows)) throw new Error("Player profiles unavailable.");
      return rows;
    },
    staleTime: 15_000,
  });
  const profile = profiles.data?.find((p) => p.sportKey === sportKey);
  async function submit() {
    if (!profile || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = unwrapSportData<{ status: string }>(
        await apiRequest(
          "POST",
          `/team-sports/seasons/${encodeURIComponent(seasonId)}/join`,
          { teamId, profileId: profile.id, number, position },
          { refreshOn401: true },
        ),
      );
      await cache.invalidateQueries({
        queryKey: ["team-roster-invitations", account],
      });
      if (alive.current) {
        setMessage(
          `Team link: ${result.status}. Check Your teams & invitations for approval status or to withdraw.`,
        );
        setConfirm(false);
      }
    } catch (e) {
      if (alive.current) setMessage((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div className="mt-4 space-y-3 border-t border-cl-border pt-4">
      <p className="font-bold">Accepting join requests</p>
      {profiles.isPending ? (
        <p role="status">Loading your player profile…</p>
      ) : profiles.isError ? (
        <button className={button} onClick={() => void profiles.refetch()}>
          Retry player profile
        </button>
      ) : !profile ? (
        <p>Create your {sportKey} player profile in your account first.</p>
      ) : (
        <>
          <p className="text-sm text-cl-muted">
            Request as {profile.name}. Approval adds you to the roster; your
            name, number and position can appear publicly when the organizer
            publishes it. One active team per season.
          </p>
          <label className="block text-sm">
            Player number
            <input
              className={input}
              maxLength={20}
              value={number}
              disabled={busy}
              onChange={(e) => setNumber(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Preferred position
            <input
              className={input}
              maxLength={50}
              value={position}
              disabled={busy}
              onChange={(e) => setPosition(e.target.value)}
            />
          </label>
          {confirm ? (
            <div className="flex flex-wrap gap-3">
              <button
                disabled={busy}
                className={button}
                onClick={() => setConfirm(false)}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className={button}
                onClick={() => void submit()}
              >
                Confirm join request
              </button>
            </div>
          ) : (
            <button
              disabled={busy}
              className={button}
              onClick={() => setConfirm(true)}
            >
              Request to join
            </button>
          )}
        </>
      )}
      {message && (
        <p role="status" className="text-sm text-cl-muted">
          {message}
        </p>
      )}
    </div>
  );
}
export function CaptainRequests({
  seasonId,
  teamId,
  account,
}: {
  seasonId: string;
  teamId: string;
  account: string;
}) {
  const cache = useQueryClient();
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const path = `/team-sports/me/seasons/${encodeURIComponent(seasonId)}/teams/${encodeURIComponent(teamId)}/requests`;
  const requests = useQuery({
    queryKey: ["captain-join-requests", account, seasonId, teamId],
    queryFn: async () => {
      const result = unwrapSportData<{
        seasonId: string;
        teamId: string;
        version: number;
        items: { id: string; name: string; number: string; position: string }[];
      }>(await apiRequest("GET", path, undefined, { refreshOn401: true }));
      if (
        result.seasonId !== seasonId ||
        result.teamId !== teamId ||
        !Array.isArray(result.items)
      )
        throw new Error("Join requests do not match this team.");
      return result;
    },
    staleTime: 0,
  });
  const decide = async (id: string, action: "approve" | "decline") => {
    if (!requests.data || busy || !reason.trim()) {
      setError("Enter a decision reason first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiRequest(
        "POST",
        `${path}/${encodeURIComponent(id)}`,
        { version: requests.data.version, action, reason },
        { refreshOn401: true },
      );
      await requests.refetch();
      await cache.invalidateQueries({ queryKey: ["team-roster-invitations"] });
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  return (
    <div className="space-y-3 rounded-xl border border-cl-border p-4">
      <h4 className="font-bold">Captain: player join requests</h4>
      {requests.isPending ? (
        <p role="status">Loading requests…</p>
      ) : requests.isError ? (
        <p role="alert">
          Captain access may have changed.{" "}
          <button className={button} onClick={() => void requests.refetch()}>
            Refresh requests
          </button>
        </p>
      ) : (
        <>
          <label className="block text-sm">
            Decision reason
            <input
              className={input}
              maxLength={500}
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          {!requests.data?.items.length && <p>No pending join requests.</p>}
          {requests.data?.items.map((r) => (
            <div
              key={r.id}
              className="space-y-2 border-t border-cl-border pt-3"
            >
              <p>
                {r.name} {r.number ? `#${r.number}` : ""} {r.position}
              </p>
              <div className="flex flex-wrap gap-3">
                {(["approve", "decline"] as const).map((action) => (
                  <button
                    key={action}
                    disabled={busy || !reason.trim()}
                    className={button}
                    onClick={() => void decide(r.id, action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
