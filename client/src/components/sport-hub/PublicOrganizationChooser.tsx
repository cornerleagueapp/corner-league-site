import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSportOrganizations } from "@/lib/sportOrganizations";
export default function PublicOrganizationChooser({
  sport,
  value,
  onChange,
}: {
  sport: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const [page, setPage] = useState(1),
    id = useId();
  const q = useQuery({
    queryKey: ["sport-organizations", sport, page],
    queryFn: ({ signal }) => fetchSportOrganizations(sport, page, signal),
    staleTime: 60000,
    retry: false,
  });
  useEffect(() => {
    if (q.data && !q.data.organizations.some((o) => o.id === value))
      onChange(q.data.organizations[0]?.id || "");
  }, [q.data, value, onChange]);
  return (
    <div className="cl-hub-chooser">
      <label htmlFor={id}>Organization</label>
      <select
        id={id}
        value={value}
        disabled={!q.data?.organizations.length}
        onChange={(e) => onChange(e.target.value)}
      >
        {!value && (
          <option value="">
            {q.isPending ? "Loading organizations…" : "Choose an organization"}
          </option>
        )}
        {q.data?.organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {q.isError && (
        <p role="alert">
          Organizations couldn’t load.{" "}
          <button onClick={() => q.refetch()}>Try again</button>
        </p>
      )}
      {q.data && !q.data.organizations.length && (
        <p>No public organizations for this sport yet.</p>
      )}
      {(page > 1 || q.data?.meta.hasNextPage) && (
        <nav aria-label="Organization choices">
          <button
            disabled={page === 1 || q.isFetching}
            onClick={() => {
              onChange("");
              setPage((p) => p - 1);
            }}
          >
            Previous organizations
          </button>
          <button
            disabled={!q.data?.meta.hasNextPage || q.isFetching}
            onClick={() => {
              onChange("");
              setPage((p) => p + 1);
            }}
          >
            More organizations
          </button>
        </nav>
      )}
    </div>
  );
}
