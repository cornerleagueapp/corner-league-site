import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
import { Button } from "@/components/ui/button";
import { PageSEO } from "@/seo/usePageSEO";
type Invite = {
  organizationName: string;
  leagueName: string;
  seasonName: string;
  name: string;
  role: string;
  status: string;
  expired: boolean;
  expiresAt: string;
};
export default function OfficialInvitation() {
  const { user, isAuthenticated, isLoading } = useAuth(),
    params = new URLSearchParams(window.location.search),
    season = params.get("season") || "",
    token = params.get("token") || "";
  const valid =
      /^[a-f0-9-]{36}$/i.test(season) && /^[a-f0-9]{64}$/i.test(token),
    next = `/official-invitation?season=${encodeURIComponent(season)}&token=${encodeURIComponent(token)}`;
  const q = useQuery({
    queryKey: ["official-invitation", user?.id, season, token],
    enabled: valid,
    retry: false,
    gcTime: 0,
    staleTime: 0,
    queryFn: async () =>
      unwrapSportData<Invite>(
        await apiRequest(
          "POST",
          `/season-officials/${season}/preview`,
          { token },
          { refreshOn401: true },
        ),
      ),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    writing = useRef(false);
  async function respond(action: string) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await apiRequest("POST", `/season-officials/${season}/respond`, {
        token,
        action,
      });
      await q.refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  const d = q.data;
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <PageSEO
        title="Official invitation"
        canonicalPath="/official-invitation"
        noindex
      />
      <meta name="referrer" content="no-referrer" />
      <section className="space-y-5 rounded-2xl border border-cl-border bg-cl-surface p-5 text-cl-ink sm:p-8">
        <p className="text-sm font-semibold text-cl-muted">
          CORNER LEAGUE · OFFICIAL INVITATION
        </p>
        <h1 className="text-3xl font-bold">
          {d ? `Join ${d.organizationName}` : "Your official invitation"}
        </h1>
        {!valid && (
          <p role="alert">
            This invitation link is incomplete. Ask your organizer to resend it.
          </p>
        )}
        {(q.isLoading || isLoading) && <p role="status">Loading invitation…</p>}
        {(q.error || error) && (
          <p role="alert" className="text-destructive">
            {error || q.error?.message}
          </p>
        )}
        {d && (
          <>
            <p>
              {d.name}, you are invited as {d.role} for {d.leagueName} ·{" "}
              {d.seasonName}.
            </p>
            <p>
              Use the verified email address that received the invitation. You
              do not need to create an organization. Access is limited to your
              official assignments for this season.
            </p>
            <p className="font-semibold">
              {d.expired
                ? "Invitation or season access expired"
                : `Invitation: ${d.status}`}
            </p>
            {!isAuthenticated ? (
              <Button asChild>
                <Link href={`/auth?next=${encodeURIComponent(next)}`}>
                  Sign in or create an account
                </Link>
              </Button>
            ) : d.status === "active" ? (
              <Button asChild>
                <Link href={`/official-assignments?season=${season}`}>
                  View my assignments
                </Link>
              </Button>
            ) : d.status === "invited" && !d.expired ? (
              <>
                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={busy}
                    onClick={() => void respond("accept")}
                  >
                    Accept invitation
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void respond("decline")}
                  >
                    Decline
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await apiRequest(
                        "POST",
                        "/team-management/me/verify-email",
                        {},
                      );
                      setError(
                        "Verification email requested. Check your inbox, verify, then sign in again using this link.",
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Send account verification email
                </Button>
              </>
            ) : (
              <p>Ask the organizer for a new invitation if you need to join.</p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
