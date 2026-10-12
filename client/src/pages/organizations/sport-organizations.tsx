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
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[30px] border border-cl-accent/15 cl-panel-wash p-6 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cl-accent">
            Corner League Sports
          </p>
          <h1 className="mt-4 break-words text-3xl font-black uppercase sm:text-5xl">
            {label} Organizations
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-cl-muted">
            Find organizations, read their official updates, and explore their
            photo galleries.
          </p>
          {query.data && (
            <p className="mt-4 text-sm text-cl-accent">
              {query.data.meta.itemCount} organizations
            </p>
          )}
        </header>
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
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((org) => (
                  <Link
                    key={org.id}
                    href={sportOrganization(sportKey, org.id)}
                    className="group rounded-[24px] border border-cl-accent/10 bg-cl-surface p-6 transition hover:border-cl-accent/40"
                  >
                    <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-cl-border bg-cl-subtle">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={`${org.name} logo`}
                          loading="lazy"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-xl font-black text-cl-accent">
                          {org.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
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
    </main>
  );
}
