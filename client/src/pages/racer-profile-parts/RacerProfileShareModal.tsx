import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Copy, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Racer, RacerRatingCard, RacerSponsor } from "./types";
import RacerProfileShareCard from "./RacerProfileShareCard";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

export type ShareHighlightStat = "worldFinals" | "pageViews";

export default function RacerProfileShareModal({
  open,
  onClose,
  racer,
  ratingCard,
  profileViewCount,
  sponsors = [],
}: {
  open: boolean;
  onClose: () => void;
  racer: Racer;
  ratingCard: RacerRatingCard | null;
  profileViewCount?: number | null;
  sponsors?: RacerSponsor[];
}) {
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [highlightStatMode, setHighlightStatMode] =
    useState<ShareHighlightStat>("worldFinals");

  if (!open) return null;

  async function handleCopyLink() {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Profile link copied" });
    } catch {
      toast({
        title: "Could not copy link",
        description: window.location.href,
      });
    } finally {
      setCopying(false);
    }
  }

  async function handleSaveImage() {
    if (!exportRef.current) return;

    try {
      setSaving(true);

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#030913",
        skipAutoScale: true,
      });

      const link = document.createElement("a");
      link.download = `${(racer.racerName || "racer")
        .toLowerCase()
        .replace(/\s+/g, "-")}-profile-share.png`;
      link.href = dataUrl;
      link.click();

      toast({ title: "Profile image saved" });
    } catch (error) {
      console.error("[RacerProfileShareModal] export failed", error);
      toast({
        title: "Unable to save image",
        description:
          "This is usually caused by image CORS on uploaded profile/header images. The storage bucket needs CORS enabled for image exports.",
      });
    } finally {
      setSaving(false);
    }
  }

  function getToggleClass(mode: ShareHighlightStat) {
    const isActive = highlightStatMode === mode;

    return [
      "h-12 flex-1 rounded-[14px] border px-3 text-xs font-black uppercase tracking-[0.08em] transition",
      isActive
        ? "border-cl-accent bg-cl-accent text-cl-contrast shadow-cl-panel"
        : "border-cl-border bg-cl-subtle text-cl-muted hover:border-cl-accent/25 hover:bg-cl-accent/10 hover:text-cl-accent",
    ].join(" ");
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close share modal"
      />

      <div className="relative z-10 flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-cl-accent/20 bg-cl-canvas shadow-cl-panel">
        <div className="flex items-center justify-between border-b border-cl-border px-5 py-4 sm:px-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cl-accent">
              Share Racer Profile
            </div>
            <div className="mt-1 text-sm text-cl-muted">
              Copy the profile link or save a social-ready image
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-cl-border bg-cl-subtle text-cl-ink transition hover:bg-cl-subtle"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-[540px] items-center justify-center overflow-hidden rounded-[24px] border border-cl-border bg-cl-surface p-3 sm:min-h-[640px]">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              <div
                className="origin-center"
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: "scale(var(--share-scale))",
                }}
              >
                <div ref={exportRef}>
                  <RacerProfileShareCard
                    racer={racer}
                    ratingCard={ratingCard}
                    profileViewCount={profileViewCount}
                    sponsors={sponsors}
                    highlightStatMode={highlightStatMode}
                  />
                </div>
              </div>
            </div>

            <style>{`
              :root {
                --share-scale: 0.28;
              }

              @media (min-width: 640px) {
                :root {
                  --share-scale: 0.36;
                }
              }

              @media (min-width: 768px) {
                :root {
                  --share-scale: 0.43;
                }
              }

              @media (min-width: 1024px) {
                :root {
                  --share-scale: 0.46;
                }
              }

              @media (min-width: 1280px) {
                :root {
                  --share-scale: 0.50;
                }
              }
            `}</style>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-4">
              <div className="text-sm font-bold text-cl-ink">
                Ready for social posting
              </div>
              <p className="mt-2 text-sm leading-6 text-cl-muted">
                This exports a clean, branded racer profile image without edit
                buttons or extra page UI.
              </p>
            </div>

            <div className="rounded-[24px] border border-cl-accent/10 bg-cl-accent/[0.04] p-4">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-cl-accent">
                Highlight Stat
              </div>

              <p className="mt-2 text-xs leading-5 text-cl-muted">
                Choose which stat appears in the share card highlight box.
              </p>

              <div className="mt-3 flex gap-2 rounded-[18px] border border-cl-border bg-cl-surface p-1.5">
                <button
                  type="button"
                  onClick={() => setHighlightStatMode("worldFinals")}
                  className={getToggleClass("worldFinals")}
                >
                  World Finals
                </button>

                <button
                  type="button"
                  onClick={() => setHighlightStatMode("pageViews")}
                  className={getToggleClass("pageViews")}
                >
                  Page Views
                </button>
              </div>
            </div>

            <Button
              onClick={handleCopyLink}
              disabled={copying}
              className="h-14 rounded-[16px] bg-cl-accent text-sm font-black uppercase tracking-[0.08em] text-cl-contrast hover:bg-cl-accent"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copying ? "Copying..." : "Copy Link"}
            </Button>

            <Button
              onClick={handleSaveImage}
              disabled={saving}
              className="h-14 rounded-[16px] border border-cl-accent/30 bg-cl-accent/[0.12] text-sm font-black uppercase tracking-[0.08em] text-cl-accent hover:bg-cl-accent/[0.18]"
            >
              <Download className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Image"}
            </Button>

            <div className="rounded-[20px] border border-cl-accent/10 bg-cl-canvas p-4 text-xs leading-6 text-cl-muted">
              Tip: the saved image is ideal for posts, stories, messages, or
              sending directly to sponsors and fans.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
