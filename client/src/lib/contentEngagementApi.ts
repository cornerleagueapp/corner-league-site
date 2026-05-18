import { getAnonymousId } from "@/lib/analytics";
import { apiFetch } from "@/lib/apiClient";

export type ContentEngagementPayload = {
  contentType: "organization" | "event" | "division";
  action:
    | "organization_viewed"
    | "organization_clicked"
    | "organization_schedule_opened"
    | "event_details_viewed"
    | "division_result_viewed";
  contentId: string;
  contentName?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  eventId?: string | null;
  eventName?: string | null;
  divisionId?: string | null;
  divisionName?: string | null;
  viewerUserId?: string | null;
  sport?: string | null;
  sourcePage?: string | null;
};

export async function trackContentEngagementToBackend(
  payload: ContentEngagementPayload,
) {
  const res = await apiFetch("/analytics/content-engagement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    skipAuth: true,
    noRefresh: true,
    body: JSON.stringify({
      ...payload,
      anonymousId: getAnonymousId(),
      pageUrl: window.location.href,
      referrer: document.referrer,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to track content engagement");
  }

  return res.json();
}
