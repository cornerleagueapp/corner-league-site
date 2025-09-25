// src/seo/usePageSEO.tsx
import { Helmet } from "react-helmet-async";

type SEO = {
  title?: string; // plain title, prefix with “CL || ”
  description?: string;
  canonicalPath?: string; // e.g. "/clubs" or `/clubs/${id}`
  image?: string; // absolute URL for social share
  noindex?: boolean; // for /auth, etc.
};

const ORIGIN = "https://cornerleague.com"; // set your prod domain

export function PageSEO({
  title = "Corner League",
  description = "Join live sports clubs, chat, and compete on Corner League.",
  canonicalPath = "/",
  image = `${ORIGIN}/og/default.png`,
  noindex,
}: SEO) {
  const fullTitle = title.startsWith("Corner League |")
    ? title
    : `Corner League | ${title}`;
  const canonical = `${ORIGIN}${canonicalPath}`;

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
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {/* JSON-LD: WebSite + SearchAction (helps sitelinks search box) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          url: ORIGIN,
          name: "Corner League",
          potentialAction: {
            "@type": "SearchAction",
            target: `${ORIGIN}/search?q={query}`,
            "query-input": "required name=query",
          },
        })}
      </script>
    </Helmet>
  );
}
