import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Save,
  Sparkles,
  Trophy,
  X as XIcon,
} from "lucide-react";

export type EditWorldFinalsValues = {
  careerWorldFinalsWins: number;
};

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-white/60">{label}</div>
      {children}
      {helper ? (
        <div className="mt-1.5 text-xs leading-5 text-white/40">{helper}</div>
      ) : null}
    </label>
  );
}

export function EditWorldFinalsModal({
  initial,
  onClose,
  onSave,
}: {
  initial: EditWorldFinalsValues;
  onClose: () => void;
  onSave: (values: EditWorldFinalsValues) => Promise<void> | void;
}) {
  const [careerWorldFinalsWins, setCareerWorldFinalsWins] = useState(
    Number(initial.careerWorldFinalsWins ?? 0),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-300/40 focus:bg-cyan-300/[0.06]";

  function validate() {
    const wins = Number(careerWorldFinalsWins);

    if (!Number.isFinite(wins)) {
      return "World Finals wins must be a valid number.";
    }

    if (wins < 0) {
      return "World Finals wins cannot be negative.";
    }

    if (!Number.isInteger(wins)) {
      return "World Finals wins must be a whole number.";
    }

    if (wins > 99) {
      return "World Finals wins cannot be higher than 99.";
    }

    return null;
  }

  async function handleSave() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSave({
        careerWorldFinalsWins: Number(careerWorldFinalsWins),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-0 backdrop-blur-sm sm:px-4"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full flex-col overflow-hidden border border-cyan-300/10 bg-[#07111F] shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
              <Trophy className="h-3.5 w-3.5" />
              World Finals
            </div>

            <h2 className="mt-3 text-lg font-semibold text-white">
              Edit World Finals Wins
            </h2>

            <p className="mt-1 text-xs leading-5 text-white/45">
              Set your career World Finals title count.
            </p>
          </div>

          <button
            aria-label="Close"
            className="ml-4 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/15"
            onClick={onClose}
            disabled={saving}
            type="button"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="rounded-[22px] border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
            <div className="flex gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" />

              <div>
                <div className="text-sm font-semibold text-cyan-100">
                  This appears publicly on your racer profile.
                </div>
                <p className="mt-1 text-xs leading-5 text-cyan-100/60">
                  Example: if you have won 6 World Finals titles, enter 6. Going
                  forward, finalized World Final events can add to this count
                  automatically.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[18px] border border-red-300/20 bg-red-500/10 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-200" />
                <div className="text-sm leading-6 text-red-100">{error}</div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
            <Field
              label="Career World Finals Wins"
              helper="This is the total number of World Finals titles won."
            >
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                step={1}
                value={careerWorldFinalsWins}
                onChange={(e) =>
                  setCareerWorldFinalsWins(Number(e.target.value))
                }
                className={inputClass}
                placeholder="0"
              />
            </Field>

            <div className="mt-4 rounded-[18px] border border-cyan-300/10 bg-black/20 p-4">
              <div className="text-4xl font-black text-white">
                {Number.isFinite(Number(careerWorldFinalsWins))
                  ? Number(careerWorldFinalsWins)
                  : 0}
              </div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                Career WF Wins
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-2 border-t border-white/10 bg-[#07111F] px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="rounded-full px-5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-cyan-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-[#06111d] hover:bg-cyan-200"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Wins"}
          </Button>
        </div>
      </div>
    </div>
  );
}
