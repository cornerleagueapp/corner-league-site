import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/apiClient";
import { publicSportData } from "@/lib/sportRegistration";
export default function NewsletterForm({
  source = "consumer-footer",
  layout = "card",
}: {
  source?: "consumer-footer" | "consumer-updates";
  layout?: "card" | "footer";
}) {
  const config = useQuery<{ enabled: boolean; consentText: string }>({
    queryKey: ["marketing-config"],
    queryFn: () => publicSportData("/marketing/config"),
    staleTime: 300000,
    retry: false,
  });
  const [email, setEmail] = useState(""),
    [checked, setChecked] = useState(false),
    [website, setWebsite] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const writing = useRef(false);
  if (!config.data?.enabled) return null;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (writing.current || !checked) return;
    writing.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(
        "POST",
        "/marketing/subscribe",
        {
          email: email.trim(),
          consent: checked,
          adult: checked,
          source,
          website,
        },
        { refreshOn401: false, logoutOn401: false },
      );
      setMessage(
        "Check your inbox to confirm your email. You won't receive campaigns until you verify it.",
      );
      setChecked(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={(e) => void submit(e)}
      className={
        layout === "footer"
          ? "consumer-newsletter--footer"
          : "consumer-newsletter--wide mt-6 w-full rounded-2xl border border-cl-border bg-cl-surface p-5"
      }
      aria-label="Corner League email updates"
    >
      <div className="newsletter-intro">
        <h2 className="text-lg font-bold">Stay in the loop</h2>
        <p className="mt-2 text-sm text-cl-muted">
          Optional Corner League news, platform updates and promotions.
        </p>
      </div>
      <div className="newsletter-fields">
        <label className="newsletter-email mt-4 block text-sm">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="mt-2 min-h-11 w-full rounded-xl border border-cl-border bg-cl-canvas p-3"
          />
        </label>
        <div aria-hidden="true" className="absolute -left-[10000px]">
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>
        <label className="newsletter-consent mt-4 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            required
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={busy}
            className="mt-1"
          />
          <span>{config.data.consentText}</span>
        </label>
        <Link
          href="/terms"
          className="newsletter-terms mt-3 inline-block text-sm underline"
        >
          Terms & privacy
        </Link>
        <button
          type="submit"
          disabled={busy || !checked}
          className="newsletter-submit mt-4 block min-h-11 rounded-xl bg-cl-accent px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Subscribe"}
        </button>
        {message ? (
          <p role="status" className="mt-3 text-sm">
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
