import { useRoute } from "wouter";
import AquaOrganizationDetailsPage from "./aqua-organization-details";
export default function SportOrganizationDetailsPage() {
  const [, params] = useRoute("/sports/:sportKey/organizations/:id");
  if (!params) return null;
  return (
    <AquaOrganizationDetailsPage
      key={`${params.sportKey}:${params.id}`}
      params={{ id: params.id }}
      expectedSportKey={params.sportKey}
    />
  );
}
