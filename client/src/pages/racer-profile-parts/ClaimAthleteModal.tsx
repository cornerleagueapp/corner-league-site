import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X as XIcon } from "lucide-react";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-white/60">{label}</div>
      {children}
    </label>
  );
}

export function ClaimAthleteModal({
  racerName,
  onClose,
  onSubmit,
  loading,
}: {
  racerName: string;
  onClose: () => void;
  onSubmit: (v: {
    additionalInfo?: string;
    idCardImage: File;
  }) => Promise<void> | void;
  loading?: boolean;
}) {
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [idCardImage, setIdCardImage] = useState<File | null>(null);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto border border-cyan-300/10 bg-[#07111F] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] md:h-auto md:max-w-xl md:rounded-[30px] md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Claim Athlete Profile
          </h2>

          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 hover:bg-white/15"
            onClick={onClose}
            disabled={loading}
          >
            <XIcon size={16} />
          </button>
        </div>

        <p className="mb-4 text-sm text-white/70">
          Submit a claim for{" "}
          <span className="font-medium text-white">{racerName}</span>. Upload a
          clear ID image so an admin can verify ownership.
        </p>

        <div className="space-y-3">
          <Field label="Additional Info (optional)">
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
              placeholder="Add any details that help verify this athlete profile..."
            />
          </Field>

          <Field label="ID Card Image">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0] || null;

                if (!file) {
                  setIdCardImage(null);
                  return;
                }

                if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
                  alert("Please upload a JPG, PNG, or WEBP image.");
                  return;
                }

                setIdCardImage(file);
              }}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-white outline-none"
            />
          </Field>

          {!idCardImage && (
            <p className="text-xs text-red-300">
              An ID card image is required to submit a claim.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border border-white/10 bg-transparent text-white hover:bg-white/10"
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={async () => {
              if (!idCardImage) return;
              await onSubmit({ additionalInfo, idCardImage });
            }}
            className="bg-white text-black hover:bg-white/90"
            disabled={loading || !idCardImage}
          >
            {loading ? "Submitting..." : "Submit Claim"}
          </Button>
        </div>
      </div>
    </div>
  );
}
