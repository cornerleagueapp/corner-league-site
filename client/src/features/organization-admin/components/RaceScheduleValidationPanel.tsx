import { AlertTriangle, CheckCircle2, ShieldAlert, Users } from "lucide-react";

import type { RaceScheduleValidationResult } from "../types/organizationRaceSchedule";

type Props = {
  validation: RaceScheduleValidationResult | null;
};

export function RaceScheduleValidationPanel({ validation }: Props) {
  if (!validation) {
    return null;
  }

  const structuralWarnings = [
    ...validation.duplicateClassRoundWarnings,
    ...validation.missingClassRoundWarnings,
    ...validation.emptyRaceSlotWarnings,
  ];

  const highRestWarnings = validation.raceWarnings.filter(
    (warning) => warning.severity === "high",
  );

  return (
    <section
      className={`rounded-[26px] border p-5 ${
        validation.valid
          ? "border-emerald-300/15 bg-emerald-300/[0.04]"
          : "border-amber-300/15 bg-amber-300/[0.04]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            validation.valid ? "bg-emerald-300/10" : "bg-amber-300/10"
          }`}
        >
          {validation.valid ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-200" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-200" />
          )}
        </div>

        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
            Safety Validation
          </div>

          <h3 className="mt-1 text-lg font-black text-white">
            {validation.valid
              ? "Race order looks good"
              : "Race order needs review"}
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Minimum racer rest gap:{" "}
            <strong className="text-white">
              {validation.minimumRestRaceGap}
            </strong>{" "}
            physical race
            {validation.minimumRestRaceGap === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
          <div className="text-2xl font-black text-white">
            {validation.raceWarnings.length}
          </div>

          <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            Rest Warnings
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
          <div className="text-2xl font-black text-white">
            {highRestWarnings.length}
          </div>

          <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            High Severity
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
          <div className="text-2xl font-black text-white">
            {structuralWarnings.length}
          </div>

          <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            Structural Errors
          </div>
        </div>
      </div>

      {validation.raceWarnings.length ? (
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-amber-200">
            <Users className="h-4 w-4" />
            Racer Rest Conflicts
          </div>

          {validation.raceWarnings.map((warning, index) => (
            <div
              key={`${warning.type ?? "warning"}-${index}`}
              className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.035] p-3"
            >
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />

                <div>
                  {warning.racerName ? (
                    <div className="text-xs font-black text-white">
                      {warning.racerName}
                    </div>
                  ) : null}

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {warning.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {structuralWarnings.length ? (
        <div className="mt-5 space-y-2">
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-red-200">
            Structural Problems
          </div>

          {structuralWarnings.map((warning, index) => (
            <div
              key={`structural-${index}`}
              className="rounded-2xl border border-red-300/10 bg-red-300/[0.035] p-3 text-xs leading-5 text-red-100/75"
            >
              {warning.reason}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
