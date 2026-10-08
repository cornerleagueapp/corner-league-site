import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  publicSportData,
  SportAthlete,
  sportLabels,
} from "@/lib/sportRegistration";
export default function AthleteAccountLinks({
  username,
}: {
  username: string;
}) {
  const query = useQuery({
    queryKey: ["sport-account-athletes", username],
    queryFn: async () => {
      const profiles = await publicSportData<SportAthlete[]>(
        `/sport-registration/accounts/${encodeURIComponent(username)}/profiles`,
      );
      if (!Array.isArray(profiles)) throw new Error("Invalid athlete profiles");
      return profiles;
    },
    staleTime: 60_000,
    retry: false,
  });
  if (query.isPending || query.isError || !query.data?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {query.data.map((p) => (
        <Link
          key={p.id}
          href={`/racer/${p.id}?sport=${p.sportKey}`}
          className="inline-flex min-h-11 items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 text-sm text-cyan-200"
        >
          {sportLabels[p.sportKey]} athlete · Account ownership verified
        </Link>
      ))}
    </div>
  );
}
