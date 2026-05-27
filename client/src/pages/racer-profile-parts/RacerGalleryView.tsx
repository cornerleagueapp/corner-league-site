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
  onBack,
  canUpload,
  onUpload,
}: {
  racer: Racer;
  items: RacerGalleryItem[];
  loading: boolean;
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
    setIsUploadOpen(false);
    resetDrafts();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] text-white">
      <PageSEO
        title={`${racer.racerName || "Racer"} Gallery • Corner League`}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 sm:pt-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 transition hover:bg-cyan-300/15"
              aria-label="Back to racer profile"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
                Racer Gallery
              </div>

              <h1 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-5xl">
                {racer.racerName || "Racer"} Gallery
              </h1>

              <p className="mt-2 text-sm text-white/55">
                Highlights, moments, and memories on the water.
              </p>
            </div>
          </div>

          {canUpload ? (
            <Button
              type="button"
              onClick={() => setIsUploadOpen((prev) => !prev)}
              className="h-12 rounded-full bg-cyan-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-black hover:bg-cyan-200"
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
          <div
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm"
            onClick={closeUploadForm}
          >
            <div
              className="flex h-full w-full flex-col overflow-hidden bg-[#030913] text-white sm:m-6 sm:h-[calc(100vh-3rem)] sm:w-[calc(100vw-3rem)] sm:rounded-[30px] sm:border sm:border-cyan-300/15"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/70">
                    Upload Media
                  </div>
                  <p className="mt-1 text-sm text-white/50">
                    Add multiple photos or video clips to your racer gallery.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeUploadForm}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/15"
                  aria-label="Close upload form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={addDraft}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-300/15"
                  >
                    <Plus className="h-4 w-4" />
                    Add More
                  </button>
                </div>

                <div className="space-y-4">
                  {drafts.map((draft, index) => (
                    <div
                      key={draft.id}
                      className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
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
                            className="grid h-8 w-8 place-items-center rounded-full border border-red-300/20 bg-red-500/10 text-red-200"
                            aria-label="Remove upload row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <div className="mb-1 text-xs text-white/60">
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
                            className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/40"
                            placeholder="2026 Round Win"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-1 text-xs text-white/60">
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
                            className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-white outline-none"
                          />
                        </label>
                      </div>

                      <label className="mt-3 block">
                        <div className="mb-1 text-xs text-white/60">
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
                          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                          placeholder="Add a short caption..."
                        />
                      </label>

                      <label className="mt-3 flex items-center gap-2 text-sm text-white/70">
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
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-white/10 bg-[#030913] px-4 py-4 sm:px-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeUploadForm}
                  className="border border-white/10 bg-transparent text-white hover:bg-white/10"
                  disabled={uploading}
                >
                  Cancel
                </Button>

                <Button
                  disabled={uploading || !drafts.some((draft) => draft.file)}
                  onClick={async () => {
                    if (!onUpload) return;

                    try {
                      setUploading(true);
                      await onUpload(drafts.filter((draft) => draft.file));
                      resetDrafts();
                      setIsUploadOpen(false);
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className="bg-cyan-300 text-black hover:bg-cyan-200"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Media"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-cyan-300/10 bg-[#07111F]/85 p-6 text-sm text-white/60">
            Loading racer media…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[28px] border border-cyan-300/10 bg-[#07111F]/85 p-6 text-sm text-white/60">
            No gallery media has been uploaded yet.
          </div>
        ) : (
          <>
            {featured ? (
              <div className="mb-8 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/85 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-300/70">
                  Featured Highlight
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-center">
                  <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black">
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

                    <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      {featured.type === "video" ? "Video" : "Photo"}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-white">
                      {featured.title || "Featured Moment"}
                    </h2>

                    {featured.caption ? (
                      <p className="mt-3 text-sm leading-7 text-white/65">
                        {featured.caption}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-white/50">
              Recent Media
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMedia(item)}
                  className="group overflow-hidden rounded-[22px] border border-cyan-300/10 bg-[#07111F]/85 text-left transition hover:border-cyan-300/30"
                >
                  <div className="relative aspect-[4/3] bg-black">
                    <img
                      src={getGalleryThumb(item)}
                      alt={item.title || "Racer media"}
                      className="h-full w-full object-cover opacity-90 transition group-hover:scale-[1.03] group-hover:opacity-100"
                    />

                    <div className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white">
                      {item.type === "video" ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="line-clamp-2 text-sm font-semibold text-white">
                      {item.title || "Untitled Highlight"}
                    </div>

                    {item.caption ? (
                      <div className="mt-1 line-clamp-2 text-xs text-white/45">
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
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative max-h-full w-full max-w-6xl overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[#030913]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedMedia(null)}
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md hover:bg-black/70"
              aria-label="Close media preview"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="max-h-[82vh] overflow-y-auto">
              <div className="bg-black">
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
                    src={getGalleryThumb(selectedMedia)}
                    alt={selectedMedia.title || "Racer media"}
                    className="max-h-[72vh] w-full object-contain"
                  />
                )}
              </div>

              <div className="p-5">
                <div className="text-xl font-black text-white">
                  {selectedMedia.title || "Untitled Highlight"}
                </div>

                {selectedMedia.caption ? (
                  <p className="mt-2 text-sm leading-7 text-white/60">
                    {selectedMedia.caption}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
