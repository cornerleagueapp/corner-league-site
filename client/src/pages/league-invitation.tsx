import { readLeagueInvitation, readInvitationAccount } from "@/lib/leagueInvitation";
import { PageSEO } from "@/seo/usePageSEO";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";

export default function LeagueInvitation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const season = params.get("season") || "", token = params.get("token") || "";
  const valid = /^[a-f0-9-]{36}$/i.test(season) && /^[a-f0-9]{64}$/i.test(token);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const base = `/team-invitations/${season}`;
  const preview = useQuery({ queryKey: ["league-invitation", season, token], enabled: valid, retry: false, staleTime: 0, queryFn: () => readLeagueInvitation(season, token) });
  const account = useQuery({ queryKey: ["league-invitation-account", user?.id, season, token], enabled: valid && isAuthenticated, retry: false, staleTime: 0, queryFn: () => readInvitationAccount(season, token) });
  const invite = preview.data;
  async function respond(action: "accept" | "decline") {
    if (busy) return;
    setBusy(true); setError("");
    try { await apiRequest("POST", `${base}/respond`, { token, action }); await preview.refetch(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  const next = `/league-invitation?season=${encodeURIComponent(season)}&token=${encodeURIComponent(token)}`;
  return <main className="mx-auto w-full max-w-2xl px-4 py-10"><PageSEO title="League invitation" canonicalPath="/league-invitation" noindex /><meta name="referrer" content="no-referrer" /><section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8">
    <p className="text-sm font-semibold text-muted-foreground">CORNER LEAGUE · PLAYER INVITATION</p>
    <h1 className="mt-3 text-3xl font-bold">{invite ? `Join ${invite.organizationName}` : "Your league invitation"}</h1>
    {!valid && <p role="alert" className="mt-4">This invitation link is incomplete. Ask your organizer to resend it.</p>}
    {(preview.isLoading || isLoading) && <p role="status" className="mt-4">Loading your invitation…</p>}
    {!!(error || preview.error || account.error) && <p role="alert" className="mt-4 text-destructive">{error || (preview.error || account.error)?.message}</p>}
    {invite && <><p className="mt-4">{invite.recipientName ? `${invite.recipientName}, ` : ""}{invite.inviterName} invited you to {invite.teamName} for {invite.seasonName}.</p><p className="mt-2 text-sm text-muted-foreground">Use the account matching {invite.emailHint}. This is a player invitation; you do not need to create an organization.</p>
    <p className="my-4 font-semibold">Invitation: {invite.status}</p>
    {invite.role !== "athlete" ? <p>Open the original coaching invitation in Corner League OS.</p> : !isAuthenticated ? <Button asChild><Link href={`/auth?next=${encodeURIComponent(next)}`}>Sign in or create an account</Link></Button> : invite.status === "pending" ? <>
      {account.data && !account.data.matchesEmail && <p role="alert">Sign out and return to this link using the invited email address.</p>}
      {account.data?.matchesEmail && !account.data.verified && <div className="my-4"><p>Verify your email before accepting, then sign in again from this link.</p><Button className="mt-3" disabled={busy} onClick={async () => { setBusy(true); try { await apiRequest("POST", "/team-management/me/verify-email", {}); setError("Verification email requested. Check your inbox."); } catch(e) { setError((e as Error).message); } finally {setBusy(false);} }}>Send verification email</Button></div>}
      <div className="flex flex-wrap gap-3"><Button disabled={busy || !account.data?.matchesEmail || !account.data?.verified} onClick={() => void respond("accept")}>Accept invitation</Button><Button variant="outline" disabled={busy || !account.data?.matchesEmail || !account.data?.verified} onClick={() => void respond("decline")}>Decline</Button></div>
    </> : invite.status === "accepted" ? <div><p>You have joined this season. Your player membership does not grant organizer access.</p><Button className="mt-4" asChild><Link href={`/create-racer-profile?athletes=1&sport=${encodeURIComponent(invite.sport)}`}>Manage your athlete profile</Link></Button></div> : <p>Contact the organizer if you need a new invitation.</p>}
    </>}
  </section></main>;
}
