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

export type IhraSkiGpLeaderRow = {
  participantId: string;
  athleteId: string;
  name: string;
  totalPoints: number;
  seasonMotoWins: number;
  overallRating: number;
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

async function fetchAthleteRating(athleteId: string) {
  const res = await apiFetch(
    `/ratings/athlete/${encodeURIComponent(athleteId)}`,
    {
      method: "GET",
      skipAuth: true,
      noRefresh: true,
    },
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return null;

  const rows = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : [];

  return rows[0] ?? null;
}

async function fetchAthleteHistory(athleteId: string) {
  const res = await apiFetch(
    `/results/athlete/${encodeURIComponent(athleteId)}/history`,
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

  const sortedOrganizations = useMemo(() => {
    const orgs = [...(orgsQuery.data ?? [])];

    return orgs.sort((a, b) => {
      const aIsIhra = a.name.trim().toUpperCase() === "IHRA";
      const bIsIhra = b.name.trim().toUpperCase() === "IHRA";

      if (aIsIhra && !bIsIhra) return -1;
      if (!aIsIhra && bIsIhra) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [orgsQuery.data]);

  return {
    organizations: sortedOrganizations,
    allEvents: eventsQuery.data ?? [],
    upcomingEvents,
    topPerformersByOrg,
    isLoading:
      orgsQuery.isLoading || eventsQuery.isLoading || performersQuery.isLoading,
    isError:
      orgsQuery.isError || eventsQuery.isError || performersQuery.isError,
  };
}

export function useIhraSkiGpLeaderboard() {
  const query = useQuery({
    queryKey: ["ihra-ski-gp-leaderboard"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<IhraSkiGpLeaderRow[]> => {
      const orgs = await fetchOrganizations();
      const ihra = orgs.find((o) => o.name.trim().toUpperCase() === "IHRA");

      if (!ihra) return [];

      const events = await fetchEventsForOrg(ihra.id);
      const ihraEventIds = new Set(events.map((event) => String(event.id)));

      const allDivisionRows = await Promise.all(
        events.map(async (event) => {
          const divisions = await fetchDivisionsForEvent(event.id);
          const skiGpDivision = divisions.find(
            (division: any) =>
              division?.name?.trim().toUpperCase() === "SKI GP",
          );

          if (!skiGpDivision) return [];

          const rows = await fetchResultsForDivision(skiGpDivision.id);

          return rows.map((row: any) => ({
            participantId: row.participantId,
            athleteId: row?.athlete?.id || row?.participantId,
            name: row?.athlete?.name || row?.team?.name || "Unknown",
            totalPoints: Number(row.totalPoints ?? 0),
            racerHref: row?.racerDetailId
              ? `/racer/${encodeURIComponent(String(row.racerDetailId))}`
              : row?.athlete?.id
                ? `/racer/${encodeURIComponent(String(row.athlete.id))}?kind=athlete`
                : undefined,
          }));
        }),
      );

      const flat = allDivisionRows.flat();

      const grouped = new Map<
        string,
        {
          participantId: string;
          athleteId: string;
          name: string;
          totalPoints: number;
          racerHref?: string;
        }
      >();

      for (const row of flat) {
        const key = row.athleteId || row.participantId;
        const existing = grouped.get(key);

        if (!existing) {
          grouped.set(key, { ...row });
        } else {
          existing.totalPoints += row.totalPoints;
        }
      }

      const baseRows = Array.from(grouped.values());

      const enriched = await Promise.all(
        baseRows.map(async (row) => {
          const [rating, history] = await Promise.all([
            fetchAthleteRating(row.athleteId),
            fetchAthleteHistory(row.athleteId),
          ]);

          const seasonMotoWins = Array.isArray(history)
            ? history.filter((item: any) => {
                const divisionName = String(item?.divisionName ?? "")
                  .trim()
                  .toUpperCase();
                const eventId = String(item?.eventId ?? "");
                const isMoto = item?.motoSequence != null;
                const isWin = Number(item?.position) === 1;

                return (
                  divisionName === "SKI GP" &&
                  isMoto &&
                  isWin &&
                  ihraEventIds.has(eventId)
                );
              }).length
            : 0;

          return {
            ...row,
            overallRating: Number(rating?.overallRating ?? 0),
            seasonMotoWins,
          };
        }),
      );

      return enriched
        .sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          if (b.seasonMotoWins !== a.seasonMotoWins) {
            return b.seasonMotoWins - a.seasonMotoWins;
          }
          return b.overallRating - a.overallRating;
        })
        .slice(0, 5);
    },
  });

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
