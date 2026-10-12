import { OrderOperations } from "./OrderOperations";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MerchError, merchRequest } from "./api";
import { Case, money, Order, Product, Shop } from "./types";
type CartLine = {
  variantId: string;
  productId: string;
  revision: number;
  quantity: number;
  name: string;
  size: string;
  color: string;
  unitCents: number;
  image: string;
};
const button =
  "rounded-xl border border-cl-accent/20 bg-cl-accent/10 px-4 py-2 text-sm font-bold text-cl-ink disabled:opacity-40";
const input =
  "w-full rounded-xl border border-cl-border bg-cl-subtle px-3 py-2 text-cl-ink";
const card = "rounded-2xl border border-cl-border bg-cl-subtle p-5";
const uid = () => crypto.randomUUID();
function readCart(key: string): CartLine[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(data)
      ? data
          .filter(
            (i: any) =>
              typeof i.variantId === "string" &&
              typeof i.productId === "string" &&
              typeof i.name === "string" &&
              typeof i.image === "string" &&
              typeof i.size === "string" &&
              typeof i.color === "string" &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0 &&
              i.quantity <= 50 &&
              Number.isInteger(i.revision) &&
              Number.isInteger(i.unitCents) &&
              i.unitCents > 0,
          )
          .slice(0, 30)
      : [];
  } catch {
    return [];
  }
}
export function OrganizationShop({
  organizationId,
}: {
  organizationId: string;
}) {
  const { user, isAuthenticated } = useAuth();
  return (
    <Store
      key={`${organizationId}:${user?.id ?? "guest"}`}
      org={organizationId}
      signedIn={isAuthenticated}
      scope={String(user?.id ?? "guest")}
    />
  );
}
function Store({
  org,
  signedIn,
  scope,
}: {
  org: string;
  signedIn: boolean;
  scope: string;
}) {
  const storageKey = `cl-merch-cart-v1:${org}:${scope}`,
    base = `organizations/${org}`;
  const [cart, setCart] = useState<CartLine[]>(() => {
      const stored = readCart(storageKey);
      if (scope === "guest") return stored;
      const guest = readCart(`cl-merch-cart-v1:${org}:guest`);
      const combined = [...stored];
      for (const line of guest) {
        const i = combined.findIndex((c) => c.variantId === line.variantId);
        if (i < 0) combined.push(line);
        else
          combined[i] = {
            ...combined[i],
            quantity: Math.min(50, combined[i].quantity + line.quantity),
          };
      }
      return combined.slice(0, 30);
    }),
    [data, setData] = useState<{
      shop: Shop | null;
      items: Product[];
      total: number;
      checkoutReady: boolean;
    } | null>(null),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState<Product | null>(null),
    [accepted, setAccepted] = useState(false),
    [busy, setBusy] = useState(false),
    [showOrders, setShowOrders] = useState(false),
    [orders, setOrders] = useState<Order[]>([]),
    [orderTotal, setOrderTotal] = useState(0),
    [orderPage, setOrderPage] = useState(1),
    [order, setOrder] = useState<Order | null>(null);
  const alive = useRef(true),
    sequence = useRef(0),
    busyRef = useRef(false);
  const pendingCheckout = useRef<{
    signature: string;
    requestId: string;
    orderId?: string;
  } | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      sequence.current++;
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
      if (scope !== "guest")
        localStorage.removeItem(`cl-merch-cart-v1:${org}:guest`);
    } catch {}
    setAccepted(false);
  }, [storageKey, cart]);
  const load = useCallback(async () => {
    const seq = ++sequence.current;
    setLoading(true);
    try {
      const next = await merchRequest<NonNullable<typeof data>>(
        `${base}/products?page=${page}&search=${encodeURIComponent(search)}`,
      );
      if (seq !== sequence.current) return;
      setData(next);
      setAccepted(false);
      setError("");
    } catch (e) {
      if (seq === sequence.current)
        setError(e instanceof Error ? e.message : "Store unavailable.");
    } finally {
      if (seq === sequence.current) setLoading(false);
    }
  }, [base, page, search]);
  useEffect(() => {
    void load();
  }, [load]);
  const action = async (job: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await job();
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const loadOrders = useCallback(async () => {
    const next = await merchRequest<{ items: Order[]; total: number }>(
      `${base}/orders?page=${orderPage}`,
    );
    if (alive.current) {
      setOrders(next.items);
      setOrderTotal(next.total);
    }
  }, [base, orderPage]);
  useEffect(() => {
    if (showOrders && signedIn) void action(loadOrders);
  }, [showOrders, signedIn, loadOrders]);
  const showOrder = async (id: string, valid: () => boolean = () => true) => {
    const next = await merchRequest<Order>(`${base}/orders/${id}`);
    if (!alive.current || !valid()) return;
    setOrder(next);
    let checkoutOrderId: string | undefined;
    try {
      checkoutOrderId = JSON.parse(
        sessionStorage.getItem(storageKey + ":checkout") ?? "null",
      )?.orderId;
    } catch {}
    if (checkoutOrderId === id && next.paymentState === "expired") {
      pendingCheckout.current = null;
      try {
        sessionStorage.removeItem(storageKey + ":checkout");
      } catch {}
    }
    if (
      checkoutOrderId === id &&
      ["paid", "refund_pending", "refunded"].includes(next.paymentState)
    ) {
      setCart((current) =>
        current.filter(
          (c) => !next.lines.some((l) => l.variantId === c.variantId),
        ),
      );
      pendingCheckout.current = null;
      try {
        sessionStorage.removeItem(storageKey + ":checkout");
      } catch {}
    }
  };
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("order");
    if (signedIn && id && /^[a-f0-9-]{36}$/i.test(id))
      void action(async () => {
        setShowOrders(true);
        await showOrder(id);
      });
  }, [signedIn, org]);
  useEffect(() => {
    if (order?.paymentState !== "pending") return;
    const id = order.id;
    let stopped = false;
    const timer = window.setInterval(() => {
      void showOrder(id, () => !stopped).catch(() => undefined);
    }, 5000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [order?.id, order?.paymentState]);
  const add = (p: Product, variantId: string, quantity: number) => {
    const v = p.variants.find((v) => v.id === variantId);
    if (!v?.id) return;
    const existing = cart.find((c) => c.variantId === v.id);
    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (nextQty > Math.min(50, v.available ?? 0)) {
      setError("That quantity is not currently available.");
      return;
    }
    const item: CartLine = {
      variantId: v.id,
      productId: p.id!,
      revision: p.revision,
      quantity: nextQty,
      name: p.name,
      size: v.size,
      color: v.color,
      unitCents: v.priceCents,
      image: p.images[0],
    };
    setCart(
      existing
        ? cart.map((c) => (c.variantId === v.id ? item : c))
        : [...cart, item],
    );
    setSelected(null);
    setNotice("Added to this organization’s cart.");
  };
  const refreshCart = () =>
    action(async () => {
      // Fetch affected product names to validate carts restored from a previous visit without trusting local prices.
      const updated: CartLine[] = [];
      for (const line of cart) {
        let product: Product | null = null;
        try {
          product = await merchRequest<Product>(
            `${base}/products/${line.productId}`,
          );
        } catch (e) {
          if (!(e instanceof MerchError) || e.status !== 404) throw e;
        }
        const v = product?.variants.find((v) => v.id === line.variantId);
        if (product && v?.id && (v.available ?? 0) > 0)
          updated.push({
            ...line,
            revision: product.revision,
            unitCents: v.priceCents,
            name: product.name,
            image: product.images[0],
            size: v.size,
            color: v.color,
            quantity: Math.min(line.quantity, v.available ?? 0),
          });
      }
      setCart(updated);
      await load();
      setNotice(
        "Cart updated to current prices and stock. Please review it and accept the current policies.",
      );
    });
  const subtotal = cart.reduce((sum, c) => sum + c.quantity * c.unitCents, 0);
  const checkout = () =>
    action(async () => {
      if (!data?.shop || !signedIn || !accepted || !cart.length) return;
      const items = cart.map((c) => ({
        variantId: c.variantId,
        quantity: c.quantity,
        revision: c.revision,
      }));
      const signature = JSON.stringify({ items, revision: data.shop.revision });
      let previous = pendingCheckout.current;
      try {
        previous =
          JSON.parse(
            sessionStorage.getItem(storageKey + ":checkout") ?? "null",
          ) ?? previous;
      } catch {}
      const pending: {
        signature: string;
        requestId: string;
        orderId?: string;
      } =
        previous?.signature === signature
          ? previous
          : { signature, requestId: uid() };
      pendingCheckout.current = pending;
      try {
        sessionStorage.setItem(
          storageKey + ":checkout",
          JSON.stringify(pending),
        );
      } catch {}
      const result = await merchRequest<{ url: string; orderId: string }>(
        `${base}/checkout`,
        {
          requestId: pending.requestId,
          policyRevision: data.shop.revision,
          acceptedPolicies: true,
          items,
        },
      );
      if (!alive.current) return;
      pending.orderId = result.orderId;
      try {
        sessionStorage.setItem(
          storageKey + ":checkout",
          JSON.stringify(pending),
        );
      } catch {}
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
        throw new Error("Payment redirect unavailable.");
      window.location.assign(url.toString());
    });
  return (
    <section
      className="mt-6 space-y-5 text-cl-ink"
      aria-label="Organization shop"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Organization Shop</h2>
          <p className="text-sm text-cl-muted">
            Official merchandise • US shipping • Secure Stripe checkout
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={button}
            disabled={busy}
            onClick={() => void load()}
          >
            Refresh
          </button>
          {signedIn ? (
            <button
              className={button}
              disabled={busy}
              onClick={() => setShowOrders(!showOrders)}
            >
              {showOrders ? "Products" : "My orders"}
            </button>
          ) : (
            <a className={button} href="/auth">
              Sign in to purchase
            </a>
          )}
        </div>
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm">
          {notice}
        </p>
      ) : null}
      {loading ? <p>Loading store…</p> : null}
      {showOrders ? (
        <div className="space-y-3">
          <h3 className="text-lg font-bold">My orders ({orderTotal})</h3>
          {orders.map((o) => (
            <button
              key={o.id}
              className={card + " block w-full text-left"}
              disabled={busy}
              onClick={() => void action(() => showOrder(o.id))}
            >
              <strong>{o.id.slice(0, 8)}</strong> • {o.paymentState} •{" "}
              {o.fulfillment}
              <p>
                {o.lines.map((l) => `${l.name} × ${l.quantity}`).join(", ")}
              </p>
              <p>
                {o.totalCents ? money(o.totalCents) : "Awaiting payment"} •{" "}
                {new Date(o.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
          {!orders.length ? <p>No orders with this organization yet.</p> : null}
          <div className="flex gap-2">
            <button
              className={button}
              disabled={busy || orderPage === 1}
              onClick={() => setOrderPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className={button}
              disabled={busy || orderPage * 12 >= orderTotal}
              onClick={() => setOrderPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : !loading && !data?.shop ? (
        <p className={card}>This organization hasn’t opened its store yet.</p>
      ) : data?.shop ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div>
            <label className="block mb-4">
              Search merchandise
              <input
                className={input + " mt-1"}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Product or category"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((p) => (
                <button
                  key={p.id}
                  className={
                    card +
                    " overflow-hidden text-left transition hover:border-cl-accent/40"
                  }
                  onClick={() => setSelected(p)}
                >
                  <img
                    className="aspect-square w-full rounded-xl object-cover"
                    loading="lazy"
                    src={p.images[0]}
                    alt={p.name}
                  />
                  <p className="mt-3 text-xs uppercase text-cl-muted">
                    {p.category || "Official merchandise"}
                  </p>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p>
                    {p.variants.length
                      ? `From ${money(Math.min(...p.variants.map((v) => v.priceCents)))}`
                      : "Unavailable"}
                  </p>
                  <p className="text-xs text-cl-muted">
                    {p.variants.some((v) => (v.available ?? 0) > 0)
                      ? "Choose size and color"
                      : "Sold out"}
                  </p>
                </button>
              ))}
            </div>
            {!data.items.length ? <p>No products match your search.</p> : null}
            <div className="mt-4 flex items-center gap-3">
              <button
                className={button}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                {data.total} products • Page {page}
              </span>
              <button
                className={button}
                disabled={page * 12 >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
          <aside
            className={card + " h-fit space-y-4"}
            aria-label="Shopping cart"
          >
            <h3 className="text-xl font-black">
              Your cart ({cart.reduce((n, c) => n + c.quantity, 0)})
            </h3>
            <p className="text-xs text-cl-muted">
              Items from this organization only. Stock is reserved when checkout
              starts.
            </p>
            {cart.map((c) => (
              <div key={c.variantId} className="border-b border-cl-border pb-3">
                <div className="flex gap-3">
                  <img
                    src={c.image}
                    className="h-14 w-14 rounded-lg object-cover"
                    alt=""
                  />
                  <div>
                    <strong>{c.name}</strong>
                    <p className="text-xs">
                      {c.size} / {c.color}
                    </p>
                    <p>{money(c.unitCents)}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <label className="text-xs">
                    Quantity
                    <input
                      className={input + " mt-1 max-w-20"}
                      type="number"
                      min={1}
                      max={50}
                      disabled={busy}
                      value={c.quantity}
                      onChange={(e) => {
                        const q = Number(e.target.value);
                        if (Number.isInteger(q) && q > 0 && q <= 50)
                          setCart(
                            cart.map((i) =>
                              i.variantId === c.variantId
                                ? { ...i, quantity: q }
                                : i,
                            ),
                          );
                      }}
                    />
                  </label>
                  <button
                    className={button}
                    disabled={busy}
                    onClick={() =>
                      setCart(cart.filter((i) => i.variantId !== c.variantId))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!cart.length ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                <p>Items: {money(subtotal)}</p>
                <p>Shipping: {money(data.shop.shippingCents)}</p>
                <p className="text-xs text-cl-muted">
                  Tax is calculated at checkout. Final total appears before
                  payment.
                </p>
                <button
                  className={button + " w-full"}
                  disabled={busy}
                  onClick={() => void refreshCart()}
                >
                  Refresh cart prices and stock
                </button>
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                  />
                  I agree to the store terms and acknowledge the shipping,
                  returns, and privacy policies below.
                </label>
                <button
                  className={button + " w-full"}
                  disabled={
                    busy || !accepted || !signedIn || !data.checkoutReady
                  }
                  onClick={() => void checkout()}
                >
                  {busy ? "Please wait…" : "Secure checkout"}
                </button>
                {!data.checkoutReady ? (
                  <p className="text-xs">
                    Checkout is awaiting the seller’s payment setup.
                  </p>
                ) : null}
              </>
            )}
          </aside>
        </div>
      ) : null}
      {data?.shop ? (
        <div className={card + " space-y-3"}>
          <h3 className="font-bold">Sold by {data.shop.policies.sellerName}</h3>
          <p className="text-sm">
            Support:{" "}
            <a
              className="underline"
              href={`mailto:${data.shop.policies.supportEmail}`}
            >
              {data.shop.policies.supportEmail}
            </a>{" "}
            • Dispatch within {data.shop.policies.dispatchDays} business days •
            Return window: {data.shop.policies.returnDays} calendar days after
            delivery
          </p>
          {(
            [
              "shippingPolicy",
              "returnPolicy",
              "privacyPolicy",
              "terms",
            ] as const
          ).map((key) => (
            <details key={key}>
              <summary className="cursor-pointer font-semibold">
                {
                  {
                    shippingPolicy: "Shipping policy",
                    returnPolicy: "Returns policy",
                    privacyPolicy: "Privacy policy",
                    terms: "Store terms",
                  }[key]
                }
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {data.shop!.policies[key]}
              </p>
            </details>
          ))}
        </div>
      ) : null}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          {selected ? (
            <ProductDetail key={selected.id} product={selected} add={add} />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!order}
        onOpenChange={(open) => {
          if (!open) setOrder(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          {order ? (
            <OrderDetail
              key={order.id}
              order={order}
              busy={busy}
              act={(job) =>
                void action(async () => {
                  await job();
                  await showOrder(order.id);
                  await loadOrders();
                })
              }
              base={base}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
function ProductDetail({
  product: p,
  add,
}: {
  product: Product;
  add: (p: Product, id: string, quantity: number) => void;
}) {
  const [image, setImage] = useState(p.images[0]),
    [variant, setVariant] = useState(p.variants[0]?.id ?? ""),
    [quantity, setQuantity] = useState(1);
  const v = p.variants.find((v) => v.id === variant);
  return (
    <>
      <DialogTitle>{p.name}</DialogTitle>
      <DialogDescription>
        Choose your size, color, and quantity.
      </DialogDescription>
      <img
        src={image}
        alt={p.name}
        className="aspect-square max-h-80 w-full rounded-xl object-contain"
      />
      <div className="flex flex-wrap gap-2">
        {p.images.map((url, i) => (
          <button
            key={url}
            aria-label={`View image ${i + 1}`}
            onClick={() => setImage(url)}
          >
            <img
              src={url}
              alt=""
              className="h-16 w-16 rounded-lg object-cover"
            />
          </button>
        ))}
      </div>
      <p className="whitespace-pre-wrap">{p.description}</p>
      <label>
        Size and color
        <select
          className={input + " mt-1"}
          value={variant}
          onChange={(e) => {
            setVariant(e.target.value);
            setQuantity(1);
          }}
        >
          {p.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.size || "One size"} / {v.color || "Standard"} —{" "}
              {money(v.priceCents)}{" "}
              {(v.available ?? 0) > 0
                ? `(${v.available} available)`
                : "(Sold out)"}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity
        <input
          className={input + " mt-1"}
          type="number"
          value={quantity}
          min={1}
          max={Math.min(50, v?.available ?? 0)}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </label>
      <button
        className={button}
        disabled={
          !v?.id ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > Math.min(50, v.available ?? 0)
        }
        onClick={() => add(p, variant, quantity)}
      >
        Add to cart {v ? money(v.priceCents * quantity) : ""}
      </button>
    </>
  );
}
function OrderDetail({
  order: o,
  busy,
  act,
  base,
}: {
  order: Order;
  busy: boolean;
  act: (job: () => Promise<void>) => void;
  base: string;
}) {
  const [reason, setReason] = useState(""),
    [kind, setKind] = useState<"support" | "return">("support");
  const caseRequest = useRef<{ key: string; id: string } | null>(null);
  return (
    <>
      <DialogTitle>Order {o.id.slice(0, 8)}</DialogTitle>
      <DialogDescription>
        {o.paymentState} • {o.fulfillment}
      </DialogDescription>
      {o.lines.map((l) => (
        <p key={l.variantId}>
          {l.name} • {l.size} / {l.color} × {l.quantity} —{" "}
          {money(l.unitCents * l.quantity)}
        </p>
      ))}
      <p>
        Items {money(o.subtotalCents)} • Shipping {money(o.shippingCents)} • Tax{" "}
        {money(o.taxCents)}
      </p>
      <p className="font-bold">
        {o.paymentState === "pending"
          ? "Awaiting payment confirmation"
          : `Total ${money(o.totalCents)}`}
      </p>
      {o.refundedCents > 0 ? (
        <p>Refund issued: {money(o.refundedCents)}</p>
      ) : null}
      {o.tracking ? (
        <a
          className={button + " block"}
          href={o.tracking.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Track with {o.tracking.carrier}: {o.tracking.number}
        </a>
      ) : null}
      <p className="text-sm">Seller support: {o.policies.supportEmail}</p>
      {o.paymentState === "pending" ? (
        <button
          className={button}
          disabled={busy}
          onClick={() =>
            act(async () => {
              await merchRequest(`${base}/orders/${o.id}/cancel`, {});
            })
          }
        >
          Cancel unpaid checkout
        </button>
      ) : null}
      {["paid", "refunded", "refund_pending", "review"].includes(
        o.paymentState,
      ) ? (
        <div className="space-y-2 border-t pt-3">
          <h4 className="font-bold">Customer service</h4>
          <label>
            Request type
            <select
              className={input}
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="support">Support / cancellation / issue</option>
              <option value="return">Entire order return request</option>
            </select>
          </label>
          <label>
            Your request
            <textarea
              className={input}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={2000}
            />
          </label>
          <button
            className={button}
            disabled={busy || reason.trim().length < 5}
            onClick={() =>
              act(async () => {
                const key = JSON.stringify({ kind, reason });
                if (caseRequest.current?.key !== key)
                  caseRequest.current = { key, id: uid() };
                await merchRequest(`${base}/orders/${o.id}/cases`, {
                  kind,
                  reason,
                  requestId: caseRequest.current.id,
                });
                setReason("");
              })
            }
          >
            Send request
          </button>
        </div>
      ) : null}
      <OrderOperations order={o} base={base} busy={busy} act={act} />
      {o.cases?.map((c) => (
        <CustomerCase
          key={c.id}
          value={c}
          busy={busy}
          send={async (text, id) => {
            await merchRequest(`${base}/orders/${o.id}/cases/${c.id}/reply`, {
              text,
              requestId: id,
            });
          }}
          act={act}
        />
      ))}
      <details>
        <summary>Policies accepted with this order</summary>
        <p className="whitespace-pre-wrap text-sm">
          {o.policies.shippingPolicy}\n{o.policies.returnPolicy}\n
          {o.policies.terms}\n{o.policies.privacyPolicy}
        </p>
      </details>
    </>
  );
}
function CustomerCase({
  value: c,
  busy,
  send,
  act,
}: {
  value: Case;
  busy: boolean;
  send: (text: string, id: string) => Promise<void>;
  act: (job: () => Promise<void>) => void;
}) {
  const [text, setText] = useState("");
  const pending = useRef<{ text: string; id: string } | null>(null);
  return (
    <div className="space-y-2 rounded-xl border p-3">
      <h4 className="font-bold">
        {c.kind} • {c.status}
      </h4>
      <p>{c.reason}</p>
      {c.selection?.map((l) => (
        <p key={l.variantId} className="text-xs">
          Item {l.variantId.slice(0, 8)} × {l.quantity} •{" "}
          {c.resolution ?? "refund"}
        </p>
      ))}
      {c.messages.map((m) => (
        <p key={m.id} className="whitespace-pre-wrap text-sm">
          <strong>{m.staff ? "Seller" : "You"}:</strong> {m.text}
        </p>
      ))}
      <label>
        Reply
        <textarea
          className={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />
      </label>
      <button
        className={button}
        disabled={busy || !text.trim()}
        onClick={() =>
          act(async () => {
            if (pending.current?.text !== text)
              pending.current = { text, id: uid() };
            await send(text, pending.current.id);
            setText("");
          })
        }
      >
        Send reply
      </button>
    </div>
  );
}
