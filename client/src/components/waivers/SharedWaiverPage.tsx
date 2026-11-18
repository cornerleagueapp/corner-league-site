import { useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
import { Button } from "@/components/ui/button";
import { PageSEO } from "@/seo/usePageSEO";
import {
  SeasonWaiverSigning,
  type Waiver,
  type Waivers,
} from "./SeasonWaivers";

type Document = {
  organization: string;
  season: string;
  waiver: Omit<Waiver, "required" | "signature">;
};
type Match = {
  profileId: string;
  name: string;
  guardianRequired: boolean;
  revisionId: string;
  alreadySigned: boolean;
  signatureId: string | null;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-border bg-background p-3 text-base";

export function SharedWaiverPage({
  season,
  documentId,
  share,
}: {
  season: string;
  documentId: string;
  share: string;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const valid =
    uuid.test(season) && uuid.test(documentId) && /^[0-9a-f]{64}$/.test(share);
  const next =
    "/season-waiver-records?" +
    new URLSearchParams({ season, document: documentId, share });
  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 px-4 py-10 text-foreground">
      <PageSEO
        title="Sign a season waiver"
        canonicalPath="/season-waiver-records"
        noindex
      />
      {!valid ? (
        <p role="alert">
          This signing link is invalid. Ask your organizer for the full link.
        </p>
      ) : isLoading ? (
        <p role="status">Checking your account…</p>
      ) : !isAuthenticated || !user?.id ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-8">
          <h1 className="text-2xl font-bold">Sign a season waiver</h1>
          <p>
            Sign in to Corner League with a verified email to find your player
            and sign.
          </p>
          <Button asChild>
            <Link href={"/auth?next=" + encodeURIComponent(next)}>
              Sign in to continue
            </Link>
          </Button>
        </section>
      ) : (
        <SharedWaiverForm
          key={JSON.stringify([user.id, season, documentId, share])}
          account={String(user.id)}
          season={season}
          documentId={documentId}
          share={share}
        />
      )}
    </main>
  );
}

function SharedWaiverForm({
  season,
  documentId,
  share,
  account,
}: {
  season: string;
  documentId: string;
  share: string;
  account: string;
}) {
  const path =
    "/season-registration/" + season + "/waivers/shared/" + documentId;
  const q = useQuery({
    queryKey: ["shared-waiver", account, season, documentId, share],
    queryFn: async () =>
      unwrapSportData<Document>(await apiRequest("POST", path, { share })),
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [match, setMatch] = useState<{
    player: Match;
    fields: Record<string, string>;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const writing = useRef(false);
  const [error, setError] = useState("");
  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (writing.current || name.trim().length < 2) return;
    writing.current = true;
    setBusy(true);
    setError("");
    const fields = {
      share,
      playerName: name.trim(),
      ...(code.trim() ? { playerCode: code.trim().toLowerCase() } : {}),
      ...(birthDate ? { athleteBirthDate: birthDate } : {}),
    };
    try {
      const player = unwrapSportData<Match>(
        await apiRequest("POST", path + "/lookup", fields),
      );
      if (player.revisionId !== q.data?.waiver.revisionId) {
        await q.refetch();
        setError(
          "The organizer updated this waiver. Find your player again to review the current version.",
        );
        return;
      }
      setMatch({ player, fields });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not find your player.");
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  if (q.isPending) return <p role="status">Loading waiver…</p>;
  if (q.isError)
    return (
      <section role="alert" className="space-y-4">
        <p>{q.error.message}</p>
        <Button type="button" onClick={() => void q.refetch()}>
          Try again
        </Button>
      </section>
    );

  const player = match?.player;
  const data: Waivers | undefined =
    player && player.revisionId === q.data.waiver.revisionId
      ? {
          seasonId: season,
          profileId: player.profileId,
          guardianRequired: player.guardianRequired,
          blockedReason: null,
          items: [{ ...q.data.waiver, required: false, signature: null }],
          complete: player.alreadySigned,
        }
      : undefined;
  return (
    <div className="space-y-4">
      <header className="space-y-2 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8">
        <p className="text-sm font-semibold text-muted-foreground">
          {q.data.organization} · {q.data.season}
        </p>
        <h1 className="break-words text-2xl font-bold">
          {q.data.waiver.title}
        </h1>
        <p>
          This link is for signing a waiver. You don’t need to register again.
        </p>
      </header>
      {data && player && match ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              Signing for <strong>{player.name}</strong>
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMatch(null)}
            >
              Find a different player
            </Button>
          </div>
          <SeasonWaiverSigning
            key={player.profileId + ":" + player.revisionId}
            account={account}
            season={season}
            profile={player.profileId}
            query={{
              data,
              error: null,
              isPending: false,
              isError: false,
              refetch: async () => {
                const refreshed = await q.refetch();
                if (refreshed.data?.waiver.revisionId !== player.revisionId) {
                  setMatch(null);
                  setError(
                    "The waiver changed. Find your player again before signing.",
                  );
                }
              },
            }}
            shared={{
              path,
              fields: match.fields,
              alreadySigned: player.alreadySigned,
              signatureId: player.signatureId,
            }}
          />
        </>
      ) : (
        <form
          onSubmit={(e) => void lookup(e)}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8"
        >
          <h2 className="text-xl font-semibold">Find your player</h2>
          <p className="text-sm text-muted-foreground">
            Enter the full name used by your organizer. If you were given a
            player code, include it below.
          </p>
          <label className="block font-medium">
            Player full name
            <input
              required
              minLength={2}
              maxLength={100}
              value={name}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block font-medium">
            Player code (if provided)
            <input
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              maxLength={16}
              pattern="[A-Fa-f0-9]{16}"
              value={code}
              disabled={busy}
              onChange={(e) => setCode(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block font-medium">
            Player date of birth (if their profile isn’t linked)
            <input
              type="date"
              value={birthDate}
              disabled={busy}
              onChange={(e) => setBirthDate(e.target.value)}
              className={fieldClass}
            />
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              This determines whether a parent or guardian needs to sign.
            </span>
          </label>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || name.trim().length < 2}>
            {busy ? "Checking roster…" : "Find player"}
          </Button>
        </form>
      )}
    </div>
  );
}
