import AthleteTeamPerformance from "@/components/team-sports/AthleteTeamPerformance";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageSEO } from "@/seo/usePageSEO";
import {
  publicSportData,
  SportAthlete,
  sportLabels,
  isTeamSport,
} from "@/lib/sportRegistration";
import { stockHeader, brandingImage } from "@/lib/consumerBranding";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";
export default function SportAthletePublic({
  id,
  sportKey,
}: {
  id: string;
  sportKey: string;
}) {
  const [tab, setTab] = useState(
    isTeamSport(sportKey) ? "performance" : "about",
  );
  const q = useQuery({
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
    staleTime: 60000,
  });
  const p = q.isError ? undefined : q.data;
  return (
    <main className="consumer-document-page min-w-0 p-3 py-6 sm:p-6 text-cl-ink">
      <PageSEO
        title={p ? `${p.name} · ${sportLabels[sportKey]}` : "Athlete profile"}
        canonicalPath={`/athlete/${id}?sport=${sportKey}`}
        noindex={q.isError || !!p?.isDemo}
      />
      {q.isPending ? (
        <p role="status" className="cl-sport-empty">
          Loading athlete profile…
        </p>
      ) : q.isError ? (
        <div role="alert" className="cl-sport-empty">
          Athlete profile unavailable for this sport.{" "}
          <button className="underline" onClick={() => q.refetch()}>
            Try again
          </button>
        </div>
      ) : (
        p && (
          <>
            <section
              className="athlete-performance-hero"
              aria-label="Athlete profile"
            >
              <img
                className="athlete-hero-photo"
                src={stockHeader(sportKey)}
                alt=""
              />
              <div className="athlete-hero-identity">
                <div className="athlete-hero-portrait">
                  <img
                    src={brandingImage(p.imageUrl) || stockAvatar}
                    alt={p.name}
                    onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=stockAvatar}}
                  />
                </div>
                <div className="athlete-hero-name">
                  <p>
                    {sportLabels[sportKey]?.toUpperCase()} ·{" "}
                    {p.skillLevel.toUpperCase()}
                  </p>
                  <h1>{p.name}</h1>
                  {p.nickname && (
                    <p className="athlete-nickname">“{p.nickname}”</p>
                  )}
                  <p>
                    {p.location}
                    {p.competitorNumber ? ` · #${p.competitorNumber}` : ""}
                  </p>
                </div>
              </div>
            </section>
            {p.isDemo && (
              <p className="mt-4 rounded-xl border border-cl-border bg-cl-surface p-3 text-sm text-cl-muted">
                Demo athlete · Fictional identity and generated statistics
              </p>
            )}
            <nav className="cl-sport-tabs" aria-label="Athlete sections">
              {(isTeamSport(sportKey)
                ? ["performance", "about"]
                : ["about"]
              ).map((v) => (
                <button
                  key={v}
                  aria-pressed={tab === v}
                  onClick={() => setTab(v)}
                >
                  {v === "performance" ? "Performance Center" : "About athlete"}
                </button>
              ))}
            </nav>
            {tab === "performance" ? (
              <AthleteTeamPerformance
                key={`${id}:${sportKey}`}
                id={id}
                sportKey={sportKey}
              />
            ) : (
              <section className="cl-team-panel">
                <h2>About {p.name}</h2>
                <p className="whitespace-pre-wrap leading-7">
                  {p.bio || "This athlete hasn’t added a bio yet."}
                </p>
                {p.ownershipVerified && (
                  <p className="mt-4 text-cl-accent">
                    Account ownership verified
                  </p>
                )}
                {p.ownerUsername && (
                  <Link
                    className="mt-4 inline-block text-cl-accent underline"
                    href={`/profile/${encodeURIComponent(p.ownerUsername)}`}
                  >
                    View account profile
                  </Link>
                )}
              </section>
            )}
          </>
        )
      )}
    </main>
  );
}
