import { useCallback, useEffect, useRef, useState } from "react";
import { merchRequest } from "./api";
import { money, Order } from "./types";
type Operations = {
  shipments: {
    id: string;
    purpose: string;
    state: string;
    mode: string;
    labelUrl?: string | null;
    trackingUrl?: string | null;
    trackingNumber?: string | null;
    trackingStatus: string;
  }[];
  refunds: {
    id: string;
    amountCents: number;
    status: string;
    reason: string;
  }[];
  exchanges: { id: string; status: string; replacements: Order["lines"] }[];
};
const input =
  "w-full rounded-xl border border-cl-border bg-cl-subtle px-3 py-2 text-cl-ink";
const button =
  "rounded-xl border border-cl-accent/20 bg-cl-accent/10 px-4 py-2 text-sm font-bold text-cl-ink disabled:opacity-40";
export function OrderOperations({
  order: o,
  base,
  busy,
  act,
}: {
  order: Order;
  base: string;
  busy: boolean;
  act: (job: () => Promise<void>) => void;
}) {
  const [data, setData] = useState<Operations>({
      shipments: [],
      refunds: [],
      exchanges: [],
    }),
    [resolution, setResolution] = useState<"refund" | "exchange">("refund"),
    [quantities, setQuantities] = useState<Record<string, string>>({}),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const pending = useRef<{ signature: string; id: string } | null>(null),
    alive = useRef(true);
  const load = useCallback(async () => {
    const result = await merchRequest<Operations>(
      `${base}/orders/${o.id}/operations`,
    );
    if (alive.current) setData(result);
  }, [base, o.id]);
  useEffect(() => {
    alive.current = true;
    void load().catch((e) => setError(e.message));
    return () => {
      alive.current = false;
    };
  }, [load, o.refundedCents, o.cases?.length]);
  const selection = o.lines
    .filter((l) => Number(quantities[l.variantId]) > 0)
    .map((l) => ({
      variantId: l.variantId,
      quantity: Number(quantities[l.variantId]),
    }));
  const submit = () => {
    setError("");
    setNotice("");
    act(async () => {
      try {
        const body = { kind: "return", resolution, selection, reason },
          signature = JSON.stringify(body);
        if (pending.current?.signature !== signature)
          pending.current = { signature, id: crypto.randomUUID() };
        await merchRequest(`${base}/orders/${o.id}/cases`, {
          ...body,
          requestId: pending.current.id,
        });
        setNotice(
          "Your request was sent. Wait for the seller’s approval and return instructions before sending items.",
        );
        setReason("");
        setQuantities({});
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request could not be sent.");
        throw e;
      }
    });
  };
  return (
    <div className="space-y-3 rounded-xl border border-cl-border p-4">
      <h4 className="font-bold">Shipping, returns and exchanges</h4>
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
      {data.shipments.map((s) => (
        <div key={s.id} className="space-y-1 text-sm">
          <strong>
            {s.purpose === "return"
              ? "Return parcel"
              : s.purpose === "exchange"
                ? "Replacement parcel"
                : "Your parcel"}
            :
          </strong>{" "}
          {s.trackingStatus.replace(/_/g, " ")}{" "}
          {s.mode === "test" ? "(test shipment)" : ""}
          {s.trackingUrl ? (
            <p>
              <a
                className="underline"
                href={s.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Track {s.trackingNumber ?? "parcel"}
              </a>
            </p>
          ) : null}
          {s.purpose === "return" && s.labelUrl ? (
            <p>
              <a
                className={button + " inline-block"}
                href={s.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download approved return label
              </a>
            </p>
          ) : null}
        </div>
      ))}
      {data.refunds.map((r) => (
        <p key={r.id} className="text-sm">
          Refund: {money(r.amountCents)} • {r.status} • {r.reason}
        </p>
      ))}
      {data.exchanges.map((e) => (
        <div key={e.id} className="text-sm">
          <strong>Exchange: {e.status}</strong>
          {e.replacements.map((l) => (
            <p key={l.variantId}>
              {l.name} — {l.size}/{l.color} × {l.quantity}
            </p>
          ))}
        </div>
      ))}
      {o.paymentState === "paid" && o.fulfillment !== "unfulfilled" ? (
        <>
          <label className="block">
            Requested resolution
            <select
              className={input}
              value={resolution}
              disabled={busy}
              onChange={(e) =>
                setResolution(e.target.value as typeof resolution)
              }
            >
              <option value="refund">Return selected items for a refund</option>
              <option value="exchange">
                Exchange selected items (same product and price)
              </option>
            </select>
          </label>
          {o.lines.map((l) => (
            <label key={l.variantId} className="block text-sm">
              {l.name} — {l.size}/{l.color} • purchased {l.quantity}
              <input
                aria-label={`Return quantity for ${l.name} ${l.size} ${l.color}`}
                className={input + " mt-1"}
                type="number"
                min={0}
                max={l.quantity}
                disabled={busy}
                value={quantities[l.variantId] ?? "0"}
                onChange={(e) =>
                  setQuantities({
                    ...quantities,
                    [l.variantId]: e.target.value,
                  })
                }
              />
            </label>
          ))}
          <label className="block">
            Reason / requested replacement size and color
            <textarea
              className={input}
              maxLength={2000}
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <p className="text-xs text-cl-muted">
            The seller must approve your request. Exchange stock is confirmed
            after the returned items are received. Different-price replacements
            require a refund and a new purchase.
          </p>
          <button
            className={button}
            disabled={
              busy ||
              !selection.length ||
              selection.some(
                (l) => !Number.isInteger(l.quantity) || l.quantity < 1,
              ) ||
              reason.trim().length < 5
            }
            onClick={submit}
          >
            Send item return / exchange request
          </button>
        </>
      ) : null}
    </div>
  );
}
