import { useSandbox } from "@/pages/organizations/SandboxContext";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ticket as TicketIcon,
  CalendarDays,
  MapPin,
  ArrowRight,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageSEO } from "@/seo/usePageSEO";
import {
  admissionAvailability,
  admissionData,
  admissionKey,
  admissionRequestId,
  type AdmissionType,
  type AdmissionEvent,
  type Ticket,
} from "@/lib/admissions";
import "./admissions.css";
const date = (s: string) =>
  new Date(s).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
function Cover({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="admission-cover"
    />
  ) : (
    <div className="admission-cover admission-cover-fallback">
      <TicketIcon aria-hidden="true" size={48} />
      <span>Corner League · Live</span>
    </div>
  );
}
export function AdmissionPage({ eventKey }: { eventKey: string }) {
  const { user } = useAuth();
  const sandbox = useSandbox();
  return (
    <AdmissionEventPage
      key={`${user?.id || "guest"}:${sandbox?.id || "public"}:${eventKey}`}
      eventKey={eventKey}
      sandboxId={sandbox?.id}
    />
  );
}
function AdmissionEventPage({
  eventKey,
  sandboxId,
}: {
  eventKey: string;
  sandboxId?: string;
}) {
  const { user, isAuthenticated } = useAuth(),
    qc = useQueryClient();
  const q = useQuery({
    queryKey: [
      "admission-types",
      sandboxId || "public",
      user?.id || "guest",
      eventKey,
    ],
    queryFn: () =>
      admissionData<{ event: AdmissionEvent; items: AdmissionType[] }>(
        `/admissions/events/${admissionKey(eventKey)}/types`,
        undefined,
        sandboxId,
      ),
    staleTime: 15000,
  });
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [quantity, setQuantity] = useState(1);
  const pending = useRef({ signature: "", id: "" }),
    writing = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function reserve(t: AdmissionType) {
    if (writing.current || sandboxId) return;
    const signature = JSON.stringify({ typeId: t.id, quantity });
    if (pending.current.signature !== signature)
      pending.current = { signature, id: admissionRequestId() };
    writing.current = true;
    setBusy(t.id);
    setError("");
    try {
      const r = await admissionData<{ ticketIds: string[] }>(
        `/admissions/events/${admissionKey(eventKey)}/claim`,
        { typeId: t.id, quantity, requestId: pending.current.id },
      );
      if (!Array.isArray(r?.ticketIds) || !r.ticketIds.length)
        throw new Error(
          "Reservation could not be confirmed. Retry to check the same order.",
        );
      await qc.invalidateQueries({ queryKey: ["admission-tickets", user?.id] });
      await q.refetch();
      if (alive.current) setSuccess(true);
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      writing.current = false;
      if (alive.current) setBusy("");
    }
  }
  return (
    <main className="admissions-page">
      <PageSEO
        title="Event admission | Corner League"
        description="Reserve event admission passes."
        noindex
      />
      <div className="admissions-heading">
        <span className="admissions-eyebrow">Be there for the moment</span>
        <h1>{q.data?.event.name || "Event admission"}</h1>
        <p>One pass. One guest. A place in the crowd.</p>
      </div>
      {q.isPending ? (
        <p role="status">Loading ticket options…</p>
      ) : q.isError ? (
        <p role="alert">
          {q.error.message}{" "}
          <button className="admission-link" onClick={() => void q.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <>
          <div className="admission-facts">
            <span>
              <CalendarDays size={18} />
              {date(q.data.event.startsAt)}
            </span>
            <span>
              <MapPin size={18} />
              {q.data.event.location || "Venue to be announced"}
            </span>
            <span>{q.data.event.organizationName}</span>
          </div>
          {success ? (
            <div className="admission-success" role="status">
              <CheckCircle2 size={28} />
              <div>
                <h2>Your passes are reserved.</h2>
                <p>
                  Display or print each QR ticket from your account. An email
                  receipt is queued.
                </p>
                <Link href="/tickets" className="admission-primary">
                  Open my tickets <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <label className="admission-quantity">
                Guests per reservation
                <select
                  value={quantity}
                  disabled={!!busy}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              {error && (
                <p role="alert" className="admission-error">
                  {error}
                </p>
              )}
              {!Array.isArray(q.data.items) || !q.data.items.length ? (
                <div className="admission-empty">
                  <TicketIcon size={40} />
                  <h2>No passes released yet</h2>
                  <p>
                    The organizer hasn’t published ticket options for this
                    event.
                  </p>
                </div>
              ) : (
                <div className="admissions-grid">
                  {q.data.items.map((t) => (
                    <article className="admission-card" key={t.id}>
                      <Cover src={t.coverUrl} />
                      <div className="admission-card-body">
                        <div className="admission-card-label">
                          Admission pass
                        </div>
                        <h2>{t.name}</h2>
                        <p>{t.description || "Join us at the event."}</p>
                        <div className="admission-price">
                          {t.priceCents === 0
                            ? "Free"
                            : new Intl.NumberFormat(undefined, {
                                style: "currency",
                                currency: t.currency,
                              }).format(t.priceCents / 100)}
                          <small>per guest</small>
                        </div>
                        <p className="admission-muted">
                          {Math.max(0, t.capacity - t.issued)} passes remaining
                          · Entry {date(t.entryStart)} – {date(t.entryEnd)}
                        </p>
                        {isAuthenticated ? (
                          <button
                            className="admission-primary"
                            disabled={
                              !!busy ||
                              !!sandboxId ||
                              admissionAvailability(t) !== "Reserve free pass"
                            }
                            onClick={() => void reserve(t)}
                          >
                            {sandboxId
                              ? "Private preview · reservations disabled"
                              : busy === t.id
                                ? "Reserving…"
                                : admissionAvailability(t)}
                          </button>
                        ) : (
                          <Link
                            className="admission-primary"
                            href={`/auth?next=${encodeURIComponent("/admissions/" + admissionKey(eventKey))}`}
                          >
                            Sign in to reserve
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
          <p className="admission-note">
            Each pass admits one person, once. Keep the QR code private.
            Competitor registration is managed separately. Paid checkout opens
            in a later release.
          </p>
        </>
      )}
    </main>
  );
}
export function MyTicketsPage() {
  const { user } = useAuth();
  return <TicketWallet key={user?.id} account={String(user?.id || "")} />;
}
function TicketWallet({ account }: { account: string }) {
  const [page, setPage] = useState(1),
    [selected, setSelected] = useState("");
  const q = useQuery({
    queryKey: ["admission-tickets", account, page],
    queryFn: () =>
      admissionData<{ items: Ticket[]; total: number }>(
        `/admissions/me/tickets?page=${page}`,
      ),
    enabled: !!account,
    staleTime: 15000,
  });
  return (
    <main className="admissions-page">
      <PageSEO
        title="My tickets | Corner League"
        description="Your digital event admission passes."
        noindex
      />
      <div className="admissions-heading">
        <span className="admissions-eyebrow">Your next live moment</span>
        <h1>My tickets</h1>
        <p>Your event passes, ready at the gate.</p>
      </div>
      {selected && (
        <TicketPass
          key={`${account}:${selected}`}
          id={selected}
          account={account}
          close={() => setSelected("")}
        />
      )}
      {q.isPending ? (
        <p role="status">Loading your tickets…</p>
      ) : q.isError ? (
        <p role="alert">
          {q.error.message}{" "}
          <button className="admission-link" onClick={() => void q.refetch()}>
            Try again
          </button>
        </p>
      ) : !q.data.items?.length ? (
        <div className="admission-empty">
          <TicketIcon size={40} />
          <h2>Your next event starts here</h2>
          <p>
            Reserve a pass from an event’s admission section and it will appear
            here.
          </p>
        </div>
      ) : (
        <div className="admissions-grid">
          {q.data.items.map((t) => (
            <article className="admission-card" key={t.id}>
              <Cover src={t.snapshot.coverUrl} />
              <div className="admission-card-body">
                <span className={`admission-status ${t.status}`}>
                  {t.status === "checked_in"
                    ? "Checked in"
                    : t.status === "cancelled"
                      ? "Cancelled"
                      : "Reserved"}
                </span>
                <h2>{t.snapshot.eventName}</h2>
                <p>
                  {t.snapshot.typeName} · {t.snapshot.organizationName}
                </p>
                <p className="admission-muted">
                  {date(t.snapshot.startsAt)} · {t.snapshot.location}
                </p>
                <button
                  className="admission-primary"
                  onClick={() => setSelected(t.id)}
                >
                  View pass
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {q.data && q.data.total > 20 && (
        <nav className="admission-pagination" aria-label="Ticket pages">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(q.data.total / 20)}
          </span>
          <button
            disabled={page * 20 >= q.data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
export function TicketPass({
  id,
  account,
  close,
}: {
  id: string;
  account: string;
  close: () => void;
}) {
  const [qrReady, setQrReady] = useState(false);
  useEffect(() => {
    const before = () => {
      if (document.querySelector(".admission-print-pass"))
        document.body.classList.add("admission-print-mode");
    };
    const after = () => document.body.classList.remove("admission-print-mode");
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      after();
    };
  }, [id]);
  const q = useQuery({
    queryKey: ["admission-pass", account, id],
    queryFn: () =>
      admissionData<Ticket>(`/admissions/me/tickets/${encodeURIComponent(id)}`),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  return (
    <section className="admission-pass-panel" aria-label="Selected ticket">
      <div className="admission-pass-tools">
        <button className="admission-link" onClick={close}>
          Close pass
        </button>
        <button
          className="admission-primary"
          disabled={!qrReady || !q.data?.qr || q.isFetching}
          onClick={() => {
            document.body.classList.add("admission-print-mode");
            window.print();
          }}
        >
          <Printer size={18} />
          Print pass
        </button>
      </div>
      {q.isPending ? (
        <p role="status">Loading your pass…</p>
      ) : q.isError ? (
        <p role="alert">
          Your pass is unavailable.{" "}
          <button className="admission-link" onClick={() => void q.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <article className="admission-print-pass">
          <Cover src={q.data.snapshot.coverUrl} />
          <div className="admission-pass-info">
            <span className="admissions-eyebrow">
              Corner League · Event pass
            </span>
            <h2>{q.data.snapshot.eventName}</h2>
            <h3>{q.data.snapshot.typeName}</h3>
            <p>{q.data.snapshot.organizationName}</p>
            <p>
              {date(q.data.snapshot.startsAt)}
              <br />
              {q.data.snapshot.location}
            </p>
            <span className={`admission-status ${q.data.status}`}>
              {q.data.status.replace("_", " ")}
            </span>
            {q.data.entryStart && q.data.entryEnd && (
              <p>
                Entry window: {date(q.data.entryStart)} –{" "}
                {date(q.data.entryEnd)}
              </p>
            )}
            {q.data.entryState === "not_open" && (
              <p>Entry opens at the time shown above.</p>
            )}
            <div className="admission-qr">
              {q.data.qr ? (
                <img
                  src={q.data.qr}
                  alt="Your admission QR code"
                  width="256"
                  height="256"
                  onLoad={() => setQrReady(true)}
                  onError={() => setQrReady(false)}
                />
              ) : (
                <p>
                  {q.data.status === "checked_in"
                    ? "This pass has already been admitted."
                    : q.data.entryState === "expired"
                      ? "This pass’s entry window has closed."
                      : q.data.entryState === "event_unavailable"
                        ? "This event is no longer available for entry."
                        : "This pass has been cancelled."}
                </p>
              )}
            </div>
            <p className="admission-muted">Pass {id}</p>
            <p>One guest · One entry · Keep this QR private</p>
            {q.data.checkedInAt && <p>Checked in {date(q.data.checkedInAt)}</p>}
          </div>
        </article>
      )}
    </section>
  );
}
