import { apiFetch, apiRequest } from "./apiClient";
export type MarketingStatus = {
  enabled: boolean;
  consentText: string;
  email: string;
  status: "none" | "pending" | "confirmed" | "unsubscribed";
  delivery: "none" | "pending" | "synced" | "suppressed" | "error";
  promptEligible: boolean;
};
export async function readMarketingStatus(): Promise<MarketingStatus> {
  const json = await apiRequest("GET", "/marketing/me", undefined, {
    refreshOn401: false,
    logoutOn401: false,
  });
  return json.data ?? json;
}
export async function saveSignupMarketing(
  token: string,
  enabled: boolean,
  checked: boolean,
): Promise<string | null> {
  if (!enabled) return null;
  try {
    const res = await apiFetch(
      checked ? "/marketing/me/subscribe" : "/marketing/me/prompt/dismiss",
      {
        method: "POST",
        skipAuth: true,
        noRefresh: true,
        headers: { Authorization: `Bearer ${token}` },
        body: checked
          ? { consent: true, adult: true, source: "consumer-signup" }
          : {},
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) throw new Error("preference_unavailable");
    if (!checked) return null;
    const json = await res.json().catch(() => null),
      data = json?.data ?? json;
    return typeof data?.message === "string"
      ? data.message
      : "Check your inbox to confirm optional Corner League email updates.";
  } catch {
    return "Your account is ready. Email preferences could not be saved; manage them on your Notifications page.";
  }
}
export function marketingLabel(s: MarketingStatus) {
  if (s.status === "pending") return "Awaiting email confirmation";
  if (s.status === "confirmed")
    return s.delivery === "suppressed"
      ? "Paused by your email provider preferences"
      : "Subscribed to Corner League email updates";
  return "Marketing emails are off";
}
