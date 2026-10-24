import { useRoute, Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllSportOrganizations } from "@/lib/sportOrganizations";
import { sportOrganization } from "@/lib/sportNavigation";
import { sportVisual, sportLogo } from "@/lib/sportVisuals";
import { BrandingImage } from "@/components/branding/ConsumerBrandingHero";
import { brandingImage } from "@/lib/consumerBranding";
import { PageSEO } from "@/seo/usePageSEO";
export default function SportOrganizationDirectory() {
  const [, p] = useRoute("/sports/:sportKey/organizations");
  const sport = p?.sportKey || "";
  return <Directory key={sport} sport={sport} />;
}
function Directory({ sport }: { sport: string }) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["all-sport-organizations", sport],
    queryFn: ({ signal }) => fetchAllSportOrganizations(sport, signal),
    staleTime: 60000,
    retry: false,
  });
  const all = (q.data || []).filter((o) =>
    `${o.name} ${o.description || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const rows = all.slice((page - 1) * 12, page * 12);
  return (
    <main className="consumer-document-page p-3 sm:p-6 text-cl-ink">
      <PageSEO
        title={`${sportVisual(sport).label} organizations · Corner League`}
        canonicalPath={`/sports/${sport}/organizations`}
      />
      <header className="cl-sport-page-heading">
        <p className="cl-eyebrow">{sportVisual(sport).label} community</p>
        <h1>Find your league.</h1>
        <p>Organizations, teams and the people bringing your sport together.</p>
      </header>
      <label className="cl-directory-search">
        Search organizations
        <input
          type="search"
          placeholder="Search by name or description"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </label>
      {q.isPending ? (
        <p role="status">Loading organizations…</p>
      ) : q.isError ? (
        <p role="alert">
          Organizations couldn’t be loaded.{" "}
          <button onClick={() => q.refetch()}>Try again</button>
        </p>
      ) : !rows.length ? (
        <p className="cl-sport-empty">No organizations found.</p>
      ) : (
        <div className="cl-org-directory">
          {rows.map((o) => (
            <Link href={sportOrganization(sport, o.id)} key={o.id}>
              <BrandingImage
                src={brandingImage(o.logoUrl)}
                fallback={sportLogo(sport)}
                alt={`${o.name} logo`}
                className="cl-org-logo"
              />
              <div>
                <p className="cl-eyebrow">{sportVisual(sport).label}</p>
                <h2>{o.name}</h2>
                <p>{o.description || "Explore leagues, schedules and news."}</p>
              </div>
              <strong aria-hidden="true">→</strong>
            </Link>
          ))}
        </div>
      )}
      {all.length > 12 && (
        <nav className="cl-sport-pagination" aria-label="Organization pages">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {page}</span>
          <button
            disabled={page * 12 >= all.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
