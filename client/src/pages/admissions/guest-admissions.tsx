import cornerLeagueLogo from "@assets/CL_Logo.png";
import { useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudioPass } from "@/components/admissions/StudioPass";
import { apiFetch } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
import {
  admissionAvailability,
  admissionKey,
  admissionRequestId,
  isAdmissionBookable,
  type AdmissionEvent,
  type AdmissionType,
  type Ticket,
} from "@/lib/admissions";
import "./admissions.css";
import "./guest-admissions.css";

async function request(path: string, body?: unknown) {
  const response = await apiFetch(path, {
    method: body ? "POST" : "GET",
    ...(body ? { body } : {}),
    cache: "no-store",
    skipAuth: true,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      typeof error?.message === "string"
        ? error.message
        : "Tickets could not load. Please try again.",
    );
  }
  return response;
}

export function GuestAdmission({ eventKey }: { eventKey: string }) {
  const path = "/admissions/guest/events/" + admissionKey(eventKey);
  const options = useQuery({
    queryKey: ["guest-admission", eventKey],
    queryFn: async () =>
      unwrapSportData(await (await request(path)).json()) as {
        event: AdmissionEvent;
        items: AdmissionType[];
      },
    retry: false,
  });
  const [email, setEmail] = useState(""),
    [quantities, setQuantities] = useState<Record<string, number>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const active = useRef(false);
  const retry = useRef<{ signature: string; id: string } | null>(null);
  async function checkout(
    event: FormEvent,
    type: AdmissionType,
    count: number,
  ) {
    event.preventDefault();
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError("");
    const input = {
      email: email.trim().toLowerCase(),
      quantity: count,
      typeId: type.id,
      revision: type.revision,
    };
    const signature = JSON.stringify(input);
    if (retry.current?.signature !== signature)
      retry.current = { signature, id: admissionRequestId() };
    try {
      const data = unwrapSportData(
        await (
          await request(path + "/checkout", {
            ...input,
            requestId: retry.current.id,
          })
        ).json(),
      ) as { url?: string; state?: string };
      if (
        !data.url ||
        new URL(data.url).origin !== "https://checkout.stripe.com"
      ) {
        if (data.state === "expired") retry.current = null;
        throw new Error(
          "This checkout is no longer open. If you paid, check your email for your passes.",
        );
      }
      window.location.assign(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      active.current = false;
      setBusy(false);
    }
  }
  const game = options.data?.event;
  const organizer = game?.organizationName;
  const gameDate = game ? new Date(game.startsAt) : null;
  const formatDate = (date: Date, format: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(undefined, format).format(date);

  return (
    <main className="cl-box-office">
      <div className="cl-box-office__masthead">
        <div className="cl-box-office__wrap cl-box-office__masthead-inner">
          <div className="cl-box-office__identity">
            <img className="cl-box-office__crest" src={cornerLeagueLogo} alt="" />
            <span>
              {organizer || "Corner League"}
              <small>ATHLETICS BOX OFFICE</small>
            </span>
          </div>
          <span className="cl-box-office__powered">
            Powered by <strong>Corner League</strong>
          </span>
        </div>
      </div>
      <header className="cl-box-office__hero">
        <div className="cl-box-office__wrap cl-box-office__hero-inner">
          <div>
            <p className="cl-box-office__kicker">LIVE EVENT / TICKETS</p>
            <h1>{game?.name || "Event tickets"}</h1>
            <p className="cl-box-office__hero-note">
              Grab your tickets and be there for game day.
            </p>
          </div>
          {gameDate && Number.isFinite(+gameDate) && (
            <dl className="cl-box-office__details">
              <div>
                <dt>When</dt>
                <dd>
                  <time dateTime={game?.startsAt}>
                    {formatDate(gameDate, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" · "}
                    {formatDate(gameDate, {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZoneName: "short",
                    })}
                  </time>
                </dd>
              </div>
              {game?.location && (
                <div>
                  <dt>Where</dt>
                  <dd>{game.location}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </header>
      <section
        className="cl-box-office__wrap cl-box-office__content"
        aria-labelledby="box-office-tickets"
      >
        <div>
          <h2 id="box-office-tickets">Choose your tickets</h2>
          <p>Buy as a guest. Your passes will be sent to your email.</p>
        </div>
        {options.isPending && (
          <p className="cl-box-office__notice" role="status">
            Loading ticket options…
          </p>
        )}
        {options.isError && (
          <div className="cl-box-office__notice" role="alert">
            <p>{options.error.message}</p>
            <button
              className="cl-box-office__button"
              type="button"
              disabled={options.isFetching}
              onClick={() => void options.refetch()}
            >
              {options.isFetching ? "Checking…" : "Try again"}
            </button>
          </div>
        )}
        {options.data && !options.data.items.length && (
          <p className="cl-box-office__notice">
            No paid tickets are available for this event right now.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="cl-box-office__notice cl-box-office__notice--error"
          >
            {error}
          </p>
        )}
        <div className="cl-box-office__grid">
          {options.data?.items.map((type) => {
            const available = Math.max(
              0,
              type.capacity - type.issued - (type.reserved || 0),
            );
            const count = Math.min(
              quantities[type.id] ?? 1,
              Math.max(1, available),
            );
            const bookable = available > 0 && isAdmissionBookable(type);
            return (
              <article key={type.id} className="cl-box-office__ticket">
                <div className="cl-box-office__ticket-top">
                  <span>ADMISSION PASS</span>
                  <span>
                    {available > 0 ? `${available} available` : "Sold out"}
                  </span>
                </div>
                <form
                  className="cl-box-office__ticket-body"
                  onSubmit={(event) => {
                    if (bookable && !busy) void checkout(event, type, count);
                    else event.preventDefault();
                  }}
                >
                  <h3>{type.name}</h3>
                  {type.description && <p>{type.description}</p>}
                  <p className="cl-box-office__price">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: type.currency,
                    }).format(type.priceCents / 100)}
                    <small>
                      per ticket
                      {type.taxBps ? ` + ${type.taxBps / 100}% tax` : ""}
                    </small>
                  </p>
                  {bookable && (
                    <div className="cl-box-office__fields">
                      <label>
                        Email for ticket delivery
                        <input
                          required
                          type="email"
                          autoComplete="email"
                          maxLength={254}
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                        />
                      </label>
                      <label>
                        Quantity
                        <select
                          value={count}
                          onChange={(event) =>
                            setQuantities((previous) => ({
                              ...previous,
                              [type.id]: Number(event.target.value),
                            }))
                          }
                        >
                          {Array.from(
                            { length: Math.min(10, available) },
                            (_, index) => (
                              <option key={index + 1} value={index + 1}>
                                {index + 1}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    </div>
                  )}
                  <button
                    className="cl-box-office__button"
                    type="submit"
                    disabled={busy || !bookable}
                  >
                    {busy
                      ? "Opening checkout…"
                      : bookable
                        ? "Continue to payment →"
                        : admissionAvailability(type)}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
        {options.data?.items.some(isAdmissionBookable) && (
          <p className="cl-box-office__payment-note">
            Payment is handled by Stripe. Keep your emailed ticket link private.
          </p>
        )}
      </section>
    </main>
  );
}

export function GuestAdmissionComplete() {
  return (
    <main className="admissions-page">
      <div className="admissions-heading">
        <h1>Check your email for your tickets</h1>
        <p>
          If your payment went through, we’ll email your private pass link after
          confirming it. Check your spam folder if it doesn’t arrive.
        </p>
      </div>
    </main>
  );
}

export function GuestPasses({ orderId }: { orderId: string }) {
  const [token] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.history.state?.guestPassToken || window.location.hash.slice(1),
  );
  const valid = /^[A-Za-z0-9_-]{43}$/.test(token);
  const path = "/admissions/guest/orders/" + encodeURIComponent(orderId);
  const passes = useQuery({
    queryKey: ["guest-order", orderId],
    enabled: valid,
    queryFn: async () =>
      unwrapSportData(await (await request(path, { token })).json()) as {
        state: string;
        tickets: Ticket[];
        wallets: { apple: boolean; google: boolean };
      },
    retry: false,
    gcTime: 0,
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function wallet(ticket: Ticket, provider: "apple" | "google") {
    setBusy(true);
    setError("");
    try {
      const response = await request(
        path +
          "/tickets/" +
          encodeURIComponent(ticket.id) +
          "/wallet/" +
          provider,
        { token },
      );
      if (provider === "google") {
        const data = unwrapSportData(await response.json()) as { url?: string };
        if (!data.url?.startsWith("https://pay.google.com/gp/v/save/"))
          throw new Error("Wallet link is unavailable.");
        window.location.assign(data.url);
      } else {
        if (
          !response.headers
            .get("content-type")
            ?.includes("application/vnd.apple.pkpass")
        )
          throw new Error("Wallet pass is unavailable.");
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = url;
        link.download = "cornerleague.pkpass";
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admissions-page">
      <div className="admissions-heading">
        <h1>Your admission passes</h1>
        <p>Keep this link private. Show one QR code per guest at the gate.</p>
      </div>
      {!valid && (
        <p role="alert">Open the complete pass link from your ticket email.</p>
      )}
      {valid && passes.isPending && <p role="status">Loading your passes…</p>}
      {passes.isError && <p role="alert">{passes.error.message}</p>}
      {error && (
        <p role="alert" className="admission-error">
          {error}
        </p>
      )}
      {passes.data && !passes.data.tickets.length && (
        <p>No passes have been issued for this order.</p>
      )}
      <div className="admissions-grid">
        {passes.data?.tickets.map((ticket) => (
          <article className="admission-card" key={ticket.id}>
            <div className="admission-card-body">
              {ticket.snapshot.design?.sections?.length ? (
                <StudioPass ticket={ticket} />
              ) : (
                <>
                  <h2>{ticket.snapshot.eventName}</h2>
                  <p>{ticket.snapshot.typeName}</p>
                  <p>{ticket.snapshot.location}</p>
                  {ticket.qr ? (
                    <img
                      width={240}
                      height={240}
                      src={ticket.qr}
                      alt="Admission QR code"
                    />
                  ) : (
                    <p>This pass is unavailable for entry.</p>
                  )}
                </>
              )}
              {ticket.qr && (
                <div className="admission-wallet-tools">
                  {passes.data?.wallets.apple && (
                    <button
                      className="admission-primary"
                      disabled={busy}
                      onClick={() => void wallet(ticket, "apple")}
                    >
                      Add to Apple Wallet
                    </button>
                  )}
                  {passes.data?.wallets.google && (
                    <button
                      className="admission-primary"
                      disabled={busy}
                      onClick={() => void wallet(ticket, "google")}
                    >
                      Add to Google Wallet
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
