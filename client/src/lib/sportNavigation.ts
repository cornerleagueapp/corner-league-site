// Phase 1 showcase only. Other sport implementations and records remain intact.
export const SHOWCASE_SPORTS = ["jet-ski", "basketball"] as const;
export const isShowcaseSport = (key: string) =>
  (SHOWCASE_SPORTS as readonly string[]).includes(key);
export function sportRegistration(key: string) {
  return key === "jet-ski"
    ? "/registration?sport=jet-ski"
    : `/sports/${encodeURIComponent(key)}/registration`;
}
export function sportMoreLinks(key: string) {
  const scoped = (path: string) => `${path}?sport=${encodeURIComponent(key)}`;
  return [
    { label: "Athletes", href: scoped("/racer") },
    { label: "Registration", href: sportRegistration(key) },
    ...(key === "jet-ski"
      ? [
          { label: "Trending", href: scoped("/top-trends") },
          { label: "Polls", href: scoped("/polls") },
          { label: "Arcade", href: scoped("/arcade") },
        ]
      : []),
  ];
}
export const SPORT_STORAGE_KEY = "corner-league-public-sport-v1";
export function validSportKey(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
export function routeSport(path: string): string | undefined {
  const key = path.match(/^\/sports\/([^/]+)(?:\/|$)/)?.[1];
  if (validSportKey(key)) return key;
  if (
    /^\/aqua-organizations(?:\/|$)/.test(path) ||
    /^\/(?:registration|racepod)(?:\/|$)/.test(path) ||
    /^\/scores\/aqua(?:\/|$)/.test(path)
  )
    return "jet-ski";
  return undefined;
}
export function sportDirectory(key: string): string {
  return key === "jet-ski"
    ? "/aqua-organizations"
    : `/sports/${encodeURIComponent(key)}/organizations`;
}
export function sportHub(key: string): string {
  return key === "jet-ski"
    ? "/scores/aqua"
    : `/sports/${encodeURIComponent(key)}`;
}
export function sportOrganization(key: string, id: string): string {
  return key === "jet-ski"
    ? `/aqua-organizations/${encodeURIComponent(id)}`
    : `/sports/${encodeURIComponent(key)}/organizations/${encodeURIComponent(id)}`;
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
