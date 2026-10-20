import { useEffect, useId, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import {
  loadEventGallery,
  writeEventPhoto,
  responseData,
  type EventPhoto,
} from "@/lib/eventGallery";
import { safeRacerLink, type GalleryTag } from "@/lib/organizationGallery";
export default function EventPhotoGallery({ eventId }: { eventId: string }) {
  const { user, isAuthenticated } = useAuth(),
    cache = useQueryClient();
  const [page, setPage] = useState(1),
    [reviewPage, setReviewPage] = useState(1),
    [review, setReview] = useState(false);
  const [file, setFile] = useState<File | null>(null),
    [caption, setCaption] = useState(""),
    [input, setInput] = useState(""),
    [search, setSearch] = useState(""),
    [tags, setTags] = useState<GalleryTag[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [rights, setRights] = useState(false),
    [selected, setSelected] = useState<EventPhoto | null>(null);
  const writing = useRef(false),
    requestKey = useRef<string | null>(null),
    formRef = useRef<HTMLFormElement>(null),
    formId = useId();
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input]);
  useEffect(() => {
    setReview(false);
    setSelected(null);
    setReviewPage(1);
    setFile(null);
    setTags([]);
    setError("");
    setMessage("");
    setCaption("");
    setInput("");
    setSearch("");
    setRights(false);
    requestKey.current = null;
    formRef.current?.reset();
  }, [user?.id]);
  const publicQuery = useQuery({
    queryKey: ["event-gallery", eventId, "public", page],
    queryFn: () => loadEventGallery(eventId, page),
    retry: false,
  });
  const privateQuery = useQuery({
    queryKey: ["event-gallery", eventId, user?.id, "review", reviewPage],
    queryFn: () => loadEventGallery(eventId, reviewPage, true),
    enabled: isAuthenticated && !!user?.id,
    retry: false,
  });
  const athletes = useQuery<{ items: GalleryTag[] }>({
    queryKey: ["event-gallery-athletes", eventId, user?.id, search],
    queryFn: async () =>
      responseData(
        await apiRequest(
          "GET",
          `/organization-gallery/events/${encodeURIComponent(eventId)}/athletes?search=${encodeURIComponent(search)}&limit=12`,
        ),
      ),
    enabled: isAuthenticated && !!user?.id && search.length >= 2,
    retry: false,
  });
  const showReview = review && isAuthenticated,
    query = showReview ? privateQuery : publicQuery,
    currentPage = showReview ? reviewPage : page;
  async function refresh() {
    await cache.invalidateQueries({ queryKey: ["event-gallery", eventId] });
  }
  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (writing.current || !file || !rights) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG, or WebP image up to 8 MB.");
      return;
    }
    writing.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      requestKey.current ??= crypto.randomUUID();
      const body = new FormData();
      body.append("media", file);
      body.append("clientRequestId", requestKey.current);
      body.append("caption", caption);
      body.append("athleteIds", JSON.stringify(tags.map((t) => t.athleteId)));
      await writeEventPhoto(encodeURIComponent(eventId), "POST", body);
      setFile(null);
      setCaption("");
      setTags([]);
      setInput("");
      setRights(false);
      requestKey.current = null;
      formRef.current?.reset();
      setMessage(
        "Photo submitted for organizer review. It will appear publicly after approval.",
      );
      setReview(true);
      setReviewPage(1);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  async function action(photo: EventPhoto, remove = false) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      const path = `${encodeURIComponent(eventId)}/${encodeURIComponent(photo.id)}`;
      await writeEventPhoto(
        remove ? `${path}?revision=${photo.revision}` : path,
        remove ? "DELETE" : "PATCH",
        remove
          ? undefined
          : { revision: photo.revision, published: !photo.published },
      );
      setMessage(
        remove
          ? "Photo removed."
          : photo.published
            ? "Photo hidden from the public gallery."
            : "Photo published.",
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="event-gallery-section" aria-label="Event photo gallery">
      <header className="event-section-heading">
        <div>
          <p className="event-eyebrow">From the community</p>
          <h2>Event photos</h2>
          <p>Photos from organizers and fans, reviewed by the organization.</p>
        </div>
        <Camera aria-hidden="true" />
      </header>
      {isAuthenticated ? (
        <details className="event-photo-upload">
          <summary>Upload a photo</summary>
          <form ref={formRef} onSubmit={upload} className="event-photo-form">
            <label htmlFor={`${formId}-file`}>
              Photo
              <input
                id={`${formId}-file`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                disabled={busy}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  requestKey.current = null;
                }}
              />
            </label>
            <p className="text-sm text-cl-muted">
              JPEG, PNG or WebP · up to 8 MB · 20 submissions per day
            </p>
            <label>
              Caption
              <textarea
                value={caption}
                maxLength={2000}
                disabled={busy}
                onChange={(e) => {
                  setCaption(e.target.value);
                  requestKey.current = null;
                }}
              />
            </label>
            <label>
              Tag athletes (optional)
              <input
                type="search"
                placeholder="Search athletes by name"
                value={input}
                maxLength={80}
                disabled={busy}
                onChange={(e) => setInput(e.target.value)}
              />
            </label>
            {search.length >= 2 && (
              <div className="event-athlete-options">
                {athletes.isPending ? (
                  <p role="status">Finding athletes…</p>
                ) : athletes.isError ? (
                  <p role="alert">Athlete search is unavailable.</p>
                ) : !athletes.data?.items.length ? (
                  <p>No matching athletes.</p>
                ) : (
                  athletes.data.items.map((t) => (
                    <label key={t.athleteId}>
                      <input
                        type="checkbox"
                        checked={tags.some(
                          (tag) => tag.athleteId === t.athleteId,
                        )}
                        disabled={
                          busy ||
                          (!tags.some((tag) => tag.athleteId === t.athleteId) &&
                            tags.length >= 10)
                        }
                        onChange={(e) => {
                          setTags((current) =>
                            e.target.checked
                              ? [...current, t]
                              : current.filter(
                                  (tag) => tag.athleteId !== t.athleteId,
                                ),
                          );
                          requestKey.current = null;
                        }}
                      />
                      {t.name}
                    </label>
                  ))
                )}
              </div>
            )}
            {!!tags.length && (
              <div className="event-photo-tags">
                {tags.map((t) => (
                  <button
                    type="button"
                    key={t.athleteId}
                    disabled={busy}
                    onClick={() => {
                      setTags((current) =>
                        current.filter((tag) => tag.athleteId !== t.athleteId),
                      );
                      requestKey.current = null;
                    }}
                    aria-label={`Remove ${t.name} tag`}
                  >
                    {t.name} ×
                  </button>
                ))}
              </div>
            )}
            <label className="event-photo-consent">
              <input
                type="checkbox"
                required
                checked={rights}
                disabled={busy}
                onChange={(e) => setRights(e.target.checked)}
              />
              I have permission to share this photo publicly and tag the people
              shown.
            </label>
            <button
              className="sport-hub-button"
              disabled={busy || !file || !rights}
              type="submit"
            >
              {busy ? "Saving…" : "Submit for review"}
            </button>
          </form>
        </details>
      ) : (
        <Link
          className="sport-hub-more"
          href={`/auth?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : `/aqua-organizations/event-details/${eventId}`)}`}
        >
          Sign in to share your photos →
        </Link>
      )}
      {error && (
        <p role="alert" className="event-gallery-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="event-gallery-message">
          {message}
        </p>
      )}
      <div className="event-gallery-tabs">
        <button
          type="button"
          aria-pressed={!showReview}
          onClick={() => setReview(false)}
        >
          Published photos
        </button>
        {isAuthenticated && (
          <button
            type="button"
            aria-pressed={showReview}
            onClick={() => setReview(true)}
          >
            {privateQuery.data?.canModerate
              ? "Review submissions"
              : "My submissions"}
          </button>
        )}
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={query.isFetching}
        >
          Refresh
        </button>
      </div>
      {query.isPending ? (
        <p role="status">Loading photos…</p>
      ) : query.isError ? (
        <p role="alert">Photos couldn’t be loaded. Please try Refresh.</p>
      ) : !query.data?.items.length ? (
        <p className="event-gallery-empty">
          {showReview
            ? "No submissions yet."
            : "No published photos yet. Share your view of the event."}
        </p>
      ) : (
        <div className="event-photo-grid">
          {query.data.items.map((photo) => (
            <article key={photo.id} className="event-photo-card">
              <button
                className="event-photo-image"
                type="button"
                onClick={() => setSelected(photo)}
                aria-label={`View ${photo.caption || "event photo"} full screen`}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "Event photo"}
                  loading="lazy"
                />
              </button>
              <div className="event-photo-caption">
                {showReview && (
                  <p className="event-eyebrow">
                    {photo.published ? "Published" : "Awaiting review"}
                  </p>
                )}
                {photo.caption && <p>{photo.caption}</p>}
                <div className="event-photo-tags">
                  {photo.tags.map((tag) =>
                    safeRacerLink(tag.profileUrl) ? (
                      <Link
                        key={tag.athleteId}
                        href={safeRacerLink(tag.profileUrl)!}
                      >
                        {tag.name}
                      </Link>
                    ) : (
                      <span key={tag.athleteId}>{tag.name}</span>
                    ),
                  )}
                </div>
                {showReview && (
                  <div className="event-photo-actions">
                    {privateQuery.data?.canModerate && (
                      <button
                        disabled={busy}
                        onClick={() => void action(photo)}
                      >
                        {photo.published ? "Unpublish" : "Publish"}
                      </button>
                    )}
                    {photo.canRemove && (
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove this photo from the gallery?",
                            )
                          )
                            void action(photo, true);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <nav className="event-gallery-pagination" aria-label="Photo pages">
        <button
          disabled={currentPage === 1 || query.isFetching}
          onClick={() =>
            showReview ? setReviewPage((p) => p - 1) : setPage((p) => p - 1)
          }
        >
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button
          disabled={
            !query.data ||
            currentPage * 12 >= query.data.total ||
            query.isFetching
          }
          onClick={() =>
            showReview ? setReviewPage((p) => p + 1) : setPage((p) => p + 1)
          }
        >
          Next
        </button>
      </nav>
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="profile-photo-overlay" />
          <Dialog.Content
            className="profile-photo-viewer"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">Event photo</Dialog.Title>
            <Dialog.Close
              className="profile-photo-close"
              aria-label="Close photo"
            >
              <X />
            </Dialog.Close>
            {selected && (
              <img src={selected.url} alt={selected.caption || "Event photo"} />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
