import { ConcessionDialogContent as DialogContent } from "./ConcessionDialog";
import { PageSEO } from "@/seo/usePageSEO";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { concessionsRequest as request } from "./api";
import { EmbeddedPayment } from "./EmbeddedPayment";
import {
  money,
  statusLabel,
  type Stand,
  type MenuItem,
  type Order,
} from "./types";
import "./concessions.css";
type Payment = {
  order: Order;
  clientSecret: string | null;
  connectedAccount?: string;
  publishableKey?: string;
};
type CartLine = {
  itemId: string;
  quantity: number;
  revision: number;
  unitCents: number;
  name: string;
};
const activeStates = [
  "awaiting_payment",
  "queued",
  "preparing",
  "ready",
  "refund_pending",
];
export function ConcessionsPage({
  organizationId,
}: {
  organizationId: string;
}) {
  const { user } = useAuth();
  return (
    <Store
      key={`${organizationId}:${user?.id || "guest"}`}
      org={organizationId}
      signedIn={!!user}
      account={user?.id || "guest"}
    />
  );
}
function readCart(org: string): { standId: string; lines: CartLine[] } {
  try {
    const data = JSON.parse(
      localStorage.getItem(`cl-concession-cart:${org}`) || "null",
    );
    if (typeof data?.standId !== "string" || !Array.isArray(data?.lines))
      return { standId: "", lines: [] };
    const requested = new URLSearchParams(window.location.search).get("stand");
    if (requested && requested !== data.standId)
      return { standId: requested, lines: [] };
    return {
      standId: data.standId,
      lines: data.lines
        .filter(
          (l: CartLine) =>
            typeof l.itemId === "string" &&
            typeof l.name === "string" &&
            Number.isInteger(l.quantity) &&
            l.quantity > 0 &&
            l.quantity <= 20 &&
            Number.isInteger(l.unitCents) &&
            l.unitCents >= 50 &&
            Number.isInteger(l.revision),
        )
        .slice(0, 20),
    };
  } catch {
    return { standId: "", lines: [] };
  }
}
function Store({
  org,
  signedIn,
  account,
}: {
  org: string;
  signedIn: boolean;
  account: string | number;
}) {
  const base = `organizations/${org}`,
    queryClient = useQueryClient(),
    scope = ["concessions", org, account];
  const initialCart = useRef(readCart(org));
  const [standId, setStandId] = useState(
      () =>
        new URLSearchParams(window.location.search).get("stand") ||
        initialCart.current.standId,
    ),
    [tab, setTab] = useState("menu"),
    [category, setCategory] = useState("All"),
    [cart, setCart] = useState<CartLine[]>(initialCart.current.lines),
    [payment, setPayment] = useState<Payment | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState<Order | null>(null),
    [reason, setReason] = useState(""),
    [confirmCancel, setConfirmCancel] = useState(false),
    [page, setPage] = useState(1);
  const cartNode = useRef<HTMLElement>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const gate = useRef(false),
    retry = useRef<{ signature: string; requestId: string } | null>(null);
  const storageKey = `cl-concession-checkout:${org}:${account}`;
  const standsQuery = useQuery({
    queryKey: [...scope, "stands"],
    queryFn: ({ signal }) =>
      request<{
        stands: Stand[];
        paymentsEnabled: boolean;
        organizationName: string;
      }>(`${base}/stands`, undefined, signal),
    staleTime: 15000,
    retry: 1,
  });
  const actualStand = standId || standsQuery.data?.stands[0]?.id || "";
  const menuQuery = useQuery({
    queryKey: [...scope, "menu", actualStand],
    queryFn: ({ signal }) =>
      request<{ stand: Stand; items: MenuItem[]; paymentsEnabled: boolean }>(
        `${base}/stands/${actualStand}/menu`,
        undefined,
        signal,
      ),
    enabled: !!actualStand,
    refetchInterval: payment ? false : 30000,
    retry: 1,
  });
  const ordersQuery = useQuery({
    queryKey: [...scope, "orders", page],
    queryFn: ({ signal }) =>
      request<{ orders: Order[]; total: number }>(
        `${base}/orders?page=${page}`,
        undefined,
        signal,
      ),
    enabled: signedIn && tab === "orders",
    refetchInterval: 15000,
    retry: 1,
  });
  const detailQuery = useQuery({
    queryKey: [...scope, "order", selected?.id],
    queryFn: ({ signal }) =>
      request<Order>(`${base}/orders/${selected!.id}`, undefined, signal),
    enabled: signedIn && !!selected,
    refetchInterval:
      selected && activeStates.includes(selected.state) ? 10000 : false,
    retry: 1,
  });
  const current = detailQuery.data || selected,
    menu = menuQuery.data,
    stand = menu?.stand,
    items = menu?.items || [];
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (
        saved &&
        typeof saved.signature === "string" &&
        typeof saved.requestId === "string"
      )
        retry.current = saved;
    } catch {}
  }, [storageKey]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("order");
    if (!signedIn || !id || !/^[0-9a-f-]{36}$/i.test(id)) return;
    const controller = new AbortController();
    void request<Order>(`${base}/orders/${id}`, undefined, controller.signal)
      .then((o) => {
        setSelected(o);
        setTab("orders");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [base, signedIn]);
  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: scope }),
    [queryClient, org, account],
  );
  useEffect(() => {
    if (actualStand)
      try {
        localStorage.setItem(
          `cl-concession-cart:${org}`,
          JSON.stringify({ standId: actualStand, lines: cart }),
        );
      } catch {}
  }, [org, actualStand, cart]);
  useEffect(() => {
    if (!cartNode.current || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(
      ([entry]) => setCartVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(cartNode.current);
    return () => observer.disconnect();
  }, [tab, actualStand, !!menu]);
  const subtotal = cart.reduce((sum, l) => sum + l.unitCents * l.quantity, 0),
    tax = Math.round((subtotal * (stand?.taxBps || 0)) / 10000);
  const stale = cart.some((l) => {
    const item = items.find((i) => i.id === l.itemId);
    return (
      !item ||
      item.revision !== l.revision ||
      (item.remaining !== null && item.remaining < l.quantity)
    );
  });
  async function run(work: () => Promise<void>) {
    if (gate.current) return;
    gate.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to complete this request.",
      );
    } finally {
      gate.current = false;
      setBusy(false);
    }
  }
  function adjust(item: MenuItem, delta: number) {
    setError("");
    if (
      delta > 0 &&
      cart.length >= 20 &&
      !cart.some((l) => l.itemId === item.id)
    ) {
      setError("You can order up to 20 different menu items at once.");
      return;
    }
    setCart((prev) => {
      const old = prev.find((l) => l.itemId === item.id),
        quantity = (old?.quantity || 0) + delta;
      if (quantity <= 0) return prev.filter((l) => l.itemId !== item.id);
      if (quantity > Math.min(20, item.remaining ?? 20)) return prev;
      const line = {
        itemId: item.id,
        quantity,
        revision: item.revision,
        unitCents: item.priceCents,
        name: item.name,
      };
      return old
        ? prev.map((l) => (l.itemId === item.id ? line : l))
        : [...prev, line];
    });
  }
  async function checkout() {
    if (!stand || !cart.length || stale) return;
    await run(async () => {
      const payload = {
        revision: stand.revision,
        items: cart
          .map(({ itemId, quantity, revision }) => ({
            itemId,
            quantity,
            revision,
          }))
          .sort((a, b) => a.itemId.localeCompare(b.itemId)),
      };
      const signature = JSON.stringify({ standId: stand.id, ...payload });
      if (retry.current?.signature !== signature)
        retry.current = { signature, requestId: crypto.randomUUID() };
      try {
        localStorage.setItem(storageKey, JSON.stringify(retry.current));
      } catch {}
      const result = await request<Payment>(
        `${base}/stands/${stand.id}/checkout`,
        { ...payload, requestId: retry.current!.requestId },
      );
      setSelected(result.order);
      if (!result.clientSecret) {
        retry.current = null;
        try {
          localStorage.removeItem(storageKey);
        } catch {}
        if (result.order.state !== "cancelled") setCart([]);
      }
      if (result.clientSecret) setPayment(result);
      else {
        setTab("orders");
        setNotice("Order status updated.");
      }
      await refresh();
    });
  }
  async function resume(o: Order) {
    await run(async () => {
      const p = await request<Payment>(`${base}/orders/${o.id}/resume`, {});
      setSelected(p.order);
      if (p.clientSecret) setPayment(p);
      else await refresh();
    });
  }
  async function cancel() {
    if (!current) return;
    await run(async () => {
      const updated = await request<Order>(
        `${base}/orders/${current.id}/action`,
        { action: "cancel", reason },
      );
      setSelected(updated);
      setConfirmCancel(false);
      setReason("");
      setNotice(
        updated.state === "cancelled"
          ? "Order cancelled."
          : "Refund requested. We’ll update the status once it’s confirmed.",
      );
      retry.current = null;
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      await refresh();
    });
  }
  function completed() {
    setPayment(null);
    setCart([]);
    retry.current = null;
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setTab("orders");
    setNotice(
      "Confirming your payment. Your pickup code will be ready once payment is verified.",
    );
    void refresh();
  }
  const categories = ["All", ...new Set(items.map((i) => i.category))];
  return (
    <main className="cc-page">
      <PageSEO
        title="Concessions"
        noindex
        canonicalPath={`/concessions/${org}`}
      />
      <header className="cc-hero">
        <span className="cc-eyebrow">Corner League · Game day</span>
        <h1>{standsQuery.data?.organizationName || "Concessions"}</h1>
        <p>
          Skip the line. Order here, then collect at your stand when it’s ready.
        </p>
        <div className="cc-tabs">
          <button
            aria-pressed={tab === "menu"}
            className="cc-button"
            onClick={() => setTab("menu")}
          >
            Menu
          </button>
          <button
            aria-pressed={tab === "orders"}
            className="cc-button"
            onClick={() => setTab("orders")}
          >
            My orders
          </button>
        </div>
      </header>
      {(error ||
        standsQuery.error ||
        menuQuery.error ||
        (tab === "orders" && ordersQuery.error) ||
        detailQuery.error) && (
        <div className="cc-alert" role="alert">
          <p>
            {error ||
              String(
                (
                  standsQuery.error ||
                  menuQuery.error ||
                  ordersQuery.error ||
                  detailQuery.error
                )?.message,
              )}
          </p>
          <button
            className="cc-button"
            disabled={busy}
            onClick={() => {
              setError("");
              void refresh();
            }}
          >
            Refresh
          </button>
        </div>
      )}
      {notice && (
        <p className="cc-notice" role="status">
          {notice}
        </p>
      )}
      {standsQuery.isLoading && <p role="status">Loading stands…</p>}
      {tab === "menu" && (
        <>
          {!!standsQuery.data?.stands.length && (
            <label className="cc-label">
              Choose a stand
              <select
                value={actualStand}
                onChange={(e) => {
                  if (
                    cart.length &&
                    !window.confirm(
                      "Switch stands and clear your current cart?",
                    )
                  )
                    return;
                  setStandId(e.target.value);
                  setCart([]);
                  setCategory("All");
                }}
                className="cc-input"
              >
                {standsQuery.data.stands.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.open ? "" : " · Closed"}
                  </option>
                ))}
              </select>
            </label>
          )}
          {standsQuery.data && !standsQuery.data.stands.length && (
            <section className="cc-card">
              <h2>No concession stands yet</h2>
              <p>Check back when the organization opens its game-day menu.</p>
            </section>
          )}
          {menuQuery.isLoading && <p role="status">Loading menu…</p>}
          {stand && (
            <>
              <section className="cc-stand">
                <div>
                  <span className={`cc-status ${stand.open ? "is-open" : ""}`}>
                    {stand.serviceState === "paused"
                      ? "Temporarily paused"
                      : stand.serviceState === "scheduled"
                        ? "Opens soon"
                        : stand.open
                          ? "Open for orders"
                          : "Ordering closed"}
                    {stand.open && stand.closesAt
                      ? ` · until ${new Date(stand.closesAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                      : ""}
                  </span>
                  <h2>{stand.name}</h2>
                  <p>{stand.location}</p>
                  {stand.instructions && <p>{stand.instructions}</p>}
                </div>
                <div className="cc-time">
                  <strong>~{stand.prepMinutes} min</strong>
                  <span>Estimated preparation</span>
                </div>
              </section>
              {!menu?.paymentsEnabled && (
                <p className="cc-notice">
                  Online ordering is being set up. You can browse the menu
                  below.
                </p>
              )}
              <div className="cc-layout">
                <div>
                  <div className="cc-categories" aria-label="Menu categories">
                    {categories.map((c) => (
                      <button
                        key={c}
                        aria-pressed={category === c}
                        className="cc-button"
                        onClick={() => setCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="cc-menu-grid">
                    {items
                      .filter(
                        (i) => category === "All" || i.category === category,
                      )
                      .map((i) => {
                        const qty =
                          cart.find((l) => l.itemId === i.id)?.quantity || 0;
                        return (
                          <article className="cc-card" key={i.id}>
                            <span className="cc-eyebrow">{i.category}</span>
                            <h3>{i.name}</h3>
                            {i.description && <p>{i.description}</p>}
                            {i.allergens && (
                              <p className="cc-allergen">
                                Dietary / allergens: {i.allergens}
                              </p>
                            )}
                            <div className="cc-item-bottom">
                              <strong>{money(i.priceCents)}</strong>
                              {i.remaining === 0 ? (
                                <span className="cc-status">Sold out</span>
                              ) : (
                                <div className="cc-quantity">
                                  <button
                                    className="cc-button"
                                    aria-label={`Remove one ${i.name}`}
                                    disabled={!qty || busy}
                                    onClick={() => adjust(i, -1)}
                                  >
                                    −
                                  </button>
                                  <output aria-label={`${i.name} quantity`}>
                                    {qty}
                                  </output>
                                  <button
                                    className="cc-button"
                                    aria-label={`Add one ${i.name}`}
                                    disabled={
                                      !stand.open ||
                                      !menu.paymentsEnabled ||
                                      busy ||
                                      qty >= Math.min(20, i.remaining ?? 20)
                                    }
                                    onClick={() => adjust(i, 1)}
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                            {i.remaining !== null &&
                              i.remaining > 0 &&
                              i.remaining <= 5 && (
                                <p className="cc-small">
                                  Only {i.remaining} available
                                </p>
                              )}
                          </article>
                        );
                      })}
                  </div>
                  {!items.length && <p>No menu items available right now.</p>}
                  <p className="cc-small">
                    Ask the stand about allergens before ordering. Preparation
                    times are estimates. Pickup only.
                  </p>
                </div>
                <aside
                  ref={cartNode}
                  className="cc-card cc-cart"
                  aria-label="Your order"
                >
                  <h2>Your order</h2>
                  {!cart.length && (
                    <p>Add something from the menu to get started.</p>
                  )}
                  {cart.map((l) => (
                    <div key={l.itemId} className="cc-cart-line">
                      <span>
                        {l.quantity} × {l.name}
                      </span>
                      <strong>{money(l.quantity * l.unitCents)}</strong>
                      <button
                        className="cc-text-button"
                        aria-label={`Remove ${l.name} from cart`}
                        disabled={busy}
                        onClick={() =>
                          setCart(cart.filter((row) => row.itemId !== l.itemId))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {cart.length > 0 && (
                    <>
                      <dl className="cc-totals">
                        <div>
                          <dt>Subtotal</dt>
                          <dd>{money(subtotal)}</dd>
                        </div>
                        <div>
                          <dt>Sales tax ({stand.taxBps / 100}%)</dt>
                          <dd>{money(tax)}</dd>
                        </div>
                        <div>
                          <dt>Total</dt>
                          <dd>{money(subtotal + tax)}</dd>
                        </div>
                      </dl>
                      {subtotal > 100000 && (
                        <p role="alert">
                          Orders can total up to $1,000 before tax. Remove some
                          items to continue.
                        </p>
                      )}
                      {stale && (
                        <p role="alert">
                          The menu or stock changed. Remove affected items and
                          add them again before paying.
                        </p>
                      )}
                      {signedIn ? (
                        <button
                          className="cc-button cc-primary"
                          disabled={
                            busy ||
                            stale ||
                            !stand.open ||
                            !menu.paymentsEnabled
                          }
                          onClick={() => void checkout()}
                        >
                          {busy
                            ? "Opening payment…"
                            : `Continue to payment · ${money(subtotal + tax)}`}
                        </button>
                      ) : (
                        <Link
                          className="cc-button cc-primary"
                          href={`/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                        >
                          Sign in to order
                        </Link>
                      )}
                      <p className="cc-small">
                        You can cancel before preparation starts. After that,
                        contact the stand.
                      </p>
                    </>
                  )}
                </aside>
              </div>
            </>
          )}
        </>
      )}
      {tab === "orders" && (
        <section aria-label="Your concession orders">
          {!signedIn ? (
            <div className="cc-card">
              <h2>Keep your pickup details handy</h2>
              <p>Sign in to see your orders and live pickup status.</p>
              <Link
                className="cc-button cc-primary"
                href={`/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
              >
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="cc-order-grid">
                {ordersQuery.data?.orders.map((o) => (
                  <button
                    key={o.id}
                    className="cc-card cc-order-tile"
                    onClick={() => {
                      setSelected(o);
                      setConfirmCancel(false);
                    }}
                  >
                    <span
                      className={`cc-status ${o.state === "ready" ? "is-open" : ""}`}
                    >
                      {statusLabel(o.state)}
                    </span>
                    <h2>{o.standName}</h2>
                    <p>{new Date(o.createdAt).toLocaleString()}</p>
                    <strong>{money(o.totalCents)}</strong>
                    <span className="cc-small">View order →</span>
                  </button>
                ))}
              </div>
              {ordersQuery.isLoading && (
                <p role="status">Loading your orders…</p>
              )}
              {ordersQuery.data && !ordersQuery.data.orders.length && (
                <div className="cc-card">
                  <h2>Your next snack starts here</h2>
                  <p>
                    No orders yet. Browse a stand’s menu to place your first
                    order.
                  </p>
                  <button className="cc-button" onClick={() => setTab("menu")}>
                    Browse menu
                  </button>
                </div>
              )}
              <div className="cc-pagination">
                <button
                  className="cc-button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  className="cc-button"
                  disabled={page * 25 >= (ordersQuery.data?.total || 0)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      )}
      {tab === "menu" && cart.length > 0 && !cartVisible && (
        <div className="cc-mobile-bar">
          <button
            className="cc-button cc-primary"
            onClick={() =>
              cartNode.current?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
                block: "start",
              })
            }
          >
            Review order ({cart.reduce((n, l) => n + l.quantity, 0)}) ·{" "}
            {money(subtotal + tax)}
          </button>
        </div>
      )}
      <Dialog
        open={!!selected && !payment}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setSelected(null);
            setConfirmCancel(false);
          }
        }}
      >
        <DialogContent className="cc-dialog">
          <DialogTitle>Your order</DialogTitle>
          {(error || detailQuery.error) && (
            <p role="alert" className="cc-alert">
              {error || detailQuery.error?.message}
            </p>
          )}
          <DialogDescription>
            {current?.standName} · {current?.location}
          </DialogDescription>
          {current && (
            <>
              <span
                className={`cc-status ${current.state === "ready" ? "is-open" : ""}`}
                aria-live="polite"
              >
                {statusLabel(current.state)}
              </span>
              {![
                "awaiting_payment",
                "cancelled",
                "refunded",
                "refund_pending",
              ].includes(current.state) && (
                <div className="cc-pickup">
                  <span>Show this pickup code to the stand</span>
                  <strong>{current.pickupCode}</strong>
                  <p>
                    {current.state === "ready"
                      ? "Your order is ready. Head to the pickup location."
                      : current.state === "collected"
                        ? "Thanks! Your order has been collected."
                        : `We’ll update this page when it’s ready. Estimated preparation: ${current.prepMinutes} minutes.`}
                  </p>
                </div>
              )}
              {current.lines.map((l) => (
                <p key={l.itemId}>
                  {l.quantity} × {l.name} · {money(l.quantity * l.unitCents)}
                </p>
              ))}
              <p>
                Tax {money(current.taxCents)} · Total{" "}
                {money(current.totalCents)}
              </p>
              {current.refundedCents > 0 && (
                <p>Refunded: {money(current.refundedCents)}</p>
              )}
              {current.instructions && <p>{current.instructions}</p>}
              {current.state === "awaiting_payment" && (
                <button
                  className="cc-button cc-primary"
                  disabled={busy}
                  onClick={() => void resume(current)}
                >
                  Resume payment
                </button>
              )}
              {["awaiting_payment", "queued"].includes(current.state) &&
                !confirmCancel && (
                  <button
                    className="cc-button"
                    disabled={busy}
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancel order
                  </button>
                )}
              {confirmCancel && (
                <div className="cc-card">
                  <label className="cc-label">
                    Cancellation reason
                    <input
                      maxLength={400}
                      className="cc-input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <p>
                    {current.state === "awaiting_payment"
                      ? "Checkout will close. If payment just completed, we’ll request a refund."
                      : "Your payment will be refunded. This can take several business days."}
                  </p>
                  <div className="cc-tabs">
                    <button
                      className="cc-button"
                      disabled={busy || !reason.trim()}
                      onClick={() => void cancel()}
                    >
                      Confirm cancellation
                    </button>
                    <button
                      className="cc-button"
                      disabled={busy}
                      onClick={() => setConfirmCancel(false)}
                    >
                      Keep order
                    </button>
                  </div>
                </div>
              )}
              {![
                "awaiting_payment",
                "queued",
                "cancelled",
                "refunded",
                "collected",
                "refund_pending",
                "refund_failed",
              ].includes(current.state) && (
                <p className="cc-small">
                  Preparation has started. Contact the stand for changes or
                  help.
                </p>
              )}
              {current.state === "refund_failed" && (
                <p role="alert">
                  The refund could not be completed. Contact the stand so staff
                  can retry it.
                </p>
              )}
              {current.refundReason && <p>{current.refundReason}</p>}
              <button
                className="cc-text-button"
                disabled={busy}
                onClick={() => void detailQuery.refetch()}
              >
                Refresh status
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!payment?.clientSecret}
        onOpenChange={(open) => {
          if (!open) {
            setPayment(null);
            setTab("orders");
          }
        }}
      >
        <DialogContent className="cc-dialog cc-payment-dialog">
          <DialogTitle>Secure payment</DialogTitle>
          <DialogDescription>
            Pay here in Corner League. Closing this window keeps your order
            available under My orders until checkout expires.
          </DialogDescription>
          {payment?.clientSecret &&
            payment.publishableKey &&
            payment.connectedAccount && (
              <EmbeddedPayment
                clientSecret={payment.clientSecret}
                publishableKey={payment.publishableKey}
                connectedAccount={payment.connectedAccount}
                onComplete={completed}
              />
            )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
export function ConcessionsLink({
  organizationId,
}: {
  organizationId: string;
}) {
  const q = useQuery({
    queryKey: ["concession-link", organizationId],
    queryFn: ({ signal }) =>
      request<{ stands: Stand[] }>(
        `organizations/${organizationId}/stands`,
        undefined,
        signal,
      ),
    retry: false,
    staleTime: 60000,
  });
  if (!q.data?.stands.length) return null;
  return (
    <Link
      href={`/concessions/${organizationId}`}
      className="inline-flex min-h-11 items-center rounded-full bg-cl-accent px-5 py-2 font-bold text-white"
    >
      Order concessions
    </Link>
  );
}
