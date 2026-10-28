import { loadWaiverReceipt, saveWaiverReceipt } from "@/lib/waiverReceipts";
import { useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
type Signature = {
  id: string;
  revisionId: string;
  signedAt: string;
  signerName: string;
  capacity: string;
};
type Waiver = {
  id: string;
  revisionId: string;
  revision: number;
  title: string;
  text: string;
  consent: string;
  contentHash: string;
  required: boolean;
  signature: Signature | null;
};
type Waivers = {
  seasonId: string;
  profileId: string;
  guardianRequired: boolean;
  blockedReason: string | null;
  items: Waiver[];
  complete: boolean;
};
export function useSeasonWaivers(
  season: string,
  profile: string | undefined,
  account: string,
) {
  return useQuery({
    queryKey: ["season-waivers", account, season, profile],
    enabled: !!profile && !!account,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const d = unwrapSportData<Waivers>(
        await apiRequest(
          "GET",
          `/season-registration/${season}/waivers/me/${profile}`,
        ),
      );
      if (
        d.seasonId !== season ||
        d.profileId !== profile ||
        !Array.isArray(d.items)
      )
        throw Error(
          "Waiver information does not match this athlete and season.",
        );
      return d;
    },
  });
}
export function waiverBlockedReason(query: {
  isPending: boolean;
  isFetching?: boolean;
  isError: boolean;
  data?: Waivers;
}) {
  return query.isPending || query.isFetching
    ? "Checking required season waivers…"
    : query.isError
      ? "Season waivers could not load. Use Try again below."
      : !query.data?.complete
        ? "Review and sign the required season waivers below before confirming registration."
        : null;
}
export function SeasonWaiverSigning({
  season,
  profile,
  account,
  query,
  readOnly = false,
}: {
  season: string;
  profile: string;
  account: string;
  query: ReturnType<typeof useSeasonWaivers>;
  readOnly?: boolean;
}) {
  const [selected, setSelected] = useState<Waiver | null>(null),
    [name, setName] = useState(""),
    [relationship, setRelationship] = useState(""),
    [consent, setConsent] = useState(false),
    [authority, setAuthority] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [showHistory, setShowHistory] = useState(false),
    [page, setPage] = useState(1);
  const writing = useRef(false);
  const reasonId = useId();
  const history = useQuery({
    queryKey: ["my-waiver-history", account, season, profile, page],
    enabled: showHistory,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const d = unwrapSportData<{
        seasonId: string;
        profileId: string;
        items: (Signature & { title: string; revision: number })[];
        total: number;
        limit: number;
      }>(
        await apiRequest(
          "GET",
          `/season-registration/${season}/waivers/profiles/${profile}/history?page=${page}`,
        ),
      );
      if (d.seasonId !== season || d.profileId !== profile)
        throw Error("Signing history does not match this athlete and season.");
      return d;
    },
  });
  function review(w: Waiver) {
    setSelected(w);
    setName("");
    setRelationship("");
    setConsent(false);
    setAuthority(false);
    setError("");
  }
  async function sign() {
    if (!selected || writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await apiRequest(
        "POST",
        `/season-registration/${season}/waivers/revisions/${selected.revisionId}/sign`,
        {
          profileId: profile,
          signerName: name,
          relationship,
          capacity: query.data?.guardianRequired ? "guardian" : "athlete",
          consentAccepted: consent,
          authorityConfirmed: authority,
          contentHash: selected.contentHash,
        },
      );
      setSelected(null);
      await query.refetch();
      if (showHistory) await history.refetch();
    } catch (e) {
      setError((e as Error).message);
      void query.refetch();
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  async function receipt(id: string) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      saveWaiverReceipt(await loadWaiverReceipt(season, id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  const stale =
      !!selected &&
      !query.data?.items.some((w) => w.revisionId === selected.revisionId),
    guardian = query.data?.guardianRequired;
  return (
    <section
      id="season-waivers"
      className="space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5"
      aria-label="Season waivers"
    >
      <div>
        <h2 className="text-xl font-bold">Season waivers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review each document before signing. Your signing record is private.
          Signing does not submit your season registration.
        </p>
      </div>
      {query.isPending && <p role="status">Loading season waivers…</p>}
      {query.isError && (
        <div role="alert">
          <p>{query.error.message}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            Try again
          </Button>
        </div>
      )}
      {query.data && (
        <>
          {!query.data.items.length && (
            <p>No active waivers are required for this season.</p>
          )}
          {query.data.blockedReason && !readOnly && (
            <p role="status" className="rounded-xl bg-muted p-3">
              {query.data.blockedReason}
            </p>
          )}
          {query.data.items.map((w) => (
            <article
              key={w.revisionId}
              className="space-y-3 rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="min-w-0 break-words font-semibold">{w.title}</h3>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                  Revision {w.revision} · {w.required ? "Required" : "Optional"}
                </span>
              </div>
              {w.signature ? (
                <>
                  <p className="text-sm">
                    Signed by {w.signature.signerName} ·{" "}
                    {new Date(w.signature.signedAt).toLocaleString()}
                  </p>
                  {guardian && w.signature.capacity !== "guardian" && (
                    <p role="alert">
                      Athlete details changed after signing. Ask the organizer
                      to publish a new revision for guardian signing.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void receipt(w.signature!.id)}
                  >
                    Download signed PDF
                  </Button>
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {w.required ? "Signature required" : "Optional signature"}
                  </span>
                  <Button
                    type="button"
                    disabled={busy || readOnly || !!query.data?.blockedReason}
                    onClick={() => review(w)}
                  >
                    Review & sign
                  </Button>
                </div>
              )}
            </article>
          ))}
        </>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setShowHistory((v) => !v);
          setError("");
        }}
      >
        {" "}
        {showHistory ? "Hide signing history" : "View signing history"}
      </Button>
      {showHistory && (
        <div className="space-y-3">
          <h3 className="font-semibold">Your signing history</h3>
          {history.isPending && <p role="status">Loading signing history…</p>}
          {history.isError && (
            <div role="alert">
              <p>{history.error.message}</p>
              <Button type="button" onClick={() => void history.refetch()}>
                Retry signing history
              </Button>
            </div>
          )}
          {history.data && (
            <>
              {!history.data.items.length && <p>No signing records yet.</p>}
              {history.data.items.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="font-semibold">
                      {s.title} · revision {s.revision}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(s.signedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void receipt(s.id)}
                  >
                    Download PDF
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 1 || history.isFetching}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous records
                </Button>
                <span className="self-center text-sm">Page {page}</span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    page * history.data.limit >= history.data.total ||
                    history.isFetching
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next records
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      {!!error && !selected && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !busy) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%_-_1.5rem)] max-w-2xl overflow-y-auto rounded-2xl bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="break-words pr-8">
              {selected?.title}
            </DialogTitle>
            <DialogDescription>
              Revision {selected?.revision}. Read the complete document before
              signing.
            </DialogDescription>
          </DialogHeader>
          <div
            className="max-h-[35dvh] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-muted p-4 text-sm leading-relaxed"
            tabIndex={0}
            aria-label="Waiver document text"
          >
            {selected?.text}
          </div>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {selected?.consent}
          </p>
          <p className="font-semibold">
            {guardian
              ? "A parent or legal guardian must sign for this athlete under 18."
              : "Sign as the athlete."}
          </p>
          <label className="block font-medium">
            {guardian ? "Parent/guardian full name" : "Your full name"}
            <input
              aria-label="Signer full name"
              value={name}
              maxLength={160}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background p-3 text-base"
              autoComplete="name"
            />
          </label>
          {guardian && (
            <label className="block font-medium">
              Relationship to athlete
              <select
                aria-label="Relationship to athlete"
                value={relationship}
                disabled={busy}
                onChange={(e) => setRelationship(e.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background p-3 text-base"
              >
                <option value="">Choose relationship</option>
                <option value="Parent">Parent</option>
                <option value="Legal guardian">Legal guardian</option>
              </select>
            </label>
          )}
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={consent}
              disabled={busy}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            I have read this document and consent to its terms and use of my
            typed name as my electronic signature.
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={authority}
              disabled={busy}
              onChange={(e) => setAuthority(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            {guardian
              ? "I am the athlete’s parent/legal guardian and am authorized to sign for this athlete."
              : "I am this athlete and am signing for myself."}
          </label>
          {stale && (
            <p role="alert" className="text-destructive">
              The organizer updated this document. Close it and review the
              current revision before signing.
            </p>
          )}
          {!!error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          {(!consent ||
            !authority ||
            name.trim().length < 2 ||
            (guardian && !relationship)) && (
            <p
              id={reasonId}
              role="status"
              className="text-sm text-muted-foreground"
            >
              Enter the signer’s full name
              {guardian
                ? ", choose their relationship to the athlete,"
                : ""}{" "}
              and select both confirmations to enable signing.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              aria-describedby={reasonId}
              disabled={
                busy ||
                stale ||
                !consent ||
                !authority ||
                name.trim().length < 2 ||
                (!!guardian && !relationship)
              }
              onClick={() => void sign()}
            >
              {busy ? "Recording signature…" : "Sign document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
