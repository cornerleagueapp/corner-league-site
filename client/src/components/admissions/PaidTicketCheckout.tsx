import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { ConcessionDialogContent } from "@/features/concessions/ConcessionDialog";
import { EmbeddedPayment } from "@/features/concessions/EmbeddedPayment";
import { admissionData } from "@/lib/admissions";
import "@/features/concessions/concessions.css";
export type TicketOrder = {
  id: string;
  state: string;
  quantity: number;
  totalCents: number;
  subtotalCents: number;
  taxCents: number;
  currency: string;
  expiresAt: string;
  refundedCents: number;
  refundReason: string | null;
  snapshot: { eventName: string; typeName: string };
};
export type TicketCheckoutResponse = {
  order: TicketOrder;
  clientSecret: string | null;
  publishableKey: string;
  connectedAccount: string;
};
const status = (s: string) =>
  ({
    awaiting_payment: "Awaiting payment",
    paid: "Paid · passes issued",
    expired: "Checkout closed · no passes issued",
    refund_pending: "Refund processing",
    refund_failed: "Refund needs organizer attention",
    refunded: "Refunded · passes invalidated",
  })[s] || s;
export function PaidTicketCheckout({
  initial,
  account,
  onClose,
}: {
  initial: TicketCheckoutResponse;
  account: string;
  onClose: () => void;
}) {
  const qc = useQueryClient(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    writing = useRef(false);
  const q = useQuery({
    queryKey: ["ticket-order", account, initial.order.id],
    queryFn: () =>
      admissionData<{ order: TicketOrder; ticketIds: string[] }>(
        `/admissions/me/orders/${initial.order.id}`,
      ),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });
  const order = q.data?.order || initial.order;
  useEffect(() => {
    if (order.state !== "awaiting_payment") {
      void qc.invalidateQueries({ queryKey: ["admission-tickets"] });
      void qc.invalidateQueries({ queryKey: ["ticket-orders", account] });
    }
  }, [order.state, account, qc]);
  async function cancel() {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await admissionData(`/admissions/me/orders/${order.id}/cancel`, {});
      await q.refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <ConcessionDialogContent>
        <Dialog.Title className="cc-title">
          {order.snapshot.eventName}
        </Dialog.Title>
        <Dialog.Description>
          {order.quantity} × {order.snapshot.typeName} ·{" "}
          {new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: order.currency,
          }).format(order.totalCents / 100)}
        </Dialog.Description>
        <p>
          Subtotal ${(order.subtotalCents / 100).toFixed(2)} · Tax $
          {(order.taxCents / 100).toFixed(2)} · Total $
          {(order.totalCents / 100).toFixed(2)}
        </p>
        <p role="status">{status(order.state)}</p>
        {order.state === "awaiting_payment" && (
          <>
            <p>
              Complete payment to receive your passes. Unpaid checkouts can be
              cancelled below. If sales close during payment, a successful
              charge will be reconciled and refunded.
            </p>
            {initial.clientSecret && !q.isError && (
              <EmbeddedPayment
                clientSecret={initial.clientSecret}
                publishableKey={initial.publishableKey}
                connectedAccount={initial.connectedAccount}
                onComplete={() => void q.refetch()}
              />
            )}
            <button
              className="cc-button"
              disabled={busy}
              onClick={() => void cancel()}
            >
              Cancel unpaid checkout
            </button>
          </>
        )}
        {order.state === "paid" && (
          <>
            <p>
              Your QR passes are in My tickets. Contact the organizer for
              cancellation or refund requests.
            </p>
            <a className="cc-button" href="/tickets">
              Open my tickets
            </a>
          </>
        )}
        {order.refundReason && <p>{order.refundReason}</p>}
        {(error || q.isError) && (
          <p role="alert">
            {error || q.error?.message}{" "}
            <button className="cc-button" onClick={() => void q.refetch()}>
              Check again
            </button>
          </p>
        )}
        <p className="cc-muted">
          Closing this window does not cancel a pending payment. Resume it from
          My tickets.
        </p>
        <button className="cc-button" disabled={busy} onClick={onClose}>
          Close
        </button>
      </ConcessionDialogContent>
    </Dialog.Root>
  );
}
export function TicketOrders({ account }: { account: string }) {
  const [page, setPage] = useState(1),
    [selected, setSelected] = useState<TicketCheckoutResponse | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    working = useRef(false);
  const q = useQuery({
    queryKey: ["ticket-orders", account, page],
    queryFn: () =>
      admissionData<{ items: TicketOrder[]; total: number }>(
        `/admissions/me/orders?page=${page}`,
      ),
    enabled: !!account,
    refetchInterval: 15000,
  });
  async function resume(id: string) {
    if (working.current) return;
    working.current = true;
    setBusy(id);
    setError("");
    try {
      setSelected(
        await admissionData<TicketCheckoutResponse>(
          `/admissions/me/orders/${id}/resume`,
          {},
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      working.current = false;
      setBusy("");
    }
  }
  return (
    <section aria-label="Ticket payments" style={{ marginBottom: 24 }}>
      <h2>Ticket payments</h2>
      {selected && (
        <PaidTicketCheckout
          key={`${account}:${selected.order.id}`}
          account={account}
          initial={selected}
          onClose={() => {
            setSelected(null);
            void q.refetch();
          }}
        />
      )}
      {q.isPending ? (
        <p role="status">Loading payments…</p>
      ) : q.isError ? (
        <p role="alert">
          {q.error.message}{" "}
          <button onClick={() => void q.refetch()}>Retry</button>
        </p>
      ) : !q.data.items.length ? (
        <p>No paid ticket orders yet.</p>
      ) : (
        q.data.items.map((o) => (
          <article
            key={o.id}
            className="admission-card"
            style={{ padding: 16, marginBottom: 12 }}
          >
            <h3>{o.snapshot.eventName}</h3>
            <p>
              {o.quantity} × {o.snapshot.typeName} · $
              {(o.totalCents / 100).toFixed(2)}
            </p>
            <p>{status(o.state)}</p>
            <button
              className="admission-primary"
              disabled={!!busy}
              onClick={() => void resume(o.id)}
            >
              {busy === o.id
                ? "Checking…"
                : o.state === "awaiting_payment"
                  ? "Resume / cancel checkout"
                  : "View order"}
            </button>
          </article>
        ))
      )}
      {error && <p role="alert">{error}</p>}
      {q.data && q.data.total > 20 && (
        <nav className="admission-pagination" aria-label="Ticket payment pages">
          <button
            disabled={page === 1 || !!busy}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(q.data.total / 20)}
          </span>
          <button
            disabled={page * 20 >= q.data.total || !!busy}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
