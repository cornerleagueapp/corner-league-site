import { useState } from "react";
import { Shield } from "lucide-react";
import { brandingImage } from "@/lib/consumerBranding";
export function teamColor(value?: string) {
  return /^#[\da-f]{6}$/i.test(value || "") ? value! : "#52667E";
}
export default function TeamLogo({
  team,
  large = false,
}: {
  team?: { name: string; logoUrl?: string; primaryColor?: string };
  large?: boolean;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const fallback = "/branding/team-default.svg";
  const custom = brandingImage(team?.logoUrl);
  const src = custom && !failed.includes(custom) ? custom : fallback;
  return (
    <span
      className={`cl-team-logo ${large ? "cl-team-logo-large" : ""}`}
      style={{ color: teamColor(team?.primaryColor) }}
    >
      {!failed.includes(src) ? (
        <img
          src={src}
          alt=""
          loading={large ? "eager" : "lazy"}
          decoding="async"
          onError={() =>
            setFailed((previous) =>
              previous.includes(src) ? previous : [...previous, src],
            )
          }
        />
      ) : (
        <Shield aria-hidden="true" />
      )}
    </span>
  );
}
