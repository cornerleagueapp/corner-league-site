export const SPORT_STORAGE_KEY = "corner-league-public-sport-v1";
export function validSportKey(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
export function routeSport(path: string): string | undefined {
  const key = path.match(/^\/sports\/([^/]+)(?:\/|$)/)?.[1];
  if (validSportKey(key)) return key;
  if (
    path === "/aqua-organizations" ||
    path === "/event-map" ||
    /^\/(?:registration|racepod)(?:\/|$)/.test(path) ||
    /^\/scores\/aqua(?:\/|$)/.test(path)
  )
    return "jet-ski";
  return undefined;
}
export function sportDirectory(key: string): string {
  return key === "jet-ski"
    ? "/aqua-organizations"
    : `/sports/${encodeURIComponent(key)}`;
}
export function sportHub(key: string): string {
  return key === "jet-ski" ? "/scores/aqua" : sportDirectory(key);
}
export function sportOrganization(key: string, id: string): string {
  return key === "jet-ski"
    ? `/aqua-organizations/${encodeURIComponent(id)}`
    : `${sportDirectory(key)}/organizations/${encodeURIComponent(id)}`;
}
export function resolveSport(
  path: string,
  saved: string | undefined,
  available: Array<{ key: string }>,
): string {
  const fromRoute = routeSport(path);
  if (fromRoute) return fromRoute;
  if (saved && available.some((sport) => sport.key === saved)) return saved;
  return available[0]?.key ?? "jet-ski";
}
