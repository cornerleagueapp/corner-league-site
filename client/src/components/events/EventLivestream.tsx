import { youtubeEmbedUrl, eventLivestreamUrl } from "@/lib/eventLivestream";
export default function EventLivestream({
  url,
  name,
}: {
  url?: string | null;
  name: string;
}) {
  const embed = youtubeEmbedUrl(url),
    external = eventLivestreamUrl(url);
  if (!external) return null;
  return (
    <section className="event-stream-section" aria-label="Event livestream">
      <header className="event-section-heading">
        <div>
          <p className="event-eyebrow">Event coverage</p>
          <h2>Watch the stream</h2>
        </div>
        <a href={external} target="_blank" rel="noopener noreferrer">
          Open on provider ↗
        </a>
      </header>
      {embed ? (
        <div className="event-stream-video">
          <iframe
            src={embed}
            title={`${name} livestream`}
            loading="lazy"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <p>This stream is available on the organizer’s streaming provider.</p>
      )}
    </section>
  );
}
