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
    [quantity, setQuantity] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const active = useRef(false);
  const retry = useRef<{ signature: string; id: string } | null>(null);
  async function checkout(event: FormEvent, type: AdmissionType) {
    event.preventDefault();
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError("");
    const input = {
      email: email.trim().toLowerCase(),
      quantity,
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
  return (
    <main className="admissions-page">
      <div className="admissions-heading">
        <span className="admissions-eyebrow">
          {options.data?.event.organizationName || "Admission"}
        </span>
        <h1>{options.data?.event.name || "Buy tickets"}</h1>
        {options.data && (
          <p>
            {new Date(options.data.event.startsAt).toLocaleString()} ·{" "}
            {options.data.event.location}
          </p>
        )}
      </div>
      {options.isPending && <p role="status">Loading ticket options…</p>}
      {options.isError && (
        <p role="alert">
          {options.error.message}{" "}
          <button onClick={() => void options.refetch()}>Retry</button>
        </p>
      )}
      {options.data && !options.data.items.length && (
        <p>No paid tickets are available for this event.</p>
      )}
      {error && (
        <p role="alert" className="admission-error">
          {error}
        </p>
      )}
      <div className="admissions-grid">
        {options.data?.items.map((type) => {
          const available = Math.max(
            0,
            type.capacity - type.issued - (type.reserved || 0),
          );
          return (
            <article key={type.id} className="admission-card">
              <form
                className="admission-card-body"
                onSubmit={(event) => void checkout(event, type)}
              >
                <h2>{type.name}</h2>
                <p>{type.description}</p>
                <p className="admission-price">
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: type.currency,
                  }).format(type.priceCents / 100)}{" "}
                  <small>
                    per ticket
                    {type.taxBps ? ` + ${type.taxBps / 100}% tax` : ""}
                  </small>
                </p>
                <p>{available} available</p>
                <p>
                  <label>
                    Email for ticket delivery
                    <br />
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                </p>
                <p>
                  <label>
                    Tickets
                    <br />
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    >
                      {Array.from(
                        { length: Math.max(1, Math.min(10, available)) },
                        (_, i) => (
                          <option key={i + 1}>{i + 1}</option>
                        ),
                      )}
                    </select>
                  </label>
                </p>
                <button
                  className="admission-primary"
                  disabled={
                    busy || quantity > available || !isAdmissionBookable(type)
                  }
                >
                  {busy ? "Opening checkout…" : admissionAvailability(type)}
                </button>
              </form>
            </article>
          );
        })}
      </div>
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
