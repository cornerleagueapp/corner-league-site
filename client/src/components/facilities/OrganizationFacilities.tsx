import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { publicSportData, unwrapSportData } from "@/lib/sportRegistration";
type Facility = {
  id: string;
  name: string;
  kind: string;
  location: string;
  description: string;
  timeZone: string;
  capacity: number;
  opensAt: string;
  closesAt: string;
  policy: string;
  revision: number;
};
type Reservation = {
  id: string;
  facilityId: string;
  accountName: string;
  startsAt: string;
  endsAt: string;
  units: number;
  status: string;
  revision: number;
  reason: string;
  acceptedPolicy: string;
  checkedInAt: string | null;
};
type Page<T> = {
  organizationId: string;
  items: T[];
  total: number;
  hasNextPage: boolean;
};
type Availability = {
  facilityId: string;
  capacity: number;
  booked: { startsAt: string; endsAt: string; units: number }[];
  closures: { startsAt: string; endsAt: string }[];
};
const input =
  "mt-2 block min-h-11 w-full rounded-xl border border-cl-border bg-cl-surface p-3";
const button =
  "min-h-11 rounded-xl border border-cl-border px-4 py-2 disabled:opacity-50";
const panel = "mt-5 rounded-2xl border border-cl-border bg-cl-surface p-5";
export default function OrganizationFacilities({
  organizationId,
}: {
  organizationId: string;
}) {
  const auth = useAuth();
  return (
    <Facilities
      key={`${organizationId}:${auth.user?.id ?? "public"}`}
      org={organizationId}
    />
  );
}
function Facilities({ org }: { org: string }) {
  const auth = useAuth(),
    cache = useQueryClient(),
    alive = useRef(true),
    writing = useRef(false),
    attempt = useRef<{ key: string; id: string }>();
  const [page, setPage] = useState(1),
    [ownPage, setOwnPage] = useState(1),
    [selected, setSelected] = useState<Facility>(),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [units, setUnits] = useState("1"),
    [purpose, setPurpose] = useState(""),
    [accepted, setAccepted] = useState(false),
    [availability, setAvailability] = useState<Availability>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [cancelReason, setCancelReason] = useState("");
  const base = `/facilities/organizations/${org}`,
    key = ["facilities", org, auth.user?.id ?? "public"];
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const catalog = useQuery<Page<Facility>>({
    queryKey: [...key, "catalog", page],
    queryFn: async () => {
      const p = await publicSportData<Page<Facility>>(
        `${base}?page=${page}&limit=12`,
      );
      if (p.organizationId !== org)
        throw new Error("Organization changed. Reload this page.");
      return p;
    },
  });
  const own = useQuery<Page<Reservation>>({
    queryKey: [...key, "mine", ownPage],
    enabled: !!auth.user,
    queryFn: async () => {
      const p = unwrapSportData<Page<Reservation>>(
        await (
          await apiRequest(
            "GET",
            `${base}/me/reservations?page=${ownPage}&limit=12`,
          )
        ).json(),
      );
      if (p.organizationId !== org)
        throw new Error("Organization changed. Reload this page.");
      return p;
    },
  });
  const display = (v: string, zone?: string) =>
    new Date(v).toLocaleString(
      undefined,
      zone ? { timeZone: zone } : undefined,
    );
  function select(f: Facility) {
    setSelected(f);
    setStart("");
    setEnd("");
    setUnits("1");
    setPurpose("");
    setAccepted(false);
    setAvailability(undefined);
    setError("");
    setNotice("");
    attempt.current = undefined;
  }
  function times() {
    const a = new Date(start),
      b = new Date(end);
    if (
      !start ||
      !end ||
      !Number.isFinite(a.getTime()) ||
      !Number.isFinite(b.getTime()) ||
      a >= b
    )
      throw new Error("Choose a valid start and end time.");
    return { startsAt: a.toISOString(), endsAt: b.toISOString() };
  }
  async function perform(fn: () => Promise<void>) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      writing.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function check() {
    if (!selected) return;
    await perform(async () => {
      const t = times();
      const result = await publicSportData<Availability>(
        `${base}/${selected.id}/availability?from=${encodeURIComponent(t.startsAt)}&to=${encodeURIComponent(t.endsAt)}`,
      );
      if (result.facilityId !== selected.id)
        throw new Error("Facility changed. Try again.");
      if (alive.current) setAvailability(result);
    });
  }
  async function submit() {
    if (!selected || !accepted) return;
    await perform(async () => {
      const t = times(),
        body = {
          ...t,
          units: Number(units),
          purpose,
          policyRevision: selected.revision,
          acceptedPolicy: true,
        };
      const fingerprint = JSON.stringify({ facility: selected.id, ...body });
      if (attempt.current?.key !== fingerprint)
        attempt.current = { key: fingerprint, id: crypto.randomUUID() };
      await apiRequest("POST", `${base}/${selected.id}/reservations`, {
        ...body,
        requestId: attempt.current.id,
      });
      attempt.current = undefined;
      if (alive.current) {
        setNotice(
          "Request received. This time is reserved only after the organization approves it.",
        );
        setAccepted(false);
        await cache.invalidateQueries({ queryKey: key });
      }
    });
  }
  const cancel = (r: Reservation) =>
    void perform(async () => {
      await apiRequest("POST", `${base}/me/reservations/${r.id}/cancel`, {
        action: "cancel",
        revision: r.revision,
        reason: cancelReason,
      });
      if (alive.current) {
        setNotice("Reservation cancelled.");
        await cache.invalidateQueries({ queryKey: key });
      }
    });
  return (
    <section className="mt-6" aria-label="Organization facilities">
      <h2 className="text-2xl font-semibold">Facilities & access</h2>
      <p className="mt-2 text-cl-muted">
        Find a space for your sport and request a time. Approval is required.
        These reservations are currently free; paid rentals will arrive with
        billing.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-red-500">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3">
          {notice}
        </p>
      ) : null}
      {catalog.isLoading ? <p className="mt-4">Loading facilities…</p> : null}
      {catalog.error ? (
        <p role="alert" className="mt-4">
          {catalog.error.message}{" "}
          <button className={button} onClick={() => void catalog.refetch()}>
            Retry
          </button>
        </p>
      ) : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {catalog.data?.items.map((f) => (
          <article key={f.id} className={panel}>
            <h3 className="text-lg font-semibold">{f.name}</h3>
            <p className="mt-2 text-cl-muted">
              {f.kind.replace(/-/g, " ")} · {f.location} · Up to {f.capacity}{" "}
              people
            </p>
            <p className="mt-3 whitespace-pre-wrap">{f.description}</p>
            <p className="mt-3 text-sm text-cl-muted">
              Operating window: {display(f.opensAt, f.timeZone)} —{" "}
              {display(f.closesAt, f.timeZone)} ({f.timeZone})
            </p>
            <button
              className={`${button} mt-4`}
              disabled={busy}
              onClick={() => select(f)}
            >
              View policy & request
            </button>
          </article>
        ))}
      </div>
      {catalog.data?.total === 0 ? (
        <p className="mt-5 text-cl-muted">
          This organization has not published facilities yet.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span>
          {catalog.data?.total ?? 0} facilities · Page {page}
        </span>
        <button
          className={button}
          disabled={busy || page === 1}
          onClick={() => {
            setPage((p) => p - 1);
            setSelected(undefined);
          }}
        >
          Previous
        </button>
        <button
          className={button}
          disabled={busy || !catalog.data?.hasNextPage}
          onClick={() => {
            setPage((p) => p + 1);
            setSelected(undefined);
          }}
        >
          Next
        </button>
      </div>
      {selected ? (
        <div className={panel}>
          <h3 className="text-xl font-semibold">Request {selected.name}</h3>
          <p className="mt-3 whitespace-pre-wrap">{selected.policy}</p>
          <p className="mt-3 text-sm text-cl-muted">
            Choose times in your device's local time zone (
            {Intl.DateTimeFormat().resolvedOptions().timeZone}). Facility time
            zone: {selected.timeZone}. Requests can last 15 minutes to 24 hours.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              Starts
              <input
                className={input}
                type="datetime-local"
                value={start}
                disabled={busy}
                onChange={(e) => {
                  setStart(e.target.value);
                  setAvailability(undefined);
                }}
              />
            </label>
            <label>
              Ends
              <input
                className={input}
                type="datetime-local"
                value={end}
                disabled={busy}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setAvailability(undefined);
                }}
              />
            </label>
            <label>
              People
              <input
                className={input}
                type="number"
                min={1}
                max={selected.capacity}
                value={units}
                disabled={busy}
                onChange={(e) => setUnits(e.target.value)}
              />
            </label>
            <label>
              Purpose (optional)
              <input
                className={input}
                maxLength={500}
                value={purpose}
                disabled={busy}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </label>
          </div>
          <button
            className={`${button} mt-4`}
            disabled={busy || !start || !end}
            onClick={() => void check()}
          >
            Check availability
          </button>
          {availability ? (
            <div className="mt-3">
              <p>
                Capacity: {availability.capacity}. Staff rechecks availability
                when approving.
              </p>
              {availability.closures.length ? (
                <p className="mt-2 text-red-500">
                  This time overlaps a closure.
                </p>
              ) : null}
              {availability.booked.map((b, i) => (
                <p key={i} className="mt-2 text-sm">
                  {display(b.startsAt)} — {display(b.endsAt)}: {b.units} people
                  already approved
                </p>
              ))}
              {!availability.closures.length && !availability.booked.length ? (
                <p className="mt-2">
                  No approved bookings or closures overlap this time.
                </p>
              ) : null}
            </div>
          ) : null}
          <label className="mt-5 flex items-center gap-3">
            <input
              type="checkbox"
              checked={accepted}
              disabled={busy}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            I have read and accept this facility's usage and cancellation
            policy.
          </label>
          {auth.user ? (
            <button
              className={`${button} mt-4`}
              disabled={busy || !accepted || !start || !end}
              onClick={() => void submit()}
            >
              Request reservation
            </button>
          ) : (
            <Link href="/auth" className={`${button} mt-4 inline-block`}>
              Sign in to request
            </Link>
          )}
          <button
            className={`${button} ml-3 mt-4`}
            disabled={busy}
            onClick={() => setSelected(undefined)}
          >
            Close
          </button>
        </div>
      ) : null}
      {auth.user ? (
        <div className={panel}>
          <h3 className="text-xl font-semibold">My reservations & passes</h3>
          <p className="mt-2 text-cl-muted">
            Show your approved reference to staff and bring identification.
            Staff confirms entry during your reservation window. Pending
            requests are not entry passes.
          </p>
          {own.isLoading ? (
            <p className="mt-3">Loading your reservations…</p>
          ) : null}
          {own.error ? (
            <p role="alert" className="mt-3">
              {own.error.message}
            </p>
          ) : null}
          <label className="mt-4 block">
            Reason for cancellation
            <input
              className={input}
              maxLength={500}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={busy}
            />
          </label>
          {own.data?.items.map((r) => (
            <article key={r.id} className={panel}>
              <h4 className="font-semibold">
                {catalog.data?.items.find((f) => f.id === r.facilityId)?.name ??
                  "Facility reservation"}{" "}
                · {r.status}
              </h4>
              <p className="mt-2">
                {display(r.startsAt)} — {display(r.endsAt)} · {r.units} people
              </p>
              <p className="mt-2">Account: {r.accountName}</p>
              <p className="mt-2 break-all select-all">Reference: {r.id}</p>
              {r.reason ? <p className="mt-2">{r.reason}</p> : null}
              {r.checkedInAt ? (
                <p className="mt-2">Checked in: {display(r.checkedInAt)}</p>
              ) : null}
              <details className="mt-3">
                <summary className="cursor-pointer">Accepted policy</summary>
                <p className="mt-2 whitespace-pre-wrap">{r.acceptedPolicy}</p>
              </details>
              {["pending", "approved"].includes(r.status) &&
              new Date(r.endsAt) > new Date() ? (
                <button
                  className={`${button} mt-4`}
                  disabled={busy || !cancelReason.trim()}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Cancel this reservation? This releases an approved booking.",
                      )
                    )
                      cancel(r);
                  }}
                >
                  Cancel reservation
                </button>
              ) : null}
            </article>
          ))}
          {own.data?.total === 0 ? (
            <p className="mt-3">
              You have no reservations with this organization.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <span>
              Page {ownPage} · {own.data?.total ?? 0} reservations
            </span>
            <button
              className={button}
              disabled={busy || ownPage === 1}
              onClick={() => setOwnPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className={button}
              disabled={busy || !own.data?.hasNextPage}
              onClick={() => setOwnPage((p) => p + 1)}
            >
              Next
            </button>
            <button
              className={button}
              disabled={busy}
              onClick={() => void own.refetch()}
            >
              Refresh status
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
