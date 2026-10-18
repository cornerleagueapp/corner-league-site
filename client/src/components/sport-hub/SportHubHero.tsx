import { sportVisual } from "@/lib/sportVisuals";
import SportArtwork from "./SportArtwork";
export default function SportHubHero({
  sport,
  target = "#upcoming-events",
  actionLabel = "Explore events",
}: {
  sport: string;
  target?: string;
  actionLabel?: string;
}) {
  return (
    <header className="sport-hub-hero">
      <div className="sport-hub-hero-copy">
        <p className="sport-hub-kicker">{sportVisual(sport).label} community</p>
        <h1>
          Your sport.
          <br />
          Your community.
        </h1>
        <p>
          Find events, follow the competition, and connect with the
          organizations bringing your sport to life.
        </p>
        <a className="sport-hub-button" href={target}>
          {actionLabel} <span aria-hidden="true">→</span>
        </a>
      </div>
      <SportArtwork sport={sport} className="sport-hub-hero-photo" />
    </header>
  );
}
