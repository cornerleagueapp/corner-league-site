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
  if (sport === "tennis" || sport === "pickleball")
    return (
      <svg
        className={`sport-artwork ${className}`}
        viewBox="0 0 100 56.25"
        preserveAspectRatio="xMidYMid slice"
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        focusable="false"
      >
        <path
          fill={sport === "tennis" ? "#17543d" : "#392264"}
          d="M0 0h100v56.25H0z"
        />
        <path
          fill="#32749b"
          stroke="white"
          strokeWidth=".65"
          d="M16 8h68v40H16z"
        />
        <path
          fill="none"
          stroke="white"
          strokeWidth=".65"
          d={
            sport === "tennis"
              ? "M16 28h68M24 8v40M76 8v40M24 18h52M24 38h52M50 18v20"
              : "M16 28h68M16 21h68M16 35h68M50 8v13M50 35v13"
          }
        />
        <circle cx="72" cy="15" r="3.2" fill="#d5f45b" />
      </svg>
    );
  if (sport === "volleyball")
    return (
      <svg
        className={`sport-artwork ${className}`}
        viewBox="0 0 100 56.25"
        preserveAspectRatio="xMidYMid slice"
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        focusable="false"
      >
        <path fill="#173a59" d="M0 0h100v56.25H0z" />
        <path
          fill="none"
          stroke="#84c7eb"
          strokeWidth=".65"
          opacity=".6"
          d="M16 12h68v32H16zM50 8v40M38 12v32M62 12v32"
        />
        <g fill="#173a59" stroke="#d2efff" strokeWidth=".85">
          <circle cx="50" cy="28" r="9" />
          <path
            fill="none"
            d="M47 19q-2 5 3 9t8 2m-8-2q-5 0-6 6m6-6q1-5 6-6m-1 14q-1-5-6-6m-5-8q-2 3 2 7"
          />
        </g>
      </svg>
    );
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
