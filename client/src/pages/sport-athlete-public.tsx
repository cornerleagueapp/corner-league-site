import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PageSEO } from "@/seo/usePageSEO";
import {
  publicSportData,
  SportAthlete,
  sportLabels,
} from "@/lib/sportRegistration";
export default function SportAthletePublic({
  id,
  sportKey,
}: {
  id: string;
  sportKey: string;
}) {
  const query = useQuery({
    queryKey: ["sport-athlete-public", sportKey, id],
    queryFn: async () => {
      const p = await publicSportData<SportAthlete>(
        `/sport-registration/profiles/${encodeURIComponent(id)}?sportKey=${encodeURIComponent(sportKey)}`,
      );
      if (p.id !== id || p.sportKey !== sportKey)
        throw new Error("Athlete profile not found for this sport.");
      return p;
    },
    retry: false,
    staleTime: 60_000,
  });
  const p = query.isError ? undefined : query.data;
  return (
    <main className="mx-auto max-w-4xl p-4 py-10 text-white">
      <PageSEO
        title={p ? `${p.name} · ${sportLabels[sportKey]}` : "Athlete profile"}
        canonicalPath={`/racer/${id}?sport=${sportKey}`}
        noindex={query.isError}
      />
      {query.isPending ? (
        <p role="status">Loading athlete profile…</p>
      ) : query.isError ? (
        <p role="alert">Athlete profile unavailable for this sport.</p>
      ) : (
        p && (
          <article className="rounded-3xl border border-cyan-300/20 bg-[#07111f] p-7">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-200">
              {sportLabels[sportKey]} · {p.skillLevel}
            </p>
            <h1 className="mt-4 text-4xl font-black">{p.nickname || p.name}</h1>
            {p.nickname && <p className="mt-3 text-slate-300">{p.name}</p>}
            <p className="mt-4 text-slate-400">
              {p.location}{" "}
              {p.competitorNumber ? `· #${p.competitorNumber}` : ""}
            </p>
            <p className="mt-5 whitespace-pre-wrap leading-7">{p.bio}</p>
            {p.ownershipVerified && (
              <p className="mt-5 text-sm text-cyan-200">
                Account ownership verified
              </p>
            )}
            {p.ownerUsername && (
              <Link
                href={`/profile/${encodeURIComponent(p.ownerUsername)}`}
                className="mt-4 inline-block text-cyan-200 underline"
              >
                View account profile
              </Link>
            )}
          </article>
        )
      )}
    </main>
  );
}
