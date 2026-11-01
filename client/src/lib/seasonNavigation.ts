export const seasonTabs = [
  ["overview", "Overview"],
  ["schedule", "Schedule & Results"],
  ["standings", "Standings"],
  ["stats", "Stats & Leaders"],
  ["awards", "Awards & All-Stars"],
  ["photos", "Photos"],
] as const;
export function seasonHref(
  sport: string,
  season: string,
  org: string,
  tab = "overview",
) {
  const query = new URLSearchParams({ org });
  if (tab !== "overview") query.set("tab", tab === "teams" ? "standings" : tab);
  return `/sports/${encodeURIComponent(sport)}/seasons/${encodeURIComponent(season)}?${query}`;
}
