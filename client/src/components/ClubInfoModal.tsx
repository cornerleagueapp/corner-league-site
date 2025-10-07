import React from "react";
import { cn } from "@/lib/utils";

export function ClubInfoModal({
  open,
  onClose,
  club,
  isOwner,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
  onEdit: () => void;
  club: { id: string; name: string; description?: string; ownerName?: string };
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 mx-auto mt-20 w-[92%] max-w-md",
          "rounded-xl border border-white/10 bg-[#0b0f18] p-5"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Club info"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">Club Info</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div>
            <div className="text-white/60">Name</div>
            <div className="text-white">{club.name || "—"}</div>
          </div>
          <div>
            <div className="text-white/60">Description</div>
            <div className="text-white">{club.description || "—"}</div>
          </div>
          <div>
            <div className="text-white/60">Owner</div>
            <div className="text-white">{club.ownerName || "—"}</div>
          </div>
        </div>

        {isOwner && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-md bg-white text-black hover:bg-gray-200"
            >
              Edit Club
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClubInfoModal;
