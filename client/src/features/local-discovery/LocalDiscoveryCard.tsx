import { useState } from "react";
import { Link } from "wouter";
import { MapPin, ExternalLink } from "lucide-react";
import SportArtwork from "@/components/sport-hub/SportArtwork";
import { SPORT_VISUALS } from "@/lib/sportVisuals";
import {
  safeSourceUrl,
  localDate,
  localKind,
  localSport,
  type LocalOpportunity,
} from "./data";
import "./local-discovery.css";
export default function LocalDiscoveryCard({
  item: d,
  detail = false,
}: {
  item: LocalOpportunity;
  detail?: boolean;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const image =
    safeSourceUrl(d.imageUrl) && failedImage !== d.imageUrl ? d.imageUrl : null;
  const news = d.type === "announcement";
  return (
    <article
      className={`local-discovery-card ${detail ? "local-discovery-detail" : ""}`}
    >
      <div className="local-discovery-art" aria-hidden="true">
        {image ? (
          <img
            className="local-discovery-photo"
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailedImage(image)}
          />
        ) : Object.prototype.hasOwnProperty.call(SPORT_VISUALS, d.sport) ? (
          <SportArtwork sport={d.sport} />
        ) : (
          <svg
            className="local-discovery-fallback-art"
            viewBox="0 0 240 300"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id={`news-art-${d.id}`} x2="1" y2="1">
                <stop stopColor="#153b4b" />
                <stop offset="1" stopColor="#27646b" />
              </linearGradient>
            </defs>
            <rect width="240" height="300" fill={`url(#news-art-${d.id})`} />
            <path
              d="M-25 240 120 130 270 240M120 130v170M-20 270h280M25 201l190 0"
              fill="none"
              stroke="#83d8dd"
              strokeWidth="2"
              opacity=".4"
            />
            <g
              transform="translate(120 130)"
              fill="#f0eee3"
              stroke="#23444e"
              strokeWidth="2.5"
            >
              <circle r="47" />
              <path
                d={
                  d.sport === "volleyball"
                    ? "M0-47Q-25-12 0 0Q25 12 26 39M-44 17Q-2 26 0 0Q2-26 21-42M-21 42Q5 3 0 0Q-5-3-26-39"
                    : "M0-47V47M-47 0H47M-34-34Q12 0-34 34M34-34Q-12 0 34 34"
                }
                fill="none"
              />
            </g>
          </svg>
        )}
        <span>Local discovery</span>
      </div>
      <div className="local-discovery-copy">
        <p className="local-discovery-kicker">
          {localSport(d.sport)} · {localKind[d.type] || "Local activity"}
        </p>
        {detail ? (
          <h1>{d.title}</h1>
        ) : (
          <h3>
            <Link href={`/local-discovery/${encodeURIComponent(d.id)}`}>
              {d.title}
            </Link>
          </h3>
        )}
        <p className="local-discovery-location">
          <MapPin size={15} aria-hidden="true" />
          {d.city} · {d.county} County
        </p>
        <p>{d.summary}</p>
        {(!news ||
          d.startsAt ||
          d.endsAt ||
          d.registrationOpensAt ||
          d.registrationClosesAt) && (
          <dl className="local-discovery-facts">
            {!news && (
              <div>
                <dt>Who</dt>
                <dd>
                  {d.eligibility ||
                    { youth: "Youth", adult: "Adults", all: "All ages" }[
                      d.audience
                    ] ||
                    d.audience}
                </dd>
              </div>
            )}
            {d.startsAt && (
              <div>
                <dt>Starts</dt>
                <dd>
                  <time dateTime={d.startsAt}>{localDate(d.startsAt)}</time>
                </dd>
              </div>
            )}
            {d.endsAt && detail && (
              <div>
                <dt>Ends</dt>
                <dd>
                  <time dateTime={d.endsAt}>{localDate(d.endsAt)}</time>
                </dd>
              </div>
            )}
            {d.registrationOpensAt && (
              <div>
                <dt>Registration opens</dt>
                <dd>
                  <time dateTime={d.registrationOpensAt}>
                    {localDate(d.registrationOpensAt)}
                  </time>
                </dd>
              </div>
            )}
            {d.registrationClosesAt && (
              <div>
                <dt>Registration closes</dt>
                <dd>
                  <time dateTime={d.registrationClosesAt}>
                    {localDate(d.registrationClosesAt)}
                  </time>
                </dd>
              </div>
            )}
          </dl>
        )}
        <p className="local-discovery-source">
          Source:{" "}
          <a href={d.source.url} target="_blank" rel="noopener noreferrer">
            {d.source.name} <ExternalLink size={12} aria-hidden="true" />
          </a>
        </p>
        <p className="local-discovery-verified">
          {d.sourcePublishedAt && (
            <>
              <span>Published </span>
              <time dateTime={d.sourcePublishedAt}>
                {localDate(d.sourcePublishedAt)}
              </time>
            </>
          )}
          {(!news || detail) && (
            <>
              {d.sourcePublishedAt ? " · " : ""}Last verified{" "}
              <time dateTime={d.lastVerifiedAt}>
                {localDate(d.lastVerifiedAt)}
              </time>
            </>
          )}
          {news && !d.sourcePublishedAt && "Publication date unavailable"}
        </p>
        <div className="local-discovery-actions">
          <a
            className="local-discovery-cta"
            href={d.actionUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {d.type === "registration"
              ? "View registration"
              : news
                ? "Read article"
                : "View organizer details"}{" "}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
          {!detail && (
            <Link href={`/local-discovery/${encodeURIComponent(d.id)}`}>
              More details →
            </Link>
          )}
        </div>
        {detail && (
          <p className="local-discovery-disclaimer">
            {news ? (
              <>
                Article from {d.source.name}. Follow the source link to read the
                full story. Corner League links to the original publisher.
              </>
            ) : (
              <>
                Listed for local discovery. {d.source.name} provides the
                program; Corner League is not its organizer. Confirm
                availability, fees and eligibility with the source.
              </>
            )}{" "}
            Dates use your device timezone.
          </p>
        )}
      </div>
    </article>
  );
}
