import { Check, Copy, Loader2, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type RegistrationShareButtonProps = {
  eventName: string;
  eventSlug: string;

  startDate?: string;
  endDate?: string;

  variant?: "primary" | "secondary" | "icon";
  className?: string;
};

function formatEventDateRange(startDate?: string, endDate?: string) {
  if (!startDate) {
    return "";
  }

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (Number.isNaN(start.getTime())) {
    return "";
  }

  const startText = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!end || Number.isNaN(end.getTime())) {
    return startText;
  }

  const sameDate =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDate) {
    return startText;
  }

  const endText = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startText} – ${endText}`;
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);

  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Unable to copy the event link.");
  }
}

export default function RegistrationShareButton({
  eventName,
  eventSlug,
  startDate,
  endDate,
  variant = "secondary",
  className = "",
}: RegistrationShareButtonProps) {
  const { toast } = useToast();

  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/registration/events/${eventSlug}`;
    }

    return `${window.location.origin}/registration/events/${eventSlug}`;
  }, [eventSlug]);

  const dateRange = useMemo(
    () => formatEventDateRange(startDate, endDate),
    [startDate, endDate],
  );

  async function handleShare() {
    if (sharing) {
      return;
    }

    setSharing(true);

    const shareText = [
      `Register for ${eventName} through Corner League.`,
      dateRange,
    ]
      .filter(Boolean)
      .join(" ");

    try {
      if (
        typeof navigator.share === "function" &&
        window.matchMedia("(pointer: coarse)").matches
      ) {
        await navigator.share({
          title: `${eventName} Registration`,
          text: shareText,
          url: shareUrl,
        });

        toast({
          title: "Event shared",
          description: "The registration link is ready to send to racers.",
        });

        return;
      }

      await copyTextToClipboard(shareUrl);

      setCopied(true);

      toast({
        title: "Registration link copied",
        description: `${eventName} can now be shared anywhere.`,
      });

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return;
      }

      console.error("Unable to share registration event", error);

      toast({
        title: "Unable to share event",
        description:
          error?.message ||
          "The registration link could not be copied. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  }

  const iconOnly = variant === "icon";

  const classes =
    variant === "primary"
      ? "border border-cyan-200/25 bg-cyan-300 text-[#06111d] shadow-[0_0_26px_rgba(34,211,238,0.2)] hover:bg-cyan-200"
      : variant === "icon"
        ? "border border-white/10 bg-white/[0.05] text-white/70 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
        : "border border-white/10 bg-white/[0.05] text-white/75 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white";

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharing}
      aria-label={`Share registration for ${eventName}`}
      title={`Share registration for ${eventName}`}
      className={`inline-flex items-center justify-center gap-2 rounded-full text-xs font-black uppercase tracking-[0.14em] transition disabled:cursor-wait disabled:opacity-60 ${
        iconOnly ? "h-11 w-11 p-0" : "min-h-11 px-4 py-3"
      } ${classes} ${className}`}
    >
      {sharing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4" />
      ) : iconOnly ? (
        <Share2 className="h-4 w-4" />
      ) : typeof navigator !== "undefined" &&
        typeof navigator.share === "function" ? (
        <Share2 className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}

      {!iconOnly ? (
        <span>
          {sharing ? "Sharing" : copied ? "Link Copied" : "Share Event"}
        </span>
      ) : null}
    </button>
  );
}
