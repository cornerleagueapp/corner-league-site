import { getAnonymousId, getPersistedUtmParams } from "@/lib/analytics";
import { apiFetch } from "@/lib/apiClient";

function extractTotalViews(payload: any): number {
  const raw =
    payload?.totalViews ??
    payload?.data?.totalViews ??
    payload?.count ??
    payload?.data?.count ??
    0;

  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export async function trackRacerProfileViewToBackend({
  racerDetailId,
  athleteId,
  racerName,
  viewerUserId,
}: {
  racerDetailId: string;
  athleteId?: string;
  racerName?: string;
  viewerUserId?: string | null;
}) {
  const utms = getPersistedUtmParams();

  const res = await apiFetch("/analytics/racer-profile-view", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    skipAuth: true,
    noRefresh: true,
    body: JSON.stringify({
      racerDetailId,
      athleteId,
      racerName,
      viewerUserId: viewerUserId ?? undefined,
      anonymousId: getAnonymousId(),
      sourcePage: "racer_profile",
      pageUrl: window.location.href,
      referrer: document.referrer,
      utmSource: utms.utm_source,
      utmMedium: utms.utm_medium,
      utmCampaign: utms.utm_campaign,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to track racer profile view");
  }

  const payload = await res.json();

  return {
    success: !!payload?.success,
    counted: !!payload?.counted,
    totalViews: extractTotalViews(payload),
  };
}

export async function getRacerProfileViewCount(racerDetailId: string) {
  const res = await apiFetch(
    `/analytics/racer-profile-view/${encodeURIComponent(racerDetailId)}/count`,
    {
      method: "GET",
      skipAuth: true,
      noRefresh: true,
    },
  );

  if (!res.ok) {
    throw new Error("Failed to load racer profile view count");
  }

  const payload = await res.json();

  return {
    racerDetailId: payload?.racerDetailId ?? racerDetailId,
    totalViews: extractTotalViews(payload),
  };
}
