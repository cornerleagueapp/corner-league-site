import { useQuery } from "@tanstack/react-query";
import { fetchAllSportOrganizations } from "@/lib/sportOrganizations";
export default function EventOrganizationFilter({ sport, value, onChange }: { sport: string; value: string; onChange: (value: string) => void }) {
  const query = useQuery({ queryKey: ["all-sport-organizations", sport], queryFn: ({ signal }) => fetchAllSportOrganizations(sport, signal), staleTime: 60000, retry: false });
  return <label>Organization
    <select value={value} onChange={e => onChange(e.target.value)} disabled={query.isPending}>
      <option value="">All organizations</option>
      {query.data?.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
    </select>
    {query.isError && <span role="alert" className="text-sm">Organization filter unavailable. <button type="button" className="underline" onClick={() => query.refetch()}>Retry</button></span>}
  </label>;
}
