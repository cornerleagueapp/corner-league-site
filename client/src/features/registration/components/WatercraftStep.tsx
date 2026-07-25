import { Hash, Info, ShipWheel, Wrench } from "lucide-react";
import type { RegistrationWatercraft } from "../types/registration.types";

type WatercraftStepProps = {
  watercraft: RegistrationWatercraft;
  onChange: (watercraft: Partial<RegistrationWatercraft>) => void;
};

const inputClassName =
  "h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-cyan-300/30 focus:bg-cyan-300/[0.05] focus:ring-2 focus:ring-cyan-300/10";

const labelClassName =
  "mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-white/50";

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
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
          Step 4 of 6
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">
          Watercraft information
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          Add the race number and watercraft being used for the selected
          entries.
        </p>
      </div>

      <div className="rounded-[20px] border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />

          <p className="text-xs leading-6 text-white/50">
            The first demo supports one primary watercraft for all selected
            classes. Per-class and backup-watercraft assignment can be added
            when the production registration rules are finalized.
          </p>
        </div>
      </div>

      <div className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-4 sm:p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
            <ShipWheel className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-sm font-black uppercase text-white">
              Primary race watercraft
            </h3>

            <p className="mt-1 text-xs text-white/40">
              Used for the selected race classes.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClassName}>Boat number *</span>

            <div className="relative">
              <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

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

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
          <input
            type="checkbox"
            checked={watercraft.useForAllClasses}
            onChange={(event) =>
              onChange({
                useForAllClasses: event.target.checked,
              })
            }
            className="mt-1 h-4 w-4 rounded border-white/20 bg-black accent-cyan-300"
          />

          <span>
            <span className="block text-sm font-bold text-white">
              Use this watercraft for all selected classes
            </span>

            <span className="mt-1 block text-xs leading-5 text-white/40">
              This option is required for the current demo registration
              workflow.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4">
        <div className="flex items-start gap-3">
          <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB199]" />

          <p className="text-xs leading-6 text-white/45">
            Organizers will be able to update a racer’s watercraft or move the
            entry into another class if a boat changes or breaks before the
            race.
          </p>
        </div>
      </div>
    </div>
  );
}
