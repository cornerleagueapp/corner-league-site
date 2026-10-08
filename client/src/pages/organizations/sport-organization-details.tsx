import { useRoute, useSearch } from "wouter";
import PublicSportEventPage from "./public-sport-event";
import AquaOrganizationDetailsPage from "./aqua-organization-details";
export default function SportOrganizationDetailsPage() {
  const [, params] = useRoute("/sports/:sportKey/organizations/:id");
  const eventId = new URLSearchParams(useSearch()).get("event");
  if (!params) return null;
  if (eventId)
    return (
      <PublicSportEventPage
        key={`${params.sportKey}:${params.id}:${eventId}`}
        sportKey={params.sportKey}
        organizationId={params.id}
        eventId={eventId}
      />
    );
  return (
    <AquaOrganizationDetailsPage
      key={`${params.sportKey}:${params.id}`}
      params={{ id: params.id }}
      expectedSportKey={params.sportKey}
    />
  );
}
