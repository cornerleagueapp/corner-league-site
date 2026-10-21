import { useState } from "react";
import { Image as ImageIcon, Play } from "lucide-react";

export default function GalleryThumbnail({
  src,
  alt,
  video = false,
  className = "",
}: {
  src?: string | null;
  alt: string;
  video?: boolean;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || src === failedSrc) {
    const Icon = video ? Play : ImageIcon;
    return (
      <div
        role="img"
        aria-label={
          video ? `${alt} — video preview` : `${alt} — preview unavailable`
        }
        className={`grid place-items-center bg-cl-subtle text-cl-muted ${className}`}
      >
        <Icon aria-hidden="true" className="h-10 w-10" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}
