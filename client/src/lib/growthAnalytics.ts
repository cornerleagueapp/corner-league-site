import { apiFetch } from "@/lib/apiClient";
const observed = new Set<string>();
// A 30-minute inactivity window; do not retain attribution indefinitely.
export function growthAttribution() {
  try {
    const key = "cl-growth-journey-v1";
    const now = Date.now();
    const raw = JSON.parse(sessionStorage.getItem(key) || "null");
    const current = raw && now - raw.updatedAt < 30 * 60 * 1000 ? raw : { journeyId: crypto.randomUUID() };
    const params = new URLSearchParams(window.location.search);
    if (["utm_source", "utm_medium", "utm_campaign"].some(k => params.has(k))) { delete current.source; delete current.medium; delete current.campaign; }
    for (const [field, param] of [["source", "utm_source"], ["medium", "utm_medium"], ["campaign", "utm_campaign"]]) {
      const value = params.get(param);
      if (value) current[field] = value.slice(0, 100);
    }
    current.updatedAt = now;
    sessionStorage.setItem(key, JSON.stringify(current));
    return { journeyId: current.journeyId as string, source: current.source as string | undefined,
      medium: current.medium as string | undefined, campaign: current.campaign as string | undefined };
  } catch { return undefined; }
}
export function trackGrowth(name: "Event Viewed" | "Registration Started" | "Livestream Clicked", eventId: string) {
  try {
    if (!eventId) return;
    const attribution = growthAttribution();
    if (!attribution) return;
    const key = `cl-growth:${name}:${eventId}:${attribution.journeyId}`;
    if (observed.has(key)) return;
    if (observed.size >= 200) observed.clear();
    observed.add(key);
    void apiFetch("/analytics/growth/events", { method: "POST", skipAuth: true, noRefresh: true,
      body: { id: crypto.randomUUID(), name, eventId, ...attribution } }).then(res => {
        if (!res.ok) observed.delete(key);
      }).catch(() => { try { observed.delete(key); } catch { /* analytics is optional */ } });
  } catch { /* Storage, UUID or tracking failure must never affect registration. */ }
}
