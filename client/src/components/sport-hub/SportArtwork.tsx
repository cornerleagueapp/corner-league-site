import atlas from "@assets/sport-banners/sports-atlas.webp";
import { sportVisual } from "@/lib/sportVisuals";
/** A single bundled photo sheet; the SVG viewport clips the selected sport without external image requests. */
export default function SportArtwork({
  sport,
  className = "",
  alt = "",
}: {
  sport: string;
  className?: string;
  alt?: string;
}) {
  const tile = sportVisual(sport).tile;
  const x = (tile % 4) * 100,
    y = Math.floor(tile / 4) * 56.25;
  return (
    <svg
      className={`sport-artwork ${className}`}
      viewBox={`${x} ${y} 100 56.25`}
      preserveAspectRatio="xMidYMid slice"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      focusable="false"
    >
      <image
        href={atlas}
        x="0"
        y="0"
        width="400"
        height="225"
        preserveAspectRatio="none"
      />
    </svg>
  );
}
