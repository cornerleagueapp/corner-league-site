// scripts/make-sitemap.ts
import fs from "node:fs/promises";

const ORIGIN = "https://cornerleague.com";

async function main() {
  const staticRoutes = ["/", "/clubs", "/contact", "/terms", "/settings"];

  // TODO: swap for your real API base, or skip if static only.
  // const res = await fetch(process.env.CL_API_URL + "/clubs");
  // const json = await res.json();
  // const clubs = (json?.data?.clubs ?? json?.clubs ?? []).map((c: any) => `/clubs/${c.id}`);

  const clubs: string[] = []; // if you don't have an API yet

  const urls = [...staticRoutes, ...clubs]
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
}

main();
