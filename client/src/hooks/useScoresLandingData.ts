import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export type OrgItem = {
  id: string;
  name: string;
  logoUrl?: string | null;
};

export type EventItem = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string | null;
  organizationId?: string;
  organizationName?: string;
};

export type PerformerItem = {
  participantId: string;
  name: string;
  className: string;
  totalPoints: number;
  overallPosition: number;
  racerHref?: string;
};

async function fetchOrganizations(): Promise<OrgItem[]> {
  const res = await apiFetch("/organizations", {
    method: "GET",
    skipAuth: true,
    noRefresh: true,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to load organizations");

  return json?.organizations ?? json?.data?.organizations ?? [];
}

async function fetchEventsForOrg(orgId: string): Promise<EventItem[]> {
  const res = await apiFetch(
    `/sport-event/organization/${orgId}?page=1&limit=50&order=ASC&sortBy=startDate`,
    {
      method: "GET",
      skipAuth: true,
      noRefresh: true,
    },
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return [];

  return json?.sportEvents ?? json?.data?.sportEvents ?? [];
}

async function fetchDivisionsForEvent(eventId: string) {
  const res = await apiFetch(
    `/sport-event/division/event/${eventId}?page=1&limit=50`,
    {
      method: "GET",
      skipAuth: true,
      noRefresh: true,
    },
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return [];

  return json?.divisions ?? json?.data?.divisions ?? [];
}

async function fetchResultsForDivision(divisionId: string) {
  const res = await apiFetch(
    `/results/final-results-by-division/${divisionId}`,
    {
      method: "GET",
      skipAuth: true,
      noRefresh: true,
    },
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return [];

  return json?.results ?? json?.data?.results ?? json?.data ?? [];
}

export function useScoresLandingData() {
  const orgsQuery = useQuery({
    queryKey: ["scores-landing-orgs"],
    queryFn: fetchOrganizations,
    staleTime: 5 * 60 * 1000,
  });

  const eventsQuery = useQuery({
    queryKey: [
      "scores-landing-events",
      orgsQuery.data?.map((o) => o.id).join(","),
    ],
    enabled: !!orgsQuery.data?.length,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const all = await Promise.all(
        (orgsQuery.data ?? []).map(async (org) => {
          const events = await fetchEventsForOrg(org.id);
          return events.map((event) => ({
            ...event,
            organizationId: org.id,
            organizationName: org.name,
          }));
        }),
      );

      return all.flat();
    },
  });

  const performersQuery = useQuery({
    queryKey: [
      "scores-landing-performers",
      eventsQuery.data?.map((e) => e.id).join(","),
    ],
    enabled: !!eventsQuery.data?.length,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const eventResults = await Promise.all(
        (eventsQuery.data ?? []).map(async (event) => {
          const divisions = await fetchDivisionsForEvent(event.id);

          const divisionResults = await Promise.all(
            divisions.map(async (division: any) => {
              const rows = await fetchResultsForDivision(division.id);

              return rows.map((row: any) => ({
                participantId: row.participantId,
                name: row?.athlete?.name || row?.team?.name || "Unknown",
                className: division.name,
                totalPoints: row.totalPoints ?? 0,
                overallPosition: row.overallPosition ?? 999,
                racerHref: row?.racerDetailId
                  ? `/racer/${encodeURIComponent(String(row.racerDetailId))}`
                  : undefined,
                organizationId: event.organizationId,
                organizationName: event.organizationName,
              }));
            }),
          );

          return divisionResults.flat();
        }),
      );

      return eventResults.flat();
    },
  });

  const upcomingEvents = useMemo(() => {
    const now = Date.now();

    return (eventsQuery.data ?? [])
      .filter(
        (event) => new Date(event.endDate || event.startDate).getTime() >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
  }, [eventsQuery.data]);

  const topPerformersByOrg = useMemo(() => {
    const grouped = new Map<string, PerformerItem[]>();

    for (const item of performersQuery.data ?? []) {
      const key = item.organizationId || "unknown";
      const existing = grouped.get(key) ?? [];
      existing.push(item);
      grouped.set(key, existing);
    }

    const result: Record<string, PerformerItem[]> = {};
    for (const org of orgsQuery.data ?? []) {
      const items = grouped.get(org.id) ?? [];
      result[org.id] = items
        .sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          return a.overallPosition - b.overallPosition;
        })
        .slice(0, 5);
    }

    return result;
  }, [orgsQuery.data, performersQuery.data]);

  return {
    organizations: orgsQuery.data ?? [],
    allEvents: eventsQuery.data ?? [],
    upcomingEvents,
    topPerformersByOrg,
    isLoading:
      orgsQuery.isLoading || eventsQuery.isLoading || performersQuery.isLoading,
    isError:
      orgsQuery.isError || eventsQuery.isError || performersQuery.isError,
  };
}
