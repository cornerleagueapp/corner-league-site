import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";
import { BreadcrumbTrail } from "@/components/navigation/Breadcrumbs";
import { localOpportunity } from "./data";
import LocalDiscoveryCard from "./LocalDiscoveryCard";
export default function LocalDiscoveryPage() {
  const [, params] = useRoute("/local-discovery/:id");
  const q = useQuery({
    queryKey: ["local-opportunity", params?.id],
    enabled: !!params?.id,
    retry: false,
    staleTime: 30000,
    queryFn: async ({ signal }) => {
      const r = await apiFetch(
        `/local-discovery/${encodeURIComponent(params!.id)}`,
        { signal, skipAuth: true, noRefresh: true },
      );
      if (!r.ok)
        throw Error("This local listing is unavailable or has expired.");
      const value = await r.json();
      return localOpportunity(value.data ?? value);
    },
  });
  return (
    <main className="consumer-document-page min-w-0 space-y-5 p-4 sm:p-6">
      <PageSEO
        title={`${q.data?.title || "Local discovery"} · Corner League`}
        canonicalPath={`/local-discovery/${params?.id || ""}`}
        noindex={q.isError}
      />
      <BreadcrumbTrail
        items={[
          { label: "Home", href: "/" },
          { label: "Local discovery", href: "/#latest" },
          { label: q.data?.title || "Listing" },
        ]}
      />
      {q.isPending ? (
        <p role="status">Loading local activity…</p>
      ) : q.isError ? (
        <section
          className="rounded-2xl border border-cl-border bg-cl-surface p-6 text-cl-ink"
          role="alert"
        >
          <h1 className="text-2xl font-bold">Listing unavailable</h1>
          <p>{q.error.message}</p>
          <button
            className="min-h-11 underline"
            onClick={() => void q.refetch()}
          >
            Try again
          </button>
          <Link className="ml-4 underline" href="/">
            Browse latest updates
          </Link>
        </section>
      ) : (
        <LocalDiscoveryCard item={q.data} detail />
      )}
    </main>
  );
}
