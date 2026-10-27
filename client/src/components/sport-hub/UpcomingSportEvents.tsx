import EventDateScroller, {
  useEventDay,
} from "@/components/events/EventDateScroller";
import { dayWindow } from "@/lib/eventDay";
import { isTeamSport } from "@/lib/sportRegistration";
import TeamGameDirectory from "@/components/team-sports/TeamGameDirectory";
import LoadingCards from "@/components/ui/LoadingCards";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiFetch } from "@/lib/apiClient";
import {
  hubEventHref,
  upcomingHubEvents,
  type HubEvent,
} from "@/lib/sportHubEvents";
import SportArtwork from "./SportArtwork";
function EventPhoto({ event, sport }: { event: HubEvent; sport: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="sport-event-photo">
      {event.imageUrl && !failed ? (
        <img
          src={event.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <SportArtwork sport={sport} />
      )}
    </div>
  );
}
export default function UpcomingSportEvents({ sport }: { sport: string }) {
  return isTeamSport(sport) ? (
    <TeamGameDirectory key={sport} sport={sport} dateBrowsing />
  ) : (
    <UpcomingRaceEvents key={sport} sport={sport} />
  );
}
function UpcomingRaceEvents({ sport }: { sport: string }) {
  const [page, setPage] = useState(1);
  const [day, setDay] = useEventDay();
  const range = dayWindow(day);
  const query = useQuery({
    queryKey: ["sport-hub-events", sport, range.from, range.to, page],
    queryFn: async ({ signal }) => {
      const response = await apiFetch(
        `/sport-event?sportKey=${encodeURIComponent(sport)}&page=${page}&limit=12&order=ASC&sortBy=startDate&from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
        { skipAuth: true, noRefresh: true, signal },
      );
      if (!response.ok) throw new Error("Unable to load upcoming events.");
      const body = await response.json();
      return {
        items: upcomingHubEvents(body, sport, 0),
        hasNextPage: !!(body.data ?? body).meta?.hasNextPage,
      };
    },
    staleTime: 60_000,
    retry: 1,
  });
  const events = query.data?.items ?? [];
  return (
    <section
      id="upcoming-events"
      className="sport-hub-section"
      aria-labelledby="upcoming-title"
    >
      <div className="sport-section-heading">
        <h2 id="upcoming-title">Events & schedule</h2>
        <span className="text-sm text-cl-muted">
          {events.length > 0 ? "Published event dates" : "Around your sport"}
        </span>
      </div>
      <EventDateScroller
        value={day}
        onChange={(value) => {
          setDay(value);
          setPage(1);
        }}
      />
      {query.isPending ? (
        <LoadingCards label="Loading events…" />
      ) : query.isError ? (
        <div role="alert" className="sport-hub-empty">
          <p>We couldn’t load events right now.</p>
          <button
            className="sport-hub-button"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </div>
      ) : !events.length ? (
        <p className="sport-hub-empty">
          No published events for this date. Choose another day to explore the
          schedule.
        </p>
      ) : (
        <>
          <div className="sport-event-grid">
            {events.map((event) => (
              <article className="sport-event-card" key={event.id}>
                <EventPhoto
                  key={event.imageUrl ?? "default"}
                  event={event}
                  sport={sport}
                />
                <div className="sport-event-body">
                  <time dateTime={event.startDate}>
                    {new Date(event.startDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  <h3>{event.name}</h3>
                  <p>{event.organizationName}</p>
                  <p className="sport-event-location">{event.location}</p>
                  <Link
                    className="sport-hub-button"
                    href={hubEventHref(sport, event)}
                  >
                    View event <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {(page > 1 || query.data?.hasNextPage) && (
        <nav
          className="cl-sport-pagination"
          aria-label="Selected date event pages"
        >
          <button
            disabled={page === 1 || query.isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous page
          </button>
          <span>Page {page}</span>
          <button
            disabled={!query.data?.hasNextPage || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next page
          </button>
        </nav>
      )}
    </section>
  );
}
