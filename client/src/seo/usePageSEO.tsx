// src/seo/usePageSEO.tsx
import { Helmet } from "react-helmet-async";

type SEO = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "article" | "profile";
};

const ORIGIN = "https://cornerleague.com";

const DEFAULT_TITLE = "Corner League Sports";
const DEFAULT_DESCRIPTION =
  "Corner League Sports is a jet ski racing hub for live event results, racer profiles, rankings, race organizations, schedules, trends, podcasts, and fan engagement.";
const DEFAULT_IMAGE = `${ORIGIN}/favicon.ico`;

function normalizeCanonicalPath(path: string) {
  if (!path) return "/";
  if (path.startsWith("http")) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export function PageSEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = "/",
  image = DEFAULT_IMAGE,
  noindex,
  type = "website",
}: SEO) {
  const fullTitle =
    title === DEFAULT_TITLE || title.includes("Corner League")
      ? title
      : `${title} • Corner League`;

  const normalizedPath = normalizeCanonicalPath(canonicalPath);
  const canonical = normalizedPath.startsWith("http")
    ? normalizedPath
    : `${ORIGIN}${normalizedPath}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>

      <link rel="canonical" href={canonical} />

      {noindex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}

      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:site_name" content="Corner League" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD: WebSite + SearchAction */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${ORIGIN}/#website`,
          url: ORIGIN,
          name: "Corner League",
          publisher: {
            "@id": `${ORIGIN}/#organization`,
          },
          potentialAction: {
            "@type": "SearchAction",
            target: `${ORIGIN}/scores/aqua?search=racers&q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        })}
      </script>
    </Helmet>
  );
}
