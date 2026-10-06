import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";
export default function SportOrganizationDetailsPage() {
  const [, params] = useRoute("/sports/:sportKey/organizations/:id");
  const query = useQuery({
    queryKey: ["public-sport-organization", params?.id, params?.sportKey],
    queryFn: async ({ signal }) => {
      const response = await apiFetch(
        `/organizations/${encodeURIComponent(params!.id)}`,
        { skipAuth: true, noRefresh: true, signal },
      );
      if (!response.ok) throw new Error("Organization not found");
      const json = await response.json();
      const data = json.data ?? json;
      if (data.organization?.primarySportKey !== params?.sportKey)
        throw new Error("Organization not found for this sport");
      return data;
    },
    enabled: !!params?.id,
  });
  return (
    <main className="p-6 max-w-4xl mx-auto text-white">
      <PageSEO
        title={query.data?.organization?.name ?? "Organization"}
        canonicalPath={`/sports/${params?.sportKey}/organizations/${params?.id}`}
      />
      {query.isLoading ? (
        <p>Loading organization…</p>
      ) : query.isError ? (
        <p role="alert">Organization unavailable.</p>
      ) : (
        <>
          <p className="text-cyan-300">{query.data?.sportProfile?.label}</p>
          <h1 className="text-3xl font-bold my-4">
            {query.data?.organization?.name}
          </h1>
          <p>{query.data?.organization?.description}</p>
          <p className="mt-8 text-white/60">
            Sport-specific competition pages are being developed. Organization
            information is available here now.
          </p>
        </>
      )}
    </main>
  );
}
