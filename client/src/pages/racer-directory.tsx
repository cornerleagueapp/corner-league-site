import LoadingCards from "@/components/ui/LoadingCards";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useSportSelection } from "@/hooks/useSportSelection";
import { browseAthletes, safeProfileImage } from "@/lib/profileDirectory";
export default function RacerDirectory() {
  const { sportKey, sport } = useSportSelection();
  return (
    <Directory
      key={sportKey}
      sportKey={sportKey}
      label={sport?.label || "Jet Ski"}
    />
  );
}
function Directory({ sportKey, label }: { sportKey: string; label: string }) {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["athlete-directory", sportKey, search, page],
    queryFn: ({ signal }) => browseAthletes(sportKey, search, page, signal),
    staleTime: 30000,
  });
  return (
    <main className="cl-racer-directory">
      <header>
        <p>{label}</p>
        <h1>{sportKey === "jet-ski" ? "Racer" : "Athlete"} directory</h1>
        <p>Browse profiles in alphabetical order, A–Z.</p>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draft.trim());
          setPage(1);
        }}
      >
        <label htmlFor="racer-directory-search">Find an athlete</label>
        <div>
          <input
            id="racer-directory-search"
            type="search"
            value={draft}
            maxLength={80}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search by name"
          />
          <button type="submit">Search</button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDraft("");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </form>
      {query.isPending ? (
        <LoadingCards label="Loading athletes…" />
      ) : query.isError ? (
        <div role="alert">
          <p>{query.error.message}</p>
          <button onClick={() => query.refetch()}>Try again</button>
        </div>
      ) : (
        <>
          <div className="cl-athlete-directory-grid">
            {query.data.items.map((athlete) => (
              <Link
                className="cl-directory-card"
                href={athlete.profileUrl}
                key={athlete.id}
              >
                {safeProfileImage(athlete.imageUrl) ? (
                  <img
                    src={safeProfileImage(athlete.imageUrl)!}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : (
                  <span className="cl-directory-avatar" aria-hidden="true">
                    {athlete.name.slice(0, 1)}
                  </span>
                )}
                <span>
                  <strong>{athlete.name}</strong>
                  {athlete.detail && <small>{athlete.detail}</small>}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          {query.data.items.length === 0 && (
            <p>
              No athletes found
              {search ? " matching your search" : " for this sport yet"}.
            </p>
          )}
          <nav className="cl-directory-pagination" aria-label="Athlete pages">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span aria-live="polite">Page {page}</span>
            <button
              disabled={!query.data.hasNextPage || page >= 1000}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
