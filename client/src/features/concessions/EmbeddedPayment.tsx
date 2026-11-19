import { useEffect, useRef, useState } from "react";
type Checkout = { mount: (node: HTMLElement) => void; destroy: () => void };
type StripeFactory = (
  key: string,
  options: { stripeAccount: string },
) => {
  initEmbeddedCheckout: (options: {
    clientSecret: string;
    onComplete: () => void;
  }) => Promise<Checkout>;
};
let loading: Promise<StripeFactory> | null = null;
function loadStripe(): Promise<StripeFactory> {
  const factory = () =>
    (window as unknown as { Stripe?: StripeFactory }).Stripe;
  if (factory()) return Promise.resolve(factory()!);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    const timer = window.setTimeout(() => {
      script.remove();
      loading = null;
      reject(new Error("Payment form timed out. Please retry."));
    }, 20000);
    script.onload = () => {
      clearTimeout(timer);
      const stripe = factory();
      if (stripe) resolve(stripe);
      else {
        loading = null;
        reject(new Error("Payment form unavailable."));
      }
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      loading = null;
      reject(
        new Error(
          "Unable to load the secure payment form. Check your connection and retry.",
        ),
      );
    };
    document.head.appendChild(script);
  });
  return loading;
}
export function EmbeddedPayment({
  clientSecret,
  publishableKey,
  connectedAccount,
  onComplete,
}: {
  clientSecret: string;
  publishableKey: string;
  connectedAccount: string;
  onComplete: () => void;
}) {
  const node = useRef<HTMLDivElement>(null),
    complete = useRef(onComplete);
  const [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [ready, setReady] = useState(false);
  complete.current = onComplete;
  useEffect(() => {
    let cancelled = false,
      checkout: Checkout | undefined;
    setError("");
    setReady(false);
    void loadStripe()
      .then((factory) =>
        factory(publishableKey, {
          stripeAccount: connectedAccount,
        }).initEmbeddedCheckout({
          clientSecret,
          onComplete: () => complete.current(),
        }),
      )
      .then((instance) => {
        if (cancelled) instance.destroy();
        else {
          checkout = instance;
          if (node.current) instance.mount(node.current);
          setReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Payment form unavailable.",
          );
      });
    return () => {
      cancelled = true;
      checkout?.destroy();
    };
  }, [clientSecret, publishableKey, connectedAccount, attempt]);
  return (
    <div>
      {!ready && !error && <p role="status">Loading secure payment…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            className="cc-button"
            onClick={() => setAttempt((v) => v + 1)}
          >
            Retry payment form
          </button>
        </div>
      )}
      <div ref={node} />
    </div>
  );
}
