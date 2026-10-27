import { BreadcrumbTrail } from "@/components/navigation/Breadcrumbs";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
import { PageSEO } from "@/seo/usePageSEO";
import { Button } from "@/components/ui/button";
import { RegistrationLogo } from "./sport-registration";
type Preview = {
  id: string;
  name: string;
  leagueName: string;
  organizationName: string;
  sportKey: string;
  startsOn: string;
  endsOn: string;
  open: boolean;
  closedReason?: string | null;
  instructions: string;
  linkedEventRequired: boolean;
  logoUrl?: string;
  headerUrl?: string;
};
type Athlete = {
  id: string;
  name: string;
  age: number | null;
  email: string;
  phone: string;
  contactName: string;
  enrollment?: { status: string; teamName: string | null } | null;
  imageUrl?: string;
};
export default function SeasonRegistration() {
  const params = new URLSearchParams(useSearch()),
    id = params.get("season") || "";
  const { user, isAuthenticated, isLoading } = useAuth();
  const valid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const preview = useQuery({
    queryKey: ["season-registration-public", id],
    enabled: valid,
    staleTime: 15000,
    retry: false,
    queryFn: async () =>
      unwrapSportData<Preview>(
        await apiRequest("GET", `/season-registration/${id}/preview`),
      ),
  });
  const data = preview.data,
    next = `/season-registration?season=${encodeURIComponent(id)}`;
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 text-foreground">
      <BreadcrumbTrail
        items={[
          { label: "Home", href: "/" },
          {
            label: "Registration",
            ...(data ? { href: `/sports/${data.sportKey}/registration` } : {}),
          },
          ...(data ? [{ label: data.name }] : []),
        ]}
      />
      <PageSEO
        title="Season registration"
        canonicalPath="/season-registration"
        noindex
      />
      <section className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
        {data?.headerUrl && (
          <img
            src={data.headerUrl}
            alt=""
            className="h-40 w-full object-cover sm:h-52"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <div className="space-y-5 p-5 sm:p-8">
          <p className="text-sm font-semibold text-muted-foreground">
            CORNER LEAGUE · SEASON REGISTRATION
          </p>
          <div className="flex items-center gap-4">
            {data && (
              <RegistrationLogo
                key={data.logoUrl}
                url={data.logoUrl}
                name={data.leagueName}
              />
            )}
            <h1 className="min-w-0 break-words text-3xl font-bold">
              {data?.name || "Join a season"}
            </h1>
          </div>
          {!valid && (
            <p role="alert">
              This registration link is incomplete. Ask the organizer for a new
              link.
            </p>
          )}
          {(preview.isLoading || isLoading) && (
            <p role="status">Loading season…</p>
          )}
          {preview.error && (
            <div role="alert">
              <p>{preview.error.message}</p>
              <Button variant="outline" onClick={() => void preview.refetch()}>
                Try again
              </Button>
            </div>
          )}
          {data && (
            <>
              <p className="font-semibold">
                {data.leagueName} · {data.organizationName}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.sportKey.replace(/-/g, " ")} · {data.startsOn} –{" "}
                {data.endsOn}
              </p>
              {!!data.instructions && (
                <p className="whitespace-pre-wrap break-words">
                  {data.instructions}
                </p>
              )}
              <p>
                Join this season’s unassigned player pool. Team assignments
                happen separately. No organizer account is required.
              </p>
              {data.linkedEventRequired && (
                <p>
                  This season requires confirmed registration in its linked
                  event first. Contact the organizer for that link.
                </p>
              )}
              {isLoading ? null : !isAuthenticated ? (
                !data.open ? (
                  <p role="status" className="rounded-xl bg-muted p-4">
                    {data.closedReason ||
                      "Registration is closed for this season."}
                  </p>
                ) : (
                  <Button asChild>
                    <Link href={`/auth?next=${encodeURIComponent(next)}`}>
                      Sign in or create an account
                    </Link>
                  </Button>
                )
              ) : (
                <RegistrationForm
                  key={`${user?.id}:${id}`}
                  id={id}
                  open={data.open}
                  closedReason={data.closedReason}
                  sport={data.sportKey}
                  account={String(user?.id)}
                  onRefresh={() => void preview.refetch()}
                />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
function RegistrationForm({
  id,
  sport,
  account,
  onRefresh,
  open = true,
  closedReason,
}: {
  id: string;
  sport: string;
  account: string;
  onRefresh: () => void;
  open?: boolean;
  closedReason?: string | null;
}) {
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState(""),
    [referredBy, setReferredBy] = useState(""),
    [notes, setNotes] = useState("");
  const writing = useRef(false);
  const profile = useQuery({
    queryKey: ["season-registration-athlete", account, id],
    staleTime: 0,
    gcTime: 0,
    retry: false,
    queryFn: async () =>
      unwrapSportData<Athlete | null>(
        await apiRequest("GET", `/season-registration/${id}/athlete`),
      ),
  });
  const p = profile.data,
    edit = `/create-racer-profile?athletes=1&sport=${encodeURIComponent(sport)}&next=${encodeURIComponent(`/season-registration?season=${id}`)}`,
    missing = [
      !p?.email?.trim() && "contact email",
      !p?.phone?.trim() && "phone number",
      p?.age == null && "date of birth",
    ].filter(Boolean),
    ready = missing.length === 0;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!p || !ready || writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await apiRequest("POST", `/team-management/seasons/${id}/register`, {
        profileId: p.id,
        referredBy,
        notes,
      });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
      onRefresh();
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  if (done)
    return (
      <div
        role="status"
        className="space-y-3 rounded-xl border border-border bg-muted p-4"
      >
        <h2 className="text-xl font-bold">You’re registered</h2>
        <p>
          Your place in this season’s player pool is confirmed. A confirmation
          email is queued, and your organizer can view your registration
          details.
        </p>
        <Button asChild variant="outline">
          <Link href="/notifications">View notifications</Link>
        </Button>
      </div>
    );
  if (profile.isPending)
    return <p role="status">Checking your {sport} athlete profile…</p>;
  if (profile.isError)
    return (
      <div role="alert">
        <p>{profile.error.message}</p>
        <Button onClick={() => void profile.refetch()}>Try again</Button>
      </div>
    );
  if (p?.enrollment) {
    const status = p.enrollment.status,
      active = ["registered", "assigned"].includes(status);
    return (
      <div
        role="status"
        className="space-y-3 rounded-xl border border-border bg-muted p-4"
      >
        <h2 className="text-xl font-bold">
          {active
            ? "You’re already registered"
            : status === "withdrawn"
              ? "Registration cancelled"
              : status === "invited"
                ? "Invitation awaiting acceptance"
                : "Join request pending"}
        </h2>
        <p>
          {active
            ? p.enrollment.teamName
              ? `Your team: ${p.enrollment.teamName}.`
              : "Your place in this season’s player pool is confirmed. Team assignment happens separately."
            : status === "withdrawn"
              ? "The organizer has removed your entry from this season. Contact them if you need to rejoin."
              : "Contact the organizer or use your invitation email to complete the next step."}
        </p>
        {active && (
          <Button asChild variant="outline">
            <Link href="/notifications">View notifications</Link>
          </Button>
        )}
      </div>
    );
  }
  if (!open)
    return (
      <p role="status" className="rounded-xl bg-muted p-4">
        {closedReason || "Registration is closed for this season."}
      </p>
    );
  if (!p)
    return (
      <div className="space-y-3">
        <p>Create your {sport} athlete profile before registering.</p>
        <Button asChild>
          <Link href={edit}>Create athlete profile</Link>
        </Button>
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-4 border-t border-border pt-5">
      <div className="flex items-center gap-4">
        <RegistrationLogo url={p.imageUrl} name={p.name} />
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{p.name}</h2>
          <p>
            {sport} athlete · Age {p.age ?? "not available"}
          </p>
        </div>
      </div>
      <dl className="grid gap-2 rounded-xl bg-muted p-4 text-sm">
        <div>
          <dt className="font-semibold">Contact</dt>
          <dd className="break-words">{p.contactName}</dd>
        </div>
        <div>
          <dt className="font-semibold">Email</dt>
          <dd className="break-all">{p.email || "Missing"}</dd>
        </div>
        <div>
          <dt className="font-semibold">Phone</dt>
          <dd>{p.phone || "Missing"}</dd>
        </div>
      </dl>
      <Link href={edit} className="block text-primary underline">
        Update athlete profile or contact details
      </Link>
      {!ready && (
        <p role="alert">
          Missing: {missing.join(", ")}. Update your athlete profile or private
          contact details, then return here.
        </p>
      )}
      <label className="block font-medium">
        Who referred you? (optional)
        <input
          maxLength={200}
          value={referredBy}
          disabled={busy}
          onChange={(e) => setReferredBy(e.target.value)}
          className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background p-3"
        />
      </label>
      <label className="block font-medium">
        Notes for the organizer (optional)
        <textarea
          maxLength={1500}
          value={notes}
          disabled={busy}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background p-3"
        />
      </label>
      <p className="text-sm text-muted-foreground">
        By registering, you share your athlete details, age and the contact
        information above with this league’s owners/admins for this season.
        These contact details are not published. No payment is collected here.
      </p>
      {!ready && (
        <p
          id="registration-blocked-reason"
          role="status"
          className="rounded-xl border border-border bg-muted p-3 text-sm"
        >
          Registration cannot be confirmed yet. Please add: {missing.join(", ")}
          .
        </p>
      )}
      <Button
        type="submit"
        aria-describedby={!ready ? "registration-blocked-reason" : undefined}
        disabled={busy || !ready}
      >
        {busy ? "Registering…" : "Confirm season registration"}
      </Button>
      {!!error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
