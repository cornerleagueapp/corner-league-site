import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";
export default function SportOrganizationsPage() {
  const [, params] = useRoute("/sports/:sportKey");
  const sportKey = params?.sportKey ?? "";
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [sportKey]);
  const query = useQuery({
    queryKey: ["sport-organizations", sportKey, page],
    queryFn: async ({ signal }) => {
      const response = await apiFetch(
        `/sports/catalog/${encodeURIComponent(sportKey)}/organizations?page=${page}&limit=20`,
        { skipAuth: true, noRefresh: true, signal },
      );
      if (!response.ok)
        throw new Error("Unable to load this sport's organizations");
      const json = await response.json();
      return json.data ?? json;
    },
    enabled: !!sportKey,
  });
  const rows = Array.isArray(query.data?.organizations)
    ? query.data.organizations
    : [];
  return (
    <main className="p-6 max-w-5xl mx-auto text-white">
      <PageSEO
        title={query.data?.sport?.label ?? "Sport organizations"}
        canonicalPath={`/sports/${sportKey}`}
      />
      <h1 className="text-3xl font-bold mb-4">
        {query.data?.sport?.label ?? "Sport organizations"}
      </h1>
      {query.isLoading ? (
        <p>Loading organizations…</p>
      ) : query.isError ? (
        <div role="alert">
          <p>Unable to load organizations.</p>
          <button onClick={() => void query.refetch()}>Try again</button>
        </div>
      ) : (
        <>
          {!rows.length ? (
            <p>No organizations are currently available for this sport.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((org: any) => (
                <Link
                  key={org.id}
                  href={`/sports/${sportKey}/organizations/${encodeURIComponent(org.id)}`}
                  className="rounded-xl border border-white/20 p-5 hover:bg-white/5"
                >
                  <h2 className="font-bold text-xl">{org.name}</h2>
                  <p className="mt-2 text-white/70">{org.description}</p>
                </Link>
              ))}
            </div>
          )}
          <div className="flex gap-5 mt-6">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={!query.data?.meta?.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}
