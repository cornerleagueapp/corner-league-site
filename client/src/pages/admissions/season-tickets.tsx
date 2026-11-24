import { useState } from "react";
import { useRoute, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { readTeamSeason } from "@/lib/teamSports";
import { GameTickets } from "@/components/admissions/GameTickets";
import "./admissions.css";

export default function SeasonTicketsPage() {
  const [, params] = useRoute("/tickets/season/:seasonId");
  const search = new URLSearchParams(useSearch());
  const org = search.get("org") || "",
    sport = search.get("sport") || "";
  const id = params?.seasonId || "";
  const [limit, setLimit] = useState(12);
  const query = useQuery({
    queryKey: ["season-tickets-schedule", org, sport, id],
    queryFn: () => readTeamSeason(id, org, sport),
    enabled: !!id && !!org && !!sport,
    retry: false,
  });
  const season = query.data;
  const games = (season?.games || [])
    .filter(
      (g) => g.status === "scheduled" && Date.parse(g.startsAt) > Date.now(),
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const team = (key: string) =>
    season?.teams.find((t) => t.id === key)?.name || "Team";
  return (
    <main className="admissions-page">
      <div className="admissions-heading">
        <h1>Upcoming game tickets</h1>
        {season && (
          <p>
            {season.leagueName} · {season.name}
          </p>
        )}
      </div>
      {!id || !org || !sport || query.isError ? (
        <p role="alert">This season’s tickets could not be loaded.</p>
      ) : !season ? (
        <p role="status">Loading games…</p>
      ) : !games.length ? (
        <p>No upcoming games.</p>
      ) : (
        <>
          <p className="admission-muted">
            Games appear here when reservations are open. If none are listed,
            check back closer to game day.
          </p>
          <div className="admissions-grid">
            {games.slice(0, limit).map((g) => (
              <GameTickets
                key={g.id}
                season={id}
                game={g.id}
                startsAt={g.startsAt}
                enabled
                title={team(g.homeTeamId) + " vs " + team(g.awayTeamId)}
              />
            ))}
          </div>
          {limit < games.length && (
            <button
              className="admission-primary"
              onClick={() => setLimit((n) => n + 12)}
            >
              Check more games
            </button>
          )}
        </>
      )}
    </main>
  );
}
