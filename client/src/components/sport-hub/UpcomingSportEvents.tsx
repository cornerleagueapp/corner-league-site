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
          onError={() => setFailed(true)}
        />
      ) : (
        <SportArtwork sport={sport} />
      )}
    </div>
  );
}
export default function UpcomingSportEvents({ sport }: { sport: string }) {
  const [count, setCount] = useState(4);
  const query = useQuery({
    queryKey: ["sport-hub-events", sport],
    queryFn: async ({ signal }) => {
      const response = await apiFetch(
        `/sport-event?sportKey=${encodeURIComponent(sport)}&page=1&limit=50&order=DESC&sortBy=startDate`,
        { skipAuth: true, noRefresh: true, signal },
      );
      if (!response.ok) throw new Error("Unable to load upcoming events.");
      return upcomingHubEvents(await response.json(), sport);
    },
    staleTime: 60_000,
    retry: 1,
  });
  const events = (query.data ?? []).filter(
    (event) => Date.parse(event.endDate) >= Date.now(),
  );
  return (
    <section
      id="upcoming-events"
      className="sport-hub-section"
      aria-labelledby="upcoming-title"
    >
      <div className="sport-section-heading">
        <h2 id="upcoming-title">Upcoming events</h2>
        <span className="text-sm text-cl-muted">
          {events.length > 0 ? "Published event dates" : "Around your sport"}
        </span>
      </div>
      {query.isPending ? (
        <p role="status" className="sport-hub-empty">
          Loading events…
        </p>
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
          New event dates will appear here when organizations publish them.
          Explore the organizations below in the meantime.
        </p>
      ) : (
        <>
          <div className="sport-event-grid">
            {events.slice(0, count).map((event) => (
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
          {events.length > count && (
            <button
              className="sport-hub-more"
              onClick={() => setCount((value) => value + 4)}
            >
              Show more events
            </button>
          )}
        </>
      )}
    </section>
  );
}
