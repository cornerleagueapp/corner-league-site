import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loadPeople } from "@/lib/socialApi";
import {
  socialBox,
  socialButton,
  socialInput,
  SocialFailure,
  Pagination,
} from "./SocialPosts";
export default function UserSearchPanel() {
  const { user, isAuthenticated } = useAuth();
  const [input, setInput] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["social-user-search", user?.id, search, page],
    queryFn: () => loadPeople(search, page),
    enabled: isAuthenticated && !!user?.id && !!search,
    staleTime: 60_000,
    retry: false,
  });
  return (
    <section
      className={`${socialBox} space-y-4`}
      aria-labelledby="account-user-search"
    >
      <h2 id="account-user-search" className="text-xl font-bold">
        Find people
      </h2>
      <p className="text-sm text-white/55">
        Search names or usernames to view profiles, follow people, or start a
        conversation.
      </p>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(input.trim());
          setPage(1);
        }}
      >
        <input
          aria-label="Search users"
          placeholder="Name or username"
          maxLength={80}
          className={socialInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className={socialButton} disabled={!input.trim()}>
          <Search size={16} />
          Search
        </button>
        {search && (
          <button
            type="button"
            className={socialButton}
            onClick={() => {
              setInput("");
              setSearch("");
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
      </form>
      {search &&
        (query.isPending ? (
          <p role="status">Searching users…</p>
        ) : query.isError ? (
          <>
            <SocialFailure error={query.error} />
            <button
              className={socialButton}
              onClick={() => void query.refetch()}
            >
              Retry
            </button>
          </>
        ) : (
          <>
            {query.data?.items.length === 0 && (
              <p role="status" className="text-white/60">
                No matching users.
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {query.data?.items.map((person) => (
                <Link
                  key={person.id}
                  href={`/profile/${encodeURIComponent(person.username)}`}
                  className="rounded-xl border border-white/10 p-3 hover:border-cyan-300/30 hover:bg-white/5"
                >
                  <strong className="break-words text-cyan-100">
                    @{person.username}
                  </strong>
                  <p className="text-sm text-white/55">
                    {[person.firstName, person.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </Link>
              ))}
            </div>
            {query.data && (
              <Pagination
                page={page}
                hasNext={query.data.hasNextPage}
                setPage={setPage}
              />
            )}
          </>
        ))}
    </section>
  );
}
