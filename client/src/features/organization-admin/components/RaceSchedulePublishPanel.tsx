import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Globe2,
  Loader2,
  LockKeyhole,
  Radio,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import type {
  RaceSchedule,
  RaceScheduleValidationResult,
} from "../types/organizationRaceSchedule";

import {
  usePublishRaceSchedule,
  useUnpublishRaceSchedule,
  useValidateRaceScheduleDetailed,
} from "../hooks/useOrganizationRaceSchedule";

type Props = {
  dayId: string;

  schedule: RaceSchedule;

  onChanged?: () => void;
};

function formatPublishedAt(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RaceSchedulePublishPanel({
  dayId,
  schedule,
  onChanged,
}: Props) {
  const [validation, setValidation] =
    useState<RaceScheduleValidationResult | null>(null);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const validateMutation = useValidateRaceScheduleDetailed();

  const publishMutation = usePublishRaceSchedule(dayId);

  const unpublishMutation = useUnpublishRaceSchedule(dayId);

  const status = String(schedule.status).toLowerCase();

  const isDraft = status === "draft";

  const isPublished = status === "published";

  const isCompleted = status === "completed";

  const runValidation = async () => {
    const result = await validateMutation.mutateAsync(schedule.id);

    setValidation(result);

    return result;
  };

  const preparePublish = async () => {
    const result = await runValidation();

    if (!result.structurallyValid) {
      return;
    }

    setShowConfirmation(true);
  };

  const confirmPublish = async () => {
    await publishMutation.mutateAsync(schedule.id);

    setShowConfirmation(false);

    setValidation(null);

    onChanged?.();
  };

  const unpublish = async () => {
    await unpublishMutation.mutateAsync(schedule.id);

    setValidation(null);

    onChanged?.();
  };

  const structuralErrors = validation
    ? validation.duplicateClassRoundWarnings.length +
      validation.missingClassRoundWarnings.length +
      validation.emptyRaceSlotWarnings.length
    : 0;

  const highConflicts =
    validation?.raceWarnings.filter((warning) => warning.severity === "high")
      .length ?? 0;

  const error =
    validateMutation.error || publishMutation.error || unpublishMutation.error;

  return (
    <>
      <section
        className={`rounded-[28px] border p-5 sm:p-6 ${
          isPublished
            ? "border-emerald-300/20 bg-emerald-300/[0.045]"
            : "border-white/10 bg-white/[0.025]"
        }`}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isPublished ? "bg-emerald-300/10" : "bg-cyan-300/10"
              }`}
            >
              {isPublished ? (
                <Radio className="h-5 w-5 text-emerald-200" />
              ) : (
                <Globe2 className="h-5 w-5 text-cyan-200" />
              )}
            </div>

            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                Public Race Order
              </div>

              <h3 className="mt-1 text-xl font-black text-white">
                {isPublished
                  ? "Race Order Is Live"
                  : isCompleted
                    ? "Schedule Completed"
                    : "Publish Race Order"}
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {isPublished
                  ? "Racers and spectators can now see this published race order."
                  : "Validate the final race order before making it visible to racers and spectators."}
              </p>

              {isPublished && schedule.publishedAt ? (
                <div className="mt-3 text-xs font-bold text-emerald-200/70">
                  Published {formatPublishedAt(schedule.publishedAt)}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isDraft ? (
              <>
                <button
                  type="button"
                  disabled={validateMutation.isPending}
                  onClick={runValidation}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-40"
                >
                  {validateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Final Validation
                </button>

                <button
                  type="button"
                  disabled={
                    validateMutation.isPending ||
                    publishMutation.isPending ||
                    !schedule.slots?.length
                  }
                  onClick={preparePublish}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-300 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#04101C] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Radio className="h-4 w-4" />
                  )}
                  Publish Live
                </button>
              </>
            ) : null}

            {isPublished ? (
              <>
                <div className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200">
                  <Eye className="h-4 w-4" />
                  Public
                </div>

                <button
                  type="button"
                  disabled={unpublishMutation.isPending}
                  onClick={unpublish}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-4 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-300/10 disabled:opacity-40"
                >
                  {unpublishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Return To Draft
                </button>
              </>
            ) : null}
          </div>
        </div>

        {validation ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div
              className={`rounded-2xl border p-4 ${
                validation.structurallyValid
                  ? "border-emerald-300/10 bg-emerald-300/[0.035]"
                  : "border-red-300/15 bg-red-300/[0.04]"
              }`}
            >
              <div className="text-2xl font-black text-white">
                {structuralErrors}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                Structural Errors
              </div>
            </div>

            <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.035] p-4">
              <div className="text-2xl font-black text-white">
                {validation.raceWarnings.length}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                Rest Warnings
              </div>
            </div>

            <div className="rounded-2xl border border-red-300/10 bg-red-300/[0.035] p-4">
              <div className="text-2xl font-black text-white">
                {highConflicts}
              </div>

              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                High Severity
              </div>
            </div>
          </div>
        ) : null}

        {validation && !validation.structurallyValid ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-300/15 bg-red-300/[0.05] p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />

            <p className="text-xs leading-5 text-red-100/75">
              This schedule contains structural race-order errors. Fix the
              duplicate rounds, missing rounds, or empty races before
              publishing.
            </p>
          </div>
        ) : null}

        {validation &&
        validation.structurallyValid &&
        validation.raceWarnings.length > 0 ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />

            <div>
              <div className="text-xs font-black text-amber-100">
                Racer-rest warnings remain
              </div>

              <p className="mt-1 text-xs leading-5 text-amber-100/65">
                The backend will make the final decision about whether these
                warnings may be overridden based on the event scheduling
                settings.
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-300/15 bg-red-300/[0.05] p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />

            <p className="text-xs leading-5 text-red-100/75">
              {(error as any)?.message ??
                "Unable to update the published race order."}
            </p>
          </div>
        ) : null}

        {isPublished ? (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-300/10 bg-black/15 p-4">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />

            <p className="text-xs leading-5 text-slate-400">
              The published race order is protected from manual edits. Return it
              to draft before changing race positions, merging classes, or
              regenerating the schedule.
            </p>
          </div>
        ) : null}
      </section>

      {showConfirmation ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#07111F] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.6)] sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10">
              <Radio className="h-5 w-5 text-emerald-200" />
            </div>

            <div className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">
              Publish Live
            </div>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">
              Make this race order public?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Racers, teams, families, and spectators will see this as the
              official current race order.
            </p>

            {validation && validation.raceWarnings.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />

                  <p className="text-xs leading-5 text-amber-100/70">
                    There are{" "}
                    <strong className="text-amber-100">
                      {validation.raceWarnings.length}
                    </strong>{" "}
                    racer-rest warning
                    {validation.raceWarnings.length === 1 ? "" : "s"} remaining.
                    Publishing may still be blocked by the backend if
                    high-severity conflict overrides are disabled.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />

                <span className="text-xs font-bold text-emerald-100">
                  Structural validation passed.
                </span>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={publishMutation.isPending}
                onClick={() => setShowConfirmation(false)}
                className="h-11 rounded-full border border-white/10 bg-white/[0.04] px-5 text-xs font-black uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={publishMutation.isPending}
                onClick={confirmPublish}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-300 px-6 text-xs font-black uppercase tracking-[0.12em] text-[#04101C] transition hover:bg-emerald-200 disabled:opacity-50"
              >
                {publishMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Radio className="h-4 w-4" />
                )}
                Publish Race Order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
