import { useState } from "react";
import { Link } from "wouter";
import SportArtwork from "@/components/sport-hub/SportArtwork";
import {
  organizationEventDate,
  organizationEventHref,
  type OrganizationEvent,
} from "@/lib/organizationPresentation";
function EventPhoto({
  event,
  sport,
}: {
  event: OrganizationEvent;
  sport: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="org-community-event-photo">
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
export default function OrganizationEventCards({
  events,
  organizationId,
  sport,
  sandboxId,
}: {
  events: OrganizationEvent[];
  organizationId: string;
  sport: string;
  sandboxId?: string;
}) {
  return (
    <div className="org-community-event-grid">
      {events.map((event) => (
        <article className="org-community-event-card" key={event.id}>
          <EventPhoto
            key={event.imageUrl ?? "default"}
            event={event}
            sport={sport}
          />
          <div className="org-community-event-body">
            <p className="org-community-eyebrow">
              {Date.parse(event.endDate) < Date.now()
                ? "Past event"
                : Date.parse(event.startDate) <= Date.now()
                  ? "Event underway"
                  : "Upcoming event"}
            </p>
            <h3>{event.name}</h3>
            <p>
              <time dateTime={event.startDate}>
                {organizationEventDate(event.startDate, event.endDate)}
              </time>
            </p>
            <p>{event.location || "Location to be announced"}</p>
            {event.description && (
              <p className="org-community-event-summary">{event.description}</p>
            )}
            <Link
              className="sport-hub-button"
              href={organizationEventHref(
                sport,
                organizationId,
                event.id,
                sandboxId,
              )}
            >
              View event <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
