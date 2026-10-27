import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import NewsletterForm from "@/components/marketing/NewsletterForm";
import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
export default function EmailUpdates() {
  const [proof] = useState(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    return {
      token: hash.get("confirm") || hash.get("unsubscribe") || "",
      action: hash.has("confirm") ? "confirm" : "unsubscribe",
    };
  });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const writing = useRef(false);
  useEffect(() => {
    if (window.location.hash)
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
  }, []);
  async function perform() {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      const r = unwrapSportData<{ message: string }>(
        await apiRequest(
          "POST",
          `/marketing/${proof.action}`,
          { token: proof.token },
          { refreshOn401: false, logoutOn401: false },
        ),
      );
      setMessage(
        r.message ||
          (proof.action === "confirm"
            ? "Your email subscription is confirmed."
            : "You have been unsubscribed from marketing emails."),
      );
    } catch (e) {
      setError(
        "We couldn’t update your email preferences. Please try again. If this link has expired, request a new subscription email.",
      );
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 text-cl-ink">
      <Link href="/" className="text-sm underline">
        Corner League home
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Email updates</h1>
      {proof.token ? (
        <section className="mt-6 rounded-2xl border border-cl-border bg-cl-surface p-6">
          <h2 className="text-xl font-semibold">
            {proof.action === "confirm"
              ? "Confirm your subscription"
              : "Stop Corner League marketing emails"}
          </h2>
          <p className="mt-3">
            {proof.action === "confirm"
              ? "Confirm that you requested optional Corner League news and promotions."
              : "This affects Corner League marketing. Your account, receipts and organization messages are unchanged."}
          </p>
          {message ? (
            <p role="status" className="mt-4">
              {message}
            </p>
          ) : (
            <button
              disabled={busy || !/^[a-f0-9]{64}$/.test(proof.token)}
              onClick={() => void perform()}
              className="mt-5 min-h-11 rounded-xl bg-cl-accent px-5 py-3 font-semibold text-cl-contrast disabled:opacity-50"
            >
              {busy
                ? "Updating…"
                : proof.action === "confirm"
                  ? "Confirm email updates"
                  : "Unsubscribe"}
            </button>
          )}
          {error ? (
            <p role="alert" className="mt-4 text-red-500">
              {error}
            </p>
          ) : null}
        </section>
      ) : (
        <NewsletterForm source="consumer-updates" />
      )}
      <p className="mt-6 text-sm text-cl-muted">
        Campaign emails also include a Resend unsubscribe/preferences link. No
        account login is required to use it.
      </p>
    </main>
  );
}
