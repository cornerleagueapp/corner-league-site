// scripts/make-sitemap.mjs
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const ORIGIN = process.env.SITE_ORIGIN || "https://www.cornerleague.com";
const API_BASE = process.env.CL_API_URL;

// Public static routes from src/App.tsx
const staticRoutes = [
  "/",
  "/home",
  "/about",
  "/contact",
  "/terms",
  "/scores",
  "/scores/aqua",
  "/aqua-organizations",
  "/event-map",
  "/top-trends",
  "/podcast-episodes",
  "/polls",
  "/community",
  "/articles",
];

// Private/admin/auth routes should NOT be indexed:
// /auth, /welcome, /settings, /messages, /notifications,
// /profile, /feed, /explore, /create-club, /club-settings/:id,
// /admin/*, /organization/*, /events/create

export function addCommunityDirectories(xml) {
  if (!/<urlset\b/.test(xml) || !/<\/urlset>\s*$/.test(xml))
    throw new Error("Existing sitemap is invalid.");
  const first =
    xml.match(/<loc>([^<]+)<\/loc>/)?.[1] || "https://www.cornerleague.com/";
  const origin = new URL(first).origin;
  if (!/^https?:\/\//.test(origin))
    throw new Error("Sitemap origin must use HTTP or HTTPS.");
  const urls = ["/community", "/articles"].map((path) => origin + path);
  const additions = urls
    .filter((url) => !xml.includes(`<loc>${url}</loc>`))
    .map(
      (url) =>
        `<url><loc>${url}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    )
    .join("");
  return xml.replace("</urlset>", `${additions}</urlset>`);
}

function normalizeBaseUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function fetchJson(path) {
  if (!API_BASE) return null;

  const url = `${normalizeBaseUrl(API_BASE)}${path}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.log(`[sitemap] failed ${url}:`, error?.message || error);
    return null;
  }
}

async function fetchOrganizationPaths() {
  // Adjust this endpoint if your backend route name differs.
  // Your frontend route is: /aqua-organizations/:id
  const collected = [];
  for (let page = 1; page <= 100; page++) {
    const response = await fetchJson(`/organizations?page=${page}&limit=50`);
    const data = response?.data ?? response;
    const rows = data?.organizations ?? data?.items ?? (Array.isArray(data) ? data : []);
    if (!Array.isArray(rows)) break;
    collected.push(...rows);
    if (!data?.meta?.hasNextPage) break;
  }
  const json = { organizations: collected };

  const organizations =
    json?.data?.organizations ??
    json?.data?.items ??
    json?.organizations ??
    json?.items ??
    json?.data ??
    json ??
    [];

  return (Array.isArray(organizations) ? organizations : [])
    .map((org) => {
      const id = org?.slug || org?.id;
      if (org?.isTest) return null;
      if (!id) return null;
      const sport = org?.primarySportKey;
      return sport && sport !== "jet-ski" ? `/sports/${encodeURIComponent(sport)}/organizations/${encodeURIComponent(id)}` : `/aqua-organizations/${id}`;
    })
    .filter(Boolean);
}

async function fetchEventPaths() {
  // Adjust this endpoint if your backend route name differs.
  // Your frontend route is: /aqua-organizations/event-details/:id
  const json = await fetchJson("/sport-event/events?limit=1000");

  const events =
    json?.data?.events ??
    json?.data?.items ??
    json?.events ??
    json?.items ??
    json?.data ??
    json ??
    [];

  return (Array.isArray(events) ? events : [])
    .map((event) => {
      const id = event?.slug || event?.id;
      return id ? `/aqua-organizations/event-details/${id}` : null;
    })
    .filter(Boolean);
}

async function fetchRacerPaths() {
  // Adjust this endpoint if your backend route name differs.
  // Your frontend route is: /racer/:idOrSlug
  const json = await fetchJson("/athletes?limit=1000");

  const athletes =
    json?.data?.athletes ??
    json?.data?.items ??
    json?.athletes ??
    json?.items ??
    json?.data ??
    json ??
    [];

  return (Array.isArray(athletes) ? athletes : [])
    .map((athlete) => {
      const idOrSlug = athlete?.slug || athlete?.username || athlete?.id;

      return idOrSlug ? `/racer/${idOrSlug}` : null;
    })
    .filter(Boolean);
}

async function fetchPollPaths() {
  // Adjust this endpoint if your backend route name differs.
  // Your frontend route is: /polls/:id
  const json = await fetchJson("/polls?limit=1000");

  const polls =
    json?.data?.polls ??
    json?.data?.items ??
    json?.polls ??
    json?.items ??
    json?.data ??
    json ??
    [];

  return (Array.isArray(polls) ? polls : [])
    .map((poll) => {
      const id = poll?.slug || poll?.id;
      return id ? `/polls/${id}` : null;
    })
    .filter(Boolean);
}

function buildUrlXml(path) {
  const priority = path === "/" ? "1.0" : "0.7";

  return [
    "<url>",
    `<loc>${escapeXml(`${ORIGIN}${path}`)}</loc>`,
    "<changefreq>daily</changefreq>",
    `<priority>${priority}</priority>`,
    "</url>",
  ].join("");
}

export async function main() {
  const [organizationPaths, eventPaths, racerPaths, pollPaths] =
    await Promise.all([
      fetchOrganizationPaths(),
      fetchEventPaths(),
      fetchRacerPaths(),
      fetchPollPaths(),
    ]);

  const routes = unique([
    ...staticRoutes,
    ...organizationPaths,
    ...eventPaths,
    ...racerPaths,
    ...pollPaths,
  ]);

  const urls = routes.map(buildUrlXml).join("");

  const xml = addCommunityDirectories(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);

  await fs.mkdir("public", { recursive: true });
  await fs.writeFile("public/sitemap.xml", xml, "utf8");

  console.log(`[sitemap] wrote public/sitemap.xml with ${routes.length} urls`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error("[sitemap] failed:", error);
    process.exit(1);
  });
}
