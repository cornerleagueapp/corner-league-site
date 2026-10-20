import NationwideMap from "@/components/landing/NationwideMap";
import { useQuery } from "@tanstack/react-query";
import { useSportSelection } from "@/hooks/useSportSelection";
import { apiFetch } from "@/lib/apiClient";
import { upcomingHubEvents } from "@/lib/sportHubEvents";
import { PageSEO } from "@/seo/usePageSEO";
export default function EventMapPage() {
  const { sportKey, sport } = useSportSelection();
  const query = useQuery({
    queryKey: ["sport-event-map", sportKey],
    queryFn: async ({ signal }) => {
      const response = await apiFetch(
        `/sport-event?sportKey=${encodeURIComponent(sportKey)}&page=1&limit=50&order=DESC&sortBy=startDate`,
        { signal, skipAuth: true, noRefresh: true },
      );
      if (!response.ok) throw new Error("Unable to load the event map.");
      return upcomingHubEvents(await response.json(), sportKey, 0);
    },
    staleTime: 60000,
  });
  return (
    <main className="sports-directory-page min-w-0 py-6">
      <PageSEO
        title={`${sport?.label || "Sport"} event map • Corner League`}
        canonicalPath="/event-map"
      />
      <div className="sports-directory-content w-full">
        {query.isPending ? (
          <p role="status">Loading events…</p>
        ) : query.isError ? (
          <div role="alert">
            <p>{query.error.message}</p>
            <button onClick={() => query.refetch()}>Try again</button>
          </div>
        ) : (
          <>
            <NationwideMap
              key={sportKey}
              events={query.data}
              sportKey={sportKey}
              sportLabel={sport?.label}
            />
            <p className="text-sm text-cl-muted mt-4">
              Showing up to 50 recent events for this sport.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
