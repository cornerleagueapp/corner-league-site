import mixpanel from "mixpanel-browser";

declare global {
  interface Window {
    dataLayer?: Record<string, any>[];
  }
}

type AnalyticsEventProperties = Record<
  string,
  string | number | boolean | null | undefined | string[]
>;

type AnalyticsUserProperties = {
  id: string;
  email?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  role?: string | null;
  sportsInterests?: string[] | string | null;
};

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;
const APP_ENV = import.meta.env.VITE_APP_ENV || "development";

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];

  if (MIXPANEL_TOKEN) {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: APP_ENV !== "production",
      track_pageview: false,
      persistence: "localStorage",
    });
  }

  initialized = true;
}

export function getUtmParams() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    utm_term: params.get("utm_term") || undefined,
  };
}

export function persistUtmParams() {
  if (typeof window === "undefined") return;

  const utms = getUtmParams();
  const hasUtm = Object.values(utms).some(Boolean);

  if (!hasUtm) return;

  localStorage.setItem(
    "cornerLeagueUtms",
    JSON.stringify({
      ...utms,
      capturedAt: new Date().toISOString(),
      landingPage: window.location.pathname,
    }),
  );
}

export function getPersistedUtmParams() {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem("cornerLeagueUtms");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getAnonymousId() {
  if (typeof window === "undefined") return undefined;

  const key = "cornerLeagueAnonymousId";
  let anonymousId = localStorage.getItem(key);

  if (!anonymousId) {
    anonymousId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(key, anonymousId);
  }

  return anonymousId;
}

export function trackEvent(
  eventName: string,
  properties: AnalyticsEventProperties = {},
) {
  if (typeof window === "undefined") return;

  const utmProperties = getPersistedUtmParams();

  const eventPayload = {
    event: eventName,
    anonymous_id: getAnonymousId(),
    ...utmProperties,
    ...properties,
    app_env: APP_ENV,
    page_path: window.location.pathname,
    page_url: window.location.href,
    timestamp: new Date().toISOString(),
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventPayload);

  if (MIXPANEL_TOKEN) {
    mixpanel.track(eventName, eventPayload);
  }
}

/**
 * Identifies a signed-in user in Mixpanel.
 *
 * Supports both:
 * identifyUser({ id, email, username, ... })
 *
 * and the old signature:
 * identifyUser(userId, properties)
 */
export function identifyUser(
  userOrId: AnalyticsUserProperties | string,
  legacyProperties: AnalyticsEventProperties = {},
) {
  if (typeof window === "undefined") return;

  const user: AnalyticsUserProperties =
    typeof userOrId === "string"
      ? {
          id: userOrId,
          email:
            typeof legacyProperties.email === "string"
              ? legacyProperties.email
              : null,
          username:
            typeof legacyProperties.username === "string"
              ? legacyProperties.username
              : null,
          firstName:
            typeof legacyProperties.first_name === "string"
              ? legacyProperties.first_name
              : typeof legacyProperties.firstName === "string"
                ? legacyProperties.firstName
                : null,
          lastName:
            typeof legacyProperties.last_name === "string"
              ? legacyProperties.last_name
              : typeof legacyProperties.lastName === "string"
                ? legacyProperties.lastName
                : null,
          city:
            typeof legacyProperties.city === "string"
              ? legacyProperties.city
              : null,
          state:
            typeof legacyProperties.state === "string"
              ? legacyProperties.state
              : null,
          role:
            typeof legacyProperties.role === "string"
              ? legacyProperties.role
              : null,
          sportsInterests:
            typeof legacyProperties.sports_interests === "string" ||
            Array.isArray(legacyProperties.sports_interests)
              ? legacyProperties.sports_interests
              : null,
        }
      : userOrId;

  if (!user?.id) return;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  const sportsInterests = Array.isArray(user.sportsInterests)
    ? user.sportsInterests.join(",")
    : (user.sportsInterests ?? undefined);

  const userProperties = {
    user_id: user.id,
    email: user.email ?? undefined,
    username: user.username ?? undefined,
    name: fullName || user.username || user.email || user.id,
    first_name: user.firstName ?? undefined,
    last_name: user.lastName ?? undefined,
    city: user.city ?? undefined,
    state: user.state ?? undefined,
    role: user.role ?? undefined,
    sports_interests: sportsInterests,
    signed_in: true,
  };

  if (MIXPANEL_TOKEN) {
    mixpanel.identify(user.id);

    mixpanel.people.set({
      ...userProperties,
      last_seen_at: new Date().toISOString(),
    });

    mixpanel.register({
      user_id: user.id,
      username: user.username ?? undefined,
      city: user.city ?? undefined,
      state: user.state ?? undefined,
      role: user.role ?? undefined,
      sports_interests: sportsInterests,
      signed_in: true,
    });
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "User Identified",
    ...userProperties,
    app_env: APP_ENV,
    page_path: window.location.pathname,
    page_url: window.location.href,
    timestamp: new Date().toISOString(),
  });
}

export function clearAnalyticsUser() {
  if (typeof window === "undefined") return;

  if (MIXPANEL_TOKEN) {
    mixpanel.unregister("user_id");
    mixpanel.unregister("username");
    mixpanel.unregister("city");
    mixpanel.unregister("state");
    mixpanel.unregister("role");
    mixpanel.unregister("sports_interests");
    mixpanel.unregister("signed_in");

    mixpanel.reset();
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "User Cleared",
    signed_in: false,
    app_env: APP_ENV,
    page_path: window.location.pathname,
    page_url: window.location.href,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Backwards-compatible alias.
 * Keep this in case existing files import resetAnalyticsUser().
 */
export function resetAnalyticsUser() {
  clearAnalyticsUser();
}
