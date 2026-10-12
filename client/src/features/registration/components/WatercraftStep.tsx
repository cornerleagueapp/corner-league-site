import { Hash, Info, ShipWheel, Wrench } from "lucide-react";
import type { RegistrationWatercraft } from "../types/registration.types";

type WatercraftStepProps = {
  watercraft: RegistrationWatercraft;
  onChange: (watercraft: Partial<RegistrationWatercraft>) => void;
};

const inputClassName =
  "h-12 w-full rounded-[16px] border border-cl-border bg-cl-subtle px-4 text-sm text-cl-ink outline-none placeholder:text-cl-muted transition focus:border-cl-accent/30 focus:bg-cl-accent/[0.05] focus:ring-2 focus:ring-cl-accent/10";

const labelClassName =
  "mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-cl-muted";

export function isWatercraftInformationComplete(
  watercraft: RegistrationWatercraft,
) {
  return (
    watercraft.boatNumber.trim().length > 0 &&
    watercraft.make.trim().length > 0 &&
    watercraft.model.trim().length > 0
  );
}

export default function WatercraftStep({
  watercraft,
  onChange,
}: WatercraftStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cl-accent">
          Step 4 of 6
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink sm:text-3xl">
          Watercraft information
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-cl-muted">
          Add the race number and watercraft being used for the selected
          entries.
        </p>
      </div>

      <div className="rounded-[20px] border border-cl-accent/[0.12] bg-cl-accent/[0.045] p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

          <p className="text-xs leading-6 text-cl-muted">
            The first demo supports one primary watercraft for all selected
            classes. Per-class and backup-watercraft assignment can be added
            when the production registration rules are finalized.
          </p>
        </div>
      </div>

      <div className="rounded-[26px] border border-cl-accent/10 bg-cl-surface p-4 sm:p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent">
            <ShipWheel className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-sm font-black uppercase text-cl-ink">
              Primary race watercraft
            </h3>

            <p className="mt-1 text-xs text-cl-muted">
              Used for the selected race classes.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClassName}>Boat number *</span>

            <div className="relative">
              <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cl-muted" />

              <input
                value={watercraft.boatNumber}
                onChange={(event) =>
                  onChange({
                    boatNumber: event.target.value,
                  })
                }
                inputMode="text"
                className={`${inputClassName} pl-11`}
                placeholder="217"
              />
            </div>
          </label>

          <label>
            <span className={labelClassName}>Model year</span>

            <input
              value={watercraft.year || ""}
              onChange={(event) =>
                onChange({
                  year: event.target.value.replace(/\D/g, "").slice(0, 4),
                })
              }
              inputMode="numeric"
              className={inputClassName}
              placeholder="2026"
            />
          </label>

          <label>
            <span className={labelClassName}>Manufacturer *</span>

            <input
              value={watercraft.make}
              onChange={(event) =>
                onChange({
                  make: event.target.value,
                })
              }
              className={inputClassName}
              placeholder="Yamaha, Kawasaki, Sea-Doo..."
            />
          </label>

          <label>
            <span className={labelClassName}>Model *</span>

            <input
              value={watercraft.model}
              onChange={(event) =>
                onChange({
                  model: event.target.value,
                })
              }
              className={inputClassName}
              placeholder="SuperJet, SX-R, RXP-X..."
            />
          </label>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[20px] border border-cl-border bg-cl-subtle p-4">
          <input
            type="checkbox"
            checked={watercraft.useForAllClasses}
            onChange={(event) =>
              onChange({
                useForAllClasses: event.target.checked,
              })
            }
            className="mt-1 h-4 w-4 rounded border-cl-border bg-cl-canvas accent-cl-accent"
          />

          <span>
            <span className="block text-sm font-bold text-cl-ink">
              Use this watercraft for all selected classes
            </span>

            <span className="mt-1 block text-xs leading-5 text-cl-muted">
              This option is required for the current demo registration
              workflow.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-[20px] border border-cl-border bg-cl-subtle p-4">
        <div className="flex items-start gap-3">
          <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

          <p className="text-xs leading-6 text-cl-muted">
            Organizers will be able to update a racer’s watercraft or move the
            entry into another class if a boat changes or breaks before the
            race.
          </p>
        </div>
      </div>
    </div>
  );
}
