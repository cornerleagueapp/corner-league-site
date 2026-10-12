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
      <div className="mb-1 text-xs text-cl-muted">{label}</div>
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
        className="h-full w-full overflow-y-auto border border-cl-accent/10 bg-cl-canvas p-4 shadow-cl-panel md:h-auto md:max-w-xl md:rounded-[30px] md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-cl-ink">
            Claim Athlete Profile
          </h2>

          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-cl-border bg-cl-subtle hover:bg-cl-subtle"
            onClick={onClose}
            disabled={loading}
          >
            <XIcon size={16} />
          </button>
        </div>

        <p className="mb-4 text-sm text-cl-muted">
          Submit a claim for{" "}
          <span className="font-medium text-cl-ink">{racerName}</span>. Upload a
          clear ID image so an admin can verify ownership.
        </p>

        <div className="space-y-3">
          <Field label="Additional Info (optional)">
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-cl-border bg-cl-subtle px-3 py-2 text-sm text-cl-ink outline-none placeholder:text-cl-muted"
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
              className="h-10 w-full rounded-md border border-cl-border bg-cl-subtle px-3 py-1 text-sm text-cl-ink outline-none"
            />
          </Field>

          {!idCardImage && (
            <p className="text-xs text-cl-danger">
              An ID card image is required to submit a claim.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border border-cl-border bg-transparent text-cl-ink hover:bg-cl-subtle"
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={async () => {
              if (!idCardImage) return;
              await onSubmit({ additionalInfo, idCardImage });
            }}
            className="bg-cl-surface text-cl-ink hover:bg-cl-subtle"
            disabled={loading || !idCardImage}
          >
            {loading ? "Submitting..." : "Submit Claim"}
          </Button>
        </div>
      </div>
    </div>
  );
}
