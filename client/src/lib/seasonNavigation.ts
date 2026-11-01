export const seasonTabs = [
  ["overview", "Overview"],
  ["schedule", "Schedule & Results"],
  ["standings", "Standings"],
  ["teams", "Teams"],
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
  if (tab !== "overview") query.set("tab", tab);
  return `/sports/${encodeURIComponent(sport)}/seasons/${encodeURIComponent(season)}?${query}`;
}
