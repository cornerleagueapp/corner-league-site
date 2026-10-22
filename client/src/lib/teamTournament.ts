import type { PublicTeamSeason } from "./teamSports";
type Game = PublicTeamSeason["games"][number];
export function tournamentWinner(
  season: PublicTeamSeason,
  game?: Game,
): string | null {
  if (!game || game.status === "cancelled") return null;
  if (game.competition?.bye) return game.homeTeamId;
  const result = season.results.find(
    (r) => r.gameId === game.id && r.status === "final",
  );
  if (!result) return null;
  return result.homeScore > result.awayScore
    ? game.homeTeamId
    : result.awayScore > result.homeScore
      ? game.awayTeamId
      : result.tiebreakWinnerId;
}
export function tournamentRounds(season: PublicTeamSeason, id: string) {
  const games = season.games.filter((g) => g.competition?.id === id);
  const count =
    games.find((g) => g.competition?.fieldSize)?.competition?.fieldSize ??
    games.filter((g) => g.competition?.round === 1).length * 2;
  const size = 2 ** Math.ceil(Math.log2(Math.max(2, count)));
  return Array.from({ length: Math.log2(size) }, (_, index) => {
    const round = index + 1;
    return {
      round,
      label:
        size / 2 ** round === 1
          ? "Final"
          : size / 2 ** round === 2
            ? "Semifinals"
            : size / 2 ** round === 4
              ? "Quarterfinals"
              : `Round ${round}`,
      matches: Array.from({ length: size / 2 ** round }, (_, m) => ({
        match: m + 1,
        game: games.find(
          (g) =>
            g.competition?.round === round && g.competition.match === m + 1,
        ),
      })),
    };
  });
}
