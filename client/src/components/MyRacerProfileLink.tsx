import React from "react";
import { useMyRacerProfile } from "@/hooks/useMyRacerProfile";
import { Trophy } from "lucide-react";

export default function MyRacerProfileLink({
  onNavigate,
}: {
  onNavigate: (url: string) => void;
}) {
  const identity = useMyRacerProfile();
  const profile = identity.data?.profile;
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onNavigate(profile?.profileUrl || "/create-racer-profile")}
      className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
    >
      <Trophy className="h-4 w-4 shrink-0 text-cyan-200" />
      {identity.isPending
        ? "Racer profile…"
        : identity.isError
          ? "Racer profile"
          : profile
            ? "My Racer Profile"
            : identity.data?.pendingClaim
              ? "Racer claim pending"
              : "Create racer profile"}
    </button>
  );
}
