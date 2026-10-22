import ConsumerMediaDialog from "@/components/ui/ConsumerMediaDialog";
import GalleryThumbnail from "@/components/media/GalleryThumbnail";
import { PageSEO } from "@/seo/usePageSEO";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Play,
  X,
} from "lucide-react";
import type { GalleryUploadDraft, Racer, RacerGalleryItem } from "./types";
import { getGalleryThumb } from "./racerProfileUtils";

export function RacerGalleryView({
  racer,
  items,
  loading,
  error,
  onRetry,
  onBack,
  canUpload,
  onUpload,
}: {
  racer: Racer;
  items: RacerGalleryItem[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onBack: () => void;
  canUpload?: boolean;
  onUpload?: (drafts: GalleryUploadDraft[]) => Promise<void> | void;
}) {
  const featured =
    items.find((item) => item.isFeatured || item.is_featured) ?? items[0];

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<RacerGalleryItem | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<GalleryUploadDraft[]>([
    {
      id: crypto.randomUUID(),
      title: "",
      caption: "",
      file: null,
      isFeatured: false,
    },
  ]);

  const addDraft = () => {
    setDrafts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        caption: "",
        file: null,
        isFeatured: false,
      },
    ]);
  };

  const resetDrafts = () => {
    setDrafts([
      {
        id: crypto.randomUUID(),
        title: "",
        caption: "",
        file: null,
        isFeatured: false,
      },
    ]);
  };

  const closeUploadForm = () => {
    if (uploading) return;
    setIsUploadOpen(false);
    setUploadError(null);
    resetDrafts();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cl-canvas text-cl-ink">
      <PageSEO
        title={`${racer.racerName || "Racer"} Gallery • Corner League`}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 sm:pt-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-cl-accent/15 bg-cl-accent/10 text-cl-accent transition hover:bg-cl-accent/15"
              aria-label="Back to racer profile"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 break-words">
              <div className="text-[10px] uppercase tracking-[0.24em] text-cl-accent">
                Racer Gallery
              </div>

              <h1 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] text-cl-ink sm:text-5xl">
                {racer.racerName || "Racer"} Gallery
              </h1>

              <p className="mt-2 text-sm text-cl-muted">
                Highlights, moments, and memories on the water.
              </p>
            </div>
          </div>

          {canUpload ? (
            <Button
              type="button"
              onClick={() => setIsUploadOpen((prev) => !prev)}
              className="h-12 rounded-full bg-cl-accent px-5 text-xs font-black uppercase tracking-[0.14em] text-cl-contrast hover:bg-cl-accent"
            >
              {isUploadOpen ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Close Form
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Content
                </>
              )}
            </Button>
          ) : null}
        </div>

        {canUpload && isUploadOpen ? (
          <ConsumerMediaDialog
            title="Upload racer media"
            description="Add photos or video clips to your racer gallery."
            busy={uploading}
            onClose={closeUploadForm}
            className="flex h-[calc(100dvh-2rem)] flex-col overflow-hidden"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-cl-border px-4 py-4 sm:px-6">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cl-accent">
                  Upload Media
                </div>
                <p className="mt-1 text-sm text-cl-muted">
                  Add multiple photos or video clips to your racer gallery.
                </p>
              </div>

              <button
                type="button"
                onClick={closeUploadForm}
                disabled={uploading}
                className="grid h-11 w-11 place-items-center rounded-full border border-cl-border bg-cl-subtle text-cl-ink hover:bg-cl-subtle"
                aria-label="Close upload form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <fieldset disabled={uploading} className="min-w-0">
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={addDraft}
                    className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-xs font-bold text-cl-accent hover:bg-cl-accent/15"
                  >
                    <Plus className="h-4 w-4" />
                    Add More
                  </button>
                </div>

                <div className="space-y-4">
                  {drafts.map((draft, index) => (
                    <div
                      key={draft.id}
                      className="rounded-[22px] border border-cl-border bg-cl-subtle p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-cl-muted">
                          Upload #{index + 1}
                        </div>

                        {drafts.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDrafts((prev) =>
                                prev.filter((item) => item.id !== draft.id),
                              )
                            }
                            className="grid h-8 w-8 place-items-center rounded-full border border-cl-danger/20 bg-cl-danger/10 text-cl-danger"
                            aria-label="Remove upload row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <div className="mb-1 text-xs text-cl-muted">
                            Media Title
                          </div>
                          <input
                            value={draft.title}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDrafts((prev) =>
                                prev.map((item) =>
                                  item.id === draft.id
                                    ? { ...item, title: value }
                                    : item,
                                ),
                              );
                            }}
                            className="h-10 w-full rounded-md border border-cl-border bg-cl-subtle px-3 text-sm text-cl-ink outline-none placeholder:text-cl-muted"
                            placeholder="2026 Round Win"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-1 text-xs text-cl-muted">
                            Media File
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                            onChange={(e) => {
                              const file = e.currentTarget.files?.[0] || null;
                              setDrafts((prev) =>
                                prev.map((item) =>
                                  item.id === draft.id
                                    ? { ...item, file }
                                    : item,
                                ),
                              );
                            }}
                            className="h-10 w-full rounded-md border border-cl-border bg-cl-subtle px-3 py-1 text-sm text-cl-ink outline-none"
                          />
                        </label>
                      </div>

                      <label className="mt-3 block">
                        <div className="mb-1 text-xs text-cl-muted">
                          Caption
                        </div>
                        <textarea
                          value={draft.caption}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDrafts((prev) =>
                              prev.map((item) =>
                                item.id === draft.id
                                  ? { ...item, caption: value }
                                  : item,
                              ),
                            );
                          }}
                          rows={3}
                          className="w-full rounded-md border border-cl-border bg-cl-subtle px-3 py-2 text-sm text-cl-ink outline-none placeholder:text-cl-muted"
                          placeholder="Add a short caption..."
                        />
                      </label>

                      <label className="mt-3 flex items-center gap-2 text-sm text-cl-muted">
                        <input
                          type="checkbox"
                          checked={draft.isFeatured}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDrafts((prev) =>
                              prev.map((item) =>
                                item.id === draft.id
                                  ? { ...item, isFeatured: checked }
                                  : item,
                              ),
                            );
                          }}
                        />
                        Make this featured gallery item
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            {uploadError ? (
              <p role="alert" className="px-4 py-2 text-sm text-cl-danger">
                {uploadError}
              </p>
            ) : null}
            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-cl-border bg-cl-canvas px-4 py-4 sm:px-6">
              <Button
                type="button"
                variant="ghost"
                onClick={closeUploadForm}
                className="border border-cl-border bg-transparent text-cl-ink hover:bg-cl-subtle"
                disabled={uploading}
              >
                Cancel
              </Button>

              <Button
                disabled={
                  uploading || !onUpload || !drafts.some((draft) => draft.file)
                }
                onClick={async () => {
                  if (!onUpload) return;

                  try {
                    setUploading(true);
                    setUploadError(null);
                    await onUpload(drafts.filter((draft) => draft.file));
                    resetDrafts();
                    setIsUploadOpen(false);
                  } catch {
                    setUploadError(
                      "Media could not upload. Some files may have completed; close and review your gallery before retrying.",
                    );
                  } finally {
                    setUploading(false);
                  }
                }}
                className="bg-cl-accent text-cl-contrast hover:bg-cl-accent"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Media"}
              </Button>
            </div>
          </ConsumerMediaDialog>
        ) : null}

        {loading ? (
          <div
            role="status"
            aria-busy="true"
            className="rounded-[28px] border border-cl-accent/10 bg-cl-surface p-6 text-sm text-cl-muted"
          >
            Loading racer media…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-cl-danger/30 bg-cl-surface p-6 text-cl-danger"
          >
            <p>{error}</p>
            <Button variant="outline" className="mt-3" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[28px] border border-cl-accent/10 bg-cl-surface p-6 text-sm text-cl-muted">
            No gallery media has been uploaded yet.
          </div>
        ) : (
          <>
            {featured ? (
              <div className="mb-8 rounded-[30px] border border-cl-accent/10 bg-cl-surface p-4 shadow-cl-panel">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cl-accent">
                  Featured Highlight
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-center">
                  <div className="relative overflow-hidden rounded-[24px] border border-cl-border bg-cl-canvas">
                    {featured.type === "video" ? (
                      <video
                        src={featured.url}
                        controls
                        playsInline
                        className="h-[260px] w-full object-cover sm:h-[380px]"
                      />
                    ) : (
                      <img
                        src={getGalleryThumb(featured)}
                        alt={featured.title || "Featured racer media"}
                        className="h-[260px] w-full object-cover sm:h-[380px]"
                      />
                    )}

                    <div className="cl-dark absolute left-4 top-4 rounded-full border border-cl-border bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cl-ink">
                      {featured.type === "video" ? "Video" : "Photo"}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-cl-ink">
                      {featured.title || "Featured Moment"}
                    </h2>

                    {featured.caption ? (
                      <p className="mt-3 text-sm leading-7 text-cl-muted">
                        {featured.caption}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cl-muted">
              Recent Media
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMedia(item)}
                  className="group min-w-0 overflow-hidden rounded-[22px] border border-cl-accent/10 bg-cl-surface text-left transition hover:border-cl-accent/30"
                >
                  <div className="relative aspect-[4/3] bg-cl-canvas">
                    <GalleryThumbnail
                      video={item.type === "video"}
                      src={
                        item.type === "video"
                          ? item.thumbnailUrl || item.thumbnail_url
                          : getGalleryThumb(item)
                      }
                      alt={item.title || "Racer media"}
                      className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                    />

                    <div className="cl-dark absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-cl-ink">
                      {item.type === "video" ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="line-clamp-2 text-sm font-semibold text-cl-ink">
                      {item.title || "Untitled Highlight"}
                    </div>

                    {item.caption ? (
                      <div className="mt-1 line-clamp-2 text-xs text-cl-muted">
                        {item.caption}
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedMedia ? (
        <ConsumerMediaDialog
          title={selectedMedia.title || "Racer media"}
          description="Racer gallery media preview."
          onClose={() => setSelectedMedia(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className="cl-dark absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-cl-border bg-black/50 text-cl-ink backdrop-blur-md hover:bg-black/70"
            aria-label="Close media preview"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="max-h-[82vh] overflow-y-auto">
            <div className="bg-cl-canvas">
              {selectedMedia.type === "video" ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[72vh] w-full object-contain"
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title || "Racer media"}
                  className="max-h-[72vh] w-full object-contain"
                />
              )}
            </div>

            <div className="p-5">
              <div className="text-xl font-black text-cl-ink">
                {selectedMedia.title || "Untitled Highlight"}
              </div>

              {selectedMedia.caption ? (
                <p className="mt-2 text-sm leading-7 text-cl-muted">
                  {selectedMedia.caption}
                </p>
              ) : null}
            </div>
          </div>
        </ConsumerMediaDialog>
      ) : null}
    </div>
  );
}
