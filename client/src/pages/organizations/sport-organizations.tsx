import SportCommunitySection from "@/components/sport-hub/SportCommunitySection";
import UpcomingSportEvents from "@/components/sport-hub/UpcomingSportEvents";
import SportHubHero from "@/components/sport-hub/SportHubHero";
import { BrandingImage } from "@/components/branding/ConsumerBrandingHero";
import { brandingImage } from "@/lib/consumerBranding";
import { sportLogo } from "@/lib/sportVisuals";
import OrganizationPromoCard from "@/components/OrganizationPromoCard";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { fetchSportOrganizations } from "@/lib/sportOrganizations";
import { sportOrganization } from "@/lib/sportNavigation";
import { PageSEO } from "@/seo/usePageSEO";
type SportOrganizationsPageProps = {
  sportKey?: string;
  params?: { sportKey: string };
};
export default function SportOrganizationsPage({
  sportKey: selected,
  params: routeParams,
}: SportOrganizationsPageProps = {}) {
  const [, params] = useRoute("/sports/:sportKey");
  const sportKey = selected ?? routeParams?.sportKey ?? params?.sportKey ?? "";
  return <SportDirectory key={sportKey} sportKey={sportKey} />;
}
function SportDirectory({ sportKey }: { sportKey: string }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["sport-organizations", sportKey, page],
    queryFn: ({ signal }) => fetchSportOrganizations(sportKey, page, signal),
    enabled: !!sportKey,
    staleTime: 30_000,
  });
  const rows = query.data?.organizations ?? [];
  const label = query.data?.sport?.label ?? "Sport";
  return (
    <main className="consumer-document-page bg-cl-canvas text-cl-ink px-3 py-10 sm:px-6">
      <PageSEO
        title={`${label} organizations • Corner League`}
        canonicalPath={`/sports/${sportKey}`}
      />
      <div className="consumer-directory-heading space-y-6">
        <SportHubHero sport={sportKey} />
        <UpcomingSportEvents key={sportKey} sport={sportKey} />
        <div id="organization-directory" className="sport-section-heading">
          <h2>{label} organizations</h2>
          {query.data && <span>{query.data.meta.itemCount} organizations</span>}
        </div>
        <div className="sport-directory-stack">
          <div className="min-w-0">
            {query.isLoading ? (
              <p role="status">Loading organizations…</p>
            ) : query.isError ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-400/25 p-6"
              >
                <p>Unable to load organizations for this sport.</p>
                <button
                  className="mt-4 min-h-11 rounded-full border border-cl-border px-5"
                  onClick={() => void query.refetch()}
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {!rows.length ? (
                  <p className="rounded-2xl border border-cl-border p-6 text-cl-muted">
                    No organizations are currently available for this sport.
                  </p>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {rows.map((org) => (
                      <Link
                        key={org.id}
                        href={sportOrganization(sportKey, org.id)}
                        className="group rounded-[24px] border border-cl-accent/10 bg-cl-surface p-6 transition hover:border-cl-accent/40"
                      >
                        <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-cl-border bg-cl-subtle">
                          <BrandingImage
                            key={org.logoUrl ?? "default"}
                            src={brandingImage(org.logoUrl)}
                            fallback={sportLogo(sportKey)}
                            alt={`${org.name} logo`}
                            className="h-full w-full object-contain p-2"
                          />
                        </div>
                        <h2 className="break-words text-xl font-black">
                          {org.name}
                        </h2>
                        <p className="mt-3 line-clamp-3 leading-7 text-cl-muted">
                          {org.description ||
                            "Explore this organization’s news and gallery."}
                        </p>
                        <p className="mt-5 text-sm font-bold text-cl-accent">
                          View organization →
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
                {(page > 1 || query.data?.meta.hasNextPage) && (
                  <nav
                    aria-label="Organization pages"
                    className="flex items-center gap-5"
                  >
                    <button
                      className="min-h-11 rounded-full border border-cl-border px-5 disabled:opacity-40"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <span>Page {page}</span>
                    <button
                      className="min-h-11 rounded-full border border-cl-border px-5 disabled:opacity-40"
                      disabled={!query.data?.meta.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
          <aside className="sport-directory-promo" aria-label="For organizers">
            <OrganizationPromoCard />
          </aside>
        </div>
      </div>
      <SportCommunitySection sport={sportKey} />
    </main>
  );
}
