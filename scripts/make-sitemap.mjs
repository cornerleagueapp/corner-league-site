// scripts/make-sitemap.mjs
import fs from "node:fs/promises";

const ORIGIN = process.env.SITE_ORIGIN || "https://www.cornerleague.com";
const staticRoutes = ["/", "/clubs", "/contact", "/terms", "/settings"];

async function fetchClubPaths() {
  try {
    const base = process.env.CL_API_URL; // e.g. https://api.cornerleague.com
    if (!base) return [];
    const res = await fetch(`${base}/clubs?limit=1000`);
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const clubs = (json?.data?.clubs ?? json?.clubs ?? []).map(
      (c) => `/clubs/${c.id}`
    );
    return clubs;
  } catch (e) {
    console.log("[sitemap] skipping dynamic clubs:", e?.message || e);
    return [];
  }
}

(async () => {
  const dynamic = await fetchClubPaths();
  const urls = [...staticRoutes, ...dynamic]
    .map(
      (path) =>
        `<url><loc>${ORIGIN}${path}</loc><changefreq>daily</changefreq><priority>${
          path === "/" ? "1.0" : "0.7"
        }</priority></url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  await fs.mkdir("public", { recursive: true });
  await fs.writeFile("public/sitemap.xml", xml, "utf8");
  console.log(
    "[sitemap] wrote public/sitemap.xml with",
    urls.split("<url>").length - 1,
    "urls"
  );
})();
