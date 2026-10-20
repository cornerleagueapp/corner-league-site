export type OrganizationSection =
  | "overview"
  | "events"
  | "competition"
  | "updates"
  | "gallery"
  | "shop"
  | "facilities";
export type OrganizationSectionLink = {
  key: OrganizationSection;
  label: string;
};
export function organizationSections(
  team: boolean,
  events: boolean,
  sandbox = false,
): OrganizationSectionLink[] {
  return [
    { key: "overview", label: "Overview" },
    ...(events ? [{ key: "events" as const, label: "Events" }] : []),
    ...(team
      ? [{ key: "competition" as const, label: "Leagues & seasons" }]
      : []),
    { key: "updates", label: "News & updates" },
    { key: "gallery", label: "Photos" },
    ...(!sandbox
      ? [
          { key: "shop" as const, label: "Shop" },
          { key: "facilities" as const, label: "Facilities & access" },
        ]
      : []),
  ];
}
export function organizationSection(
  search: string,
  links: OrganizationSectionLink[],
): OrganizationSection {
  const params = new URLSearchParams(search);
  const requested =
    params.get("shop") === "1"
      ? "shop"
      : params.get("section") ||
        (params.has("season") ? "competition" : "overview");
  return links.some((link) => link.key === requested)
    ? (requested as OrganizationSection)
    : "overview";
}
export function organizationSectionPath(
  path: string,
  search: string,
  section: OrganizationSection,
): string {
  const params = new URLSearchParams(search);
  params.delete("shop");
  params.delete("section");
  if (section !== "competition") params.delete("season");
  if (section === "shop") params.set("shop", "1");
  else if (section !== "overview") params.set("section", section);
  return path + (params.size ? `?${params.toString()}` : "");
}
export type OrganizationEvent = {
  id: string;
  name: string;
  description?: string;
  location?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
};
export type OrganizationEventPage = {
  items: OrganizationEvent[];
  hasNextPage: boolean;
  total: number | null;
};
export function organizationEventPage(
  value: unknown,
  organizationId: string,
): OrganizationEventPage {
  const json = value as any,
    data = json?.data ?? json;
  if (!Array.isArray(data?.sportEvents))
    throw new Error("Invalid event response.");
  const seen = new Set<string>();
  const items: OrganizationEvent[] = data.sportEvents.flatMap((row: any) => {
    if (row?.organizer?.id && row.organizer.id !== organizationId)
      throw new Error("Event belongs to another organization.");
    if (
      typeof row?.id !== "string" ||
      !row.id ||
      typeof row?.name !== "string" ||
      !row.name.trim() ||
      seen.has(row.id) ||
      typeof row.startDate !== "string" ||
      typeof row.endDate !== "string" ||
      !Number.isFinite(Date.parse(row.startDate)) ||
      !Number.isFinite(Date.parse(row.endDate)) ||
      Date.parse(row.endDate) < Date.parse(row.startDate)
    )
      return [];
    seen.add(row.id);
    return [
      {
        id: row.id,
        name: row.name,
        startDate: row.startDate,
        endDate: row.endDate,
        description:
          typeof row.description === "string" ? row.description : undefined,
        location:
          typeof row.formattedAddress === "string"
            ? row.formattedAddress
            : typeof row.location === "string"
              ? row.location
              : undefined,
        imageUrl:
          typeof row.imageUrl === "string" &&
          /^https:\/\/[^\s]+$/i.test(row.imageUrl)
            ? row.imageUrl
            : undefined,
      },
    ];
  });
  return {
    items,
    hasNextPage: data.meta?.hasNextPage === true,
    total:
      Number.isSafeInteger(data.meta?.itemCount) && data.meta.itemCount >= 0
        ? data.meta.itemCount
        : null,
  };
}
export function organizationEventHref(
  sport: string,
  organizationId: string,
  eventId: string,
  sandboxId?: string,
) {
  if (sandboxId)
    return `/internal/test-organizations/${encodeURIComponent(sandboxId)}?event=${encodeURIComponent(eventId)}`;
  if (sport === "jet-ski")
    return `/aqua-organizations/event-details/${encodeURIComponent(eventId)}?orgId=${encodeURIComponent(organizationId)}`;
  return `/sports/${encodeURIComponent(sport)}/organizations/${encodeURIComponent(organizationId)}?event=${encodeURIComponent(eventId)}`;
}
export function organizationEventDate(start: string, end: string): string {
  const first = new Date(start),
    last = new Date(end);
  if (!Number.isFinite(first.getTime())) return "Date to be announced";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return (
    first.toLocaleDateString(undefined, options) +
    (Number.isFinite(last.getTime()) &&
    first.toDateString() !== last.toDateString()
      ? ` – ${last.toLocaleDateString(undefined, options)}`
      : "")
  );
}
