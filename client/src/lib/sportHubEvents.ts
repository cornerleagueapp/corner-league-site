import { sportVisual, SPORT_VISUALS } from "./sportVisuals";
export type HubEvent = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  organizationId: string;
  organizationName: string;
  location: string;
  imageUrl: string | null;
};
export function upcomingHubEvents(
  response: unknown,
  sport: string,
  now = Date.now(),
): HubEvent[] {
  const envelope = response as any;
  const rows = (envelope?.data ?? envelope)?.sportEvents;
  if (!Array.isArray(rows)) throw new Error("Invalid events response.");
  if (!Object.prototype.hasOwnProperty.call(SPORT_VISUALS, sport)) return [];
  return rows
    .flatMap((row: any): HubEvent[] => {
      if (
        !row ||
        typeof row.id !== "string" ||
        !row.id ||
        typeof row.name !== "string" ||
        !row.name.trim() ||
        row.sport !== sportVisual(sport).eventSport ||
        typeof row.organizer?.id !== "string" ||
        !row.organizer.id ||
        !Number.isFinite(Date.parse(row.startDate)) ||
        !Number.isFinite(Date.parse(row.endDate)) ||
        Date.parse(row.endDate) < now ||
        Date.parse(row.endDate) < Date.parse(row.startDate)
      )
        return [];
      return [
        {
          id: row.id,
          name: row.name,
          startDate: row.startDate,
          endDate: row.endDate,
          organizationId: row.organizer.id,
          organizationName:
            typeof row.organizer.name === "string"
              ? row.organizer.name
              : "Organization",
          location:
            typeof row.formattedAddress === "string"
              ? row.formattedAddress
              : typeof row.location === "string"
                ? row.location
                : "Location to be announced",
          imageUrl:
            typeof row.imageUrl === "string" &&
            /^https:\/\/[^\s]+$/i.test(row.imageUrl)
              ? row.imageUrl
              : null,
        },
      ];
    })
    .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
}
export function hubEventHref(sport: string, event: HubEvent) {
  return sport === "jet-ski"
    ? `/aqua-organizations/event-details/${encodeURIComponent(event.id)}?orgId=${encodeURIComponent(event.organizationId)}`
    : `/sports/${encodeURIComponent(sport)}/organizations/${encodeURIComponent(event.organizationId)}?event=${encodeURIComponent(event.id)}`;
}
