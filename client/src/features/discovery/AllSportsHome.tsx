import { useRef, useState } from "react";
import LocalDiscoveryCard from "@/features/local-discovery/LocalDiscoveryCard";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useSportSelection } from "@/hooks/useSportSelection";
import { discovery, DiscoveryItem } from "./api";
import { DiscoveryCard } from "./DiscoveryCards";
import FeedPagination from "./FeedPagination";
import "./discovery.css";
import { AllSportsHero } from "./AllSportsHero";

type FeedPage = {
  items: DiscoveryItem[];
  page: number;
  hasNextPage: boolean;
  nextCursor: string | null;
  upcoming: DiscoveryItem[];
  organizations: DiscoveryItem[];
  hasMoreEvents?: boolean;
  hasMoreOrganizations?: boolean;
  localDiscoveryUnavailable?: boolean;
};
export default function AllSportsHome() {
  const auth = useAuth();
  return (
    <AllSportsFeed
      key={`${auth.isAuthenticated}:${auth.user?.id || "guest"}`}
    />
  );
}
function AllSportsFeed() {
  const auth = useAuth(),
    { sports } = useSportSelection(),
    client = useQueryClient();
  const [page, setPage] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const queryKey = [
    "all-sports-feed-chronological",
    auth.isAuthenticated,
    auth.user?.id || "guest",
  ];
  const feed = useInfiniteQuery({
    queryKey,
    initialPageParam: { cursor: "start", page: 1 },
    queryFn: ({ pageParam, signal }) =>
      discovery<FeedPage>(
        "feed",
        {
          page: String(pageParam.page),
          cursor: pageParam.cursor,
        },
        auth.isAuthenticated,
        signal,
      ),
    getNextPageParam: (last) =>
      last.hasNextPage && last.nextCursor && last.page < 50
        ? { cursor: last.nextCursor, page: last.page + 1 }
        : undefined,
    staleTime: 60000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
  const pages = feed.data?.pages || [];
  const visiblePage = Math.min(page, Math.max(0, pages.length - 1));
  const current = pages[visiblePage],
    first = pages[0],
    items = current?.items || [];
  const hasNext = visiblePage + 1 < pages.length || Boolean(feed.hasNextPage);
  async function goToPage(next: number) {
    if (next < 0 || feed.isFetching) return;
    if (next >= pages.length) {
      const result = await feed.fetchNextPage();
      if (result.isError || !result.data?.pages[next]) return;
    }
    setPage(next);
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start" });
  }
  function refresh() {
    setPage(0);
    void client.resetQueries({ queryKey, exact: true });
  }
  return (
    <main className="discovery-page">
      <AllSportsHero />
      <div className="discovery-home-columns">
        <section
          id="latest"
          className="discovery-home-latest"
          aria-busy={feed.isFetching}
        >
          <div className="discovery-section-title discovery-latest-title">
            <div>
              <h2 ref={heading} tabIndex={-1}>
                Latest
              </h2>
              <p>All sources · Newest published first</p>
            </div>
            <button type="button" onClick={refresh} disabled={feed.isFetching}>
              Refresh
            </button>
          </div>
          {feed.isPending ? (
            <div className="discovery-loading" role="status">
              Loading the latest updates…
            </div>
          ) : !feed.data && feed.isError ? (
            <div role="alert">
              {feed.error.message}
              <button onClick={refresh}>Retry</button>
            </div>
          ) : !items.length ? (
            <p>
              No published updates yet. Explore a sport to discover its
              organizations and events.
            </p>
          ) : (
            items.map((i) =>
              i.kind === "local" && i.local ? (
                <LocalDiscoveryCard key={i.id} item={i.local} />
              ) : (
                <DiscoveryCard key={i.id} item={i} feed />
              ),
            )
          )}
          {current?.localDiscoveryUnavailable && (
            <p role="status" className="discovery-note">
              Local discovery is temporarily unavailable. Community updates
              remain available. Refresh to try again.
            </p>
          )}
          {feed.isFetchNextPageError && (
            <p role="alert">
              The next page couldn’t load. Your current page is saved. Select
              Next to try again.
            </p>
          )}
          {items.length > 0 && (
            <FeedPagination
              page={visiblePage}
              count={items.length}
              hasNext={hasNext}
              busy={feed.isFetching}
              onPage={(next) => void goToPage(next)}
              atLimit={Boolean(current?.hasNextPage && !hasNext)}
            />
          )}
        </section>
        <aside className="discovery-home-directory">
          <div className="discovery-section-title">
            <h2>Coming up</h2>
            {first?.hasMoreEvents && (
              <Link href="/search_results?kind=events">See more →</Link>
            )}
          </div>
          {first?.upcoming.map((i) => (
            <DiscoveryCard key={i.id} item={i} />
          ))}
          {feed.isSuccess && !first?.upcoming.length && (
            <p>No upcoming events yet.</p>
          )}
          <div className="discovery-section-title">
            <h2>Explore organizations</h2>
            {first?.hasMoreOrganizations && (
              <Link href="/search_results?kind=organizations">See more →</Link>
            )}
          </div>
          {first?.organizations.map((i) => (
            <DiscoveryCard key={i.id} item={i} />
          ))}
        </aside>
        <aside className="discovery-home-sports">
          <h2 className="mt-6" id="all-sports-directory" tabIndex={-1}>
            Explore sports
          </h2>
          {sports.map((s) => (
            <Link
              key={s.key}
              href={s.href || "/"}
              className="discovery-sport-link"
            >
              {s.label}
              <span>→</span>
            </Link>
          ))}
          <Link
            className="discovery-sport-link"
            href="/search_results?kind=organizations"
          >
            Find an organization →
          </Link>
        </aside>
      </div>
    </main>
  );
}
