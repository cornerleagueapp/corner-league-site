import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Copy, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Racer, RacerRatingCard, RacerSponsor } from "./types";
import RacerProfileShareCard from "./RacerProfileShareCard";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close share modal"
      />

      <div className="relative z-10 flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#07111F] shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Share Racer Profile
            </div>
            <div className="mt-1 text-sm text-white/45">
              Copy the profile link or save a social-ready image
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-white/80 transition hover:bg-white/15"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-[540px] items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-3 sm:min-h-[640px]">
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
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm font-bold text-white">
                Ready for social posting
              </div>
              <p className="mt-2 text-sm leading-6 text-white/60">
                This exports a clean, branded racer profile image without edit
                buttons or extra page UI.
              </p>
            </div>

            <Button
              onClick={handleCopyLink}
              disabled={copying}
              className="h-14 rounded-[16px] bg-cyan-300 text-sm font-black uppercase tracking-[0.08em] text-[#06111d] hover:bg-cyan-200"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copying ? "Copying..." : "Copy Link"}
            </Button>

            <Button
              onClick={handleSaveImage}
              disabled={saving}
              className="h-14 rounded-[16px] border border-[#FF6B35]/30 bg-[#FF6B35]/12 text-sm font-black uppercase tracking-[0.08em] text-[#FFB199] hover:bg-[#FF6B35]/18"
            >
              <Download className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Image"}
            </Button>

            <div className="rounded-[20px] border border-cyan-300/10 bg-[#03101B] p-4 text-xs leading-6 text-white/45">
              Tip: the saved image is ideal for posts, stories, messages, or
              sending directly to sponsors and fans.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
