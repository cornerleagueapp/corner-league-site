import { useRef, useState } from "react";
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
type Contact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  active: boolean;
  verified: boolean;
};
export function SeasonSmsContacts({
  season,
  profile,
  account,
  name,
  phone,
}: {
  season: string;
  profile: string;
  account: string;
  name?: string;
  phone?: string;
}) {
  const [open, setOpen] = useState(false),
    [contactName, setContactName] = useState(name || ""),
    [number, setNumber] = useState(phone || ""),
    [relationship, setRelationship] = useState("player"),
    [consent, setConsent] = useState(false),
    [challenge, setChallenge] = useState<{
      contactId: string;
      phone: string;
    } | null>(null),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const writing = useRef(false),
    base = `/team-sms/seasons/${season}`;
  const q = useQuery({
    queryKey: ["season-sms-contacts", account, season, profile],
    enabled: open,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const d = unwrapSportData<{
        seasonId: string;
        profileId: string;
        configured: boolean;
        consentText: string;
        organizationName: string;
        seasonName: string;
        items: Contact[];
      }>(await apiRequest("GET", `${base}/contacts/${profile}`));
      if (d.seasonId !== season || d.profileId !== profile)
        throw Error("SMS contacts do not match this athlete and season.");
      return d;
    },
  });
  async function run(action: "begin" | "verify" | "revoke", id?: string) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (action === "begin") {
        const d = unwrapSportData<{
          seasonId: string;
          contactId: string;
          phone: string;
        }>(
          await apiRequest("POST", `${base}/contacts`, {
            profileId: profile,
            name: contactName,
            phone: number,
            relationship,
            consent,
          }),
        );
        if (d.seasonId !== season) throw Error("Verification scope mismatch.");
        setChallenge(d);
        setCode("");
        setNotice(
          `Verification code sent to ${d.phone}. Enter the six-digit code within 10 minutes. Wait at least one minute before requesting another code.`,
        );
      } else if (action === "verify" && challenge) {
        await apiRequest(
          "POST",
          `${base}/contacts/${challenge.contactId}/verify`,
          { code },
        );
        setChallenge(null);
        setCode("");
        setConsent(false);
        setNotice(
          "Phone verified and team text alerts enabled for this season. This does not submit your registration.",
        );
        await q.refetch();
      } else if (action === "revoke" && id) {
        await apiRequest("POST", `${base}/contacts/${id}/revoke`, {});
        setNotice(
          "Text alerts disabled for this athlete/season contact. Messages already submitted may still arrive. Reply STOP to stop Corner League alerts to this number across all seasons.",
        );
        await q.refetch();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="space-y-3 rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5"
      aria-label="Team text alerts"
    >
      <h2 className="text-xl font-bold">Team text alerts</h2>
      <p className="text-sm text-muted-foreground">
        Optional updates for players, parents/guardians or another contact. Opt
        in and verify each number for this season. Your registration does not
        depend on SMS.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setError("");
          setNotice("");
          setOpen(true);
        }}
      >
        Manage text alerts
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!busy) setOpen(v);
        }}
      >
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            heading.current?.focus();
          }}
          className="max-h-[90dvh] w-[calc(100%_-_1.5rem)] max-w-xl overflow-y-auto rounded-2xl bg-card text-card-foreground"
        >
          <DialogHeader>
            <DialogTitle ref={heading} tabIndex={-1} className="pr-8">
              Team text alerts
            </DialogTitle>
            <DialogDescription>
              {q.data
                ? `${q.data.organizationName} · ${q.data.seasonName}`
                : "Manage verified contacts for this season."}
            </DialogDescription>
          </DialogHeader>
          {q.isPending && <p role="status">Loading SMS preferences…</p>}
          {q.isError && (
            <div role="alert">
              <p>{q.error.message}</p>
              <Button type="button" onClick={() => void q.refetch()}>
                Retry SMS preferences
              </Button>
            </div>
          )}
          {!!error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          {!!notice && (
            <p role="status" className="rounded-xl bg-muted p-3 text-sm">
              {notice}
            </p>
          )}
          {q.data && (
            <>
              {q.data.items.map((c) => (
                <article
                  key={c.id}
                  className="space-y-2 rounded-xl border border-border p-3"
                >
                  <p className="break-words font-semibold">
                    {c.name} · {c.relationship}
                  </p>
                  <p className="text-sm">
                    {c.phone} · {c.active ? "Alerts enabled" : "Not subscribed"}
                  </p>
                  {c.active && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void run("revoke", c.id)}
                    >
                      Disable alerts for {c.phone}
                    </Button>
                  )}
                </article>
              ))}
              {!q.data.items.length && (
                <p>No SMS contacts have been added for this season.</p>
              )}
              {!q.data.configured ? (
                <p role="status">
                  SMS coming soon. You can still register and receive existing
                  email notifications.
                </p>
              ) : (
                <>
                  {challenge ? (
                    <div className="space-y-3">
                      <p>Enter the code sent to {challenge.phone}.</p>
                      <label className="block font-medium">
                        Verification code
                        <input
                          aria-label="SMS verification code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={code}
                          disabled={busy}
                          onChange={(e) =>
                            setCode(e.target.value.replace(/\D/g, ""))
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background p-3 text-base"
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          disabled={busy || code.length !== 6}
                          onClick={() => void run("verify")}
                        >
                          {busy ? "Checking…" : "Verify & enable alerts"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            setChallenge(null);
                            setCode("");
                            setError("");
                          }}
                        >
                          Change number / resend
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 border-t border-border pt-4">
                      <h3 className="font-semibold">Add or verify a contact</h3>
                      <label className="block font-medium">
                        Contact full name
                        <input
                          aria-label="SMS contact full name"
                          value={contactName}
                          maxLength={120}
                          disabled={busy}
                          onChange={(e) => setContactName(e.target.value)}
                          autoComplete="name"
                          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background p-3 text-base"
                        />
                      </label>
                      <label className="block font-medium">
                        Contact type
                        <select
                          aria-label="SMS contact type"
                          value={relationship}
                          disabled={busy}
                          onChange={(e) => setRelationship(e.target.value)}
                          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background p-3 text-base"
                        >
                          <option value="player">Player</option>
                          <option value="parent">Parent</option>
                          <option value="guardian">Guardian</option>
                          <option value="other">Other contact</option>
                        </select>
                      </label>
                      <label className="block font-medium">
                        Phone number (+1)
                        <input
                          aria-label="SMS phone number"
                          type="tel"
                          autoComplete="tel"
                          value={number}
                          maxLength={20}
                          disabled={busy}
                          onChange={(e) => setNumber(e.target.value)}
                          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background p-3 text-base"
                        />
                      </label>
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 h-5 w-5 shrink-0"
                          checked={consent}
                          disabled={busy}
                          onChange={(e) => setConsent(e.target.checked)}
                        />
                        <span>{q.data.consentText}</span>
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Use a number you control. The number’s recipient must
                        agree and enter its verification code. Up to three
                        active contact numbers per athlete/season. Returning
                        next season requires opting in for that season again.
                      </p>
                      <Button
                        type="button"
                        disabled={
                          busy ||
                          !consent ||
                          contactName.trim().length < 2 ||
                          !number.trim()
                        }
                        onClick={() => void run("begin")}
                      >
                        {busy ? "Sending code…" : "Send verification code"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          <p className="text-sm">
            <a
              href="/terms#team-sms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              SMS terms and privacy
            </a>
          </p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
