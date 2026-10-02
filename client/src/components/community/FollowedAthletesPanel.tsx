import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, ShieldCheck, RefreshCw } from "lucide-react";
import { getProfileAthletes } from "@/lib/communityApi";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";

function AthletePage({
  username,
  isOwn,
}: {
  username: string;
  isOwn: boolean;
}) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["profile-athletes", username, page],
    queryFn: () => getProfileAthletes(username, page),
    staleTime: 60_000,
    retry: false,
  });
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Heart className="h-5 w-5 text-cyan-200" /> Following athletes
          </h2>
          <p className="mt-1 text-sm text-white/55">
            {query.data
              ? `${query.data.total} athletes · Results and profiles in one place`
              : "Your connection to the competition"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Refresh followed athletes"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
          className="rounded-full border border-white/10 p-3"
        >
          <RefreshCw
            className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>
      {query.isPending ? (
        <p role="status" className="text-sm text-white/60">
          Loading athletes…
        </p>
      ) : query.isError ? (
        <div role="alert" className="text-sm text-rose-200">
          Unable to load athletes.{" "}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {!query.data.items.length && (
            <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
              <p className="text-white/65">
                {isOwn
                  ? "Follow an athlete from their racer page to find them here."
                  : "No followed athletes yet."}
              </p>
              {isOwn && (
                <Link
                  href="/scores/aqua?search=racers"
                  className="mt-3 inline-flex min-h-11 items-center font-bold text-cyan-200"
                >
                  Find racers
                </Link>
              )}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {query.data.items.map((athlete) => (
              <article
                key={athlete.athleteId}
                className="flex min-w-0 gap-3 rounded-2xl border border-white/10 bg-black/15 p-4"
              >
                <img
                  src={athlete.imageUrl || stockAvatar}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = stockAvatar;
                  }}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="break-words font-semibold">
                    {athlete.name}
                    {athlete.isVerifiedAthlete && (
                      <ShieldCheck
                        aria-label="Verified athlete"
                        className="ml-2 inline h-4 w-4 text-emerald-200"
                      />
                    )}
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {athlete.sportKey === "jet-ski" ? "Jet Ski" : "Athlete"}
                    {athlete.location ? ` · ${athlete.location}` : ""}
                  </p>
                  {athlete.profileUrl && (
                    <Link
                      href={athlete.profileUrl}
                      className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-cyan-200"
                    >
                      View results & profile →
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
          {(page > 1 || query.data.hasNextPage) && (
            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
                className="min-h-11 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-white/55">Page {page}</span>
              <button
                type="button"
                disabled={!query.data.hasNextPage}
                onClick={() => setPage((value) => value + 1)}
                className="min-h-11 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
export default function FollowedAthletesPanel(props: {
  username: string;
  isOwn: boolean;
}) {
  return <AthletePage key={props.username} {...props} />;
}
