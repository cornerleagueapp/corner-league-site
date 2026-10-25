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
  const [failed, setFailed] = useState("");
  const src = brandingImage(team?.logoUrl);
  return (
    <span
      className={`cl-team-logo ${large ? "cl-team-logo-large" : ""}`}
      style={{ color: teamColor(team?.primaryColor) }}
    >
      {src && failed !== src ? (
        <img src={src} alt="" onError={() => setFailed(src)} />
      ) : (
        <Shield aria-hidden="true" />
      )}
    </span>
  );
}
