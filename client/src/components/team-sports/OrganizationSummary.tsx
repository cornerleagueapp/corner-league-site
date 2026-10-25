import { useQuery } from "@tanstack/react-query";
import { isTeamSport, publicSportData } from "@/lib/sportRegistration";
export default function OrganizationSummary({
  id,
  sport,
}: {
  id: string;
  sport: string;
}) {
  const q = useQuery({
    queryKey: ["organization-public-summary", id, sport],
    queryFn: () =>
      publicSportData<{
        organizationId: string;
        firstYear: number | null;
        seasons: number;
        athletes: number;
      }>(`/team-sports/organizations/${encodeURIComponent(id)}/summary`),
    enabled: isTeamSport(sport),
    staleTime: 60000,
    retry: false,
  });
  const d = q.data;
  if (!d || d.organizationId !== id || !d.seasons || q.isError) return null;
  return (
    <div className="cl-org-summary" aria-label="Published league history">
      <div>
        <strong>{d.firstYear || "—"}</strong>
        <span>First published season</span>
      </div>
      <div>
        <strong>{d.seasons}</strong>
        <span>Published seasons</span>
      </div>
      <div>
        <strong>{d.athletes}</strong>
        <span>Athletes on published rosters</span>
      </div>
    </div>
  );
}
