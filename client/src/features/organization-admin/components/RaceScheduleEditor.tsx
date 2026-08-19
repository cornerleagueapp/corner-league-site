import { useMemo, useState } from "react";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock3,
  Combine,
  Flag,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  Scissors,
  ShieldCheck,
} from "lucide-react";

import type {
  RaceSchedule,
  RaceScheduleSlot,
  RaceScheduleValidationResult,
} from "../types/organizationRaceSchedule";

import {
  useAddRaceScheduleBreak,
  useMergeRaceScheduleSlots,
  useMoveRaceScheduleSlot,
  useSetRaceScheduleSlotLock,
  useSplitRaceScheduleSlot,
  useValidateRaceScheduleDetailed,
} from "../hooks/useOrganizationRaceSchedule";

import { RaceScheduleValidationPanel } from "./RaceScheduleValidationPanel";

type Props = {
  dayId: string;

  schedule: RaceSchedule;

  onChanged?: () => void;
};

function getClassName(slotClass: RaceScheduleSlot["classes"][number]) {
  return (
    slotClass.eventClass.displayName?.trim() ||
    slotClass.eventClass.division?.name?.trim() ||
    "Unnamed Class"
  );
}

function getRoundLabel(slot: RaceScheduleSlot) {
  const rounds = Array.from(
    new Set(slot.classes.map((slotClass) => slotClass.roundNumber)),
  );

  if (!rounds.length) {
    return null;
  }

  if (rounds.length === 1) {
    return `Round ${rounds[0]}`;
  }

  return `Rounds ${rounds.join(", ")}`;
}

function BusyIcon() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

export function RaceScheduleEditor({ dayId, schedule, onChanged }: Props) {
  const moveMutation = useMoveRaceScheduleSlot(dayId);

  const lockMutation = useSetRaceScheduleSlotLock(dayId);

  const mergeMutation = useMergeRaceScheduleSlots(dayId);

  const splitMutation = useSplitRaceScheduleSlot(dayId);

  const breakMutation = useAddRaceScheduleBreak(dayId);

  const validationMutation = useValidateRaceScheduleDetailed();

  const [validation, setValidation] =
    useState<RaceScheduleValidationResult | null>(null);

  const [breakLabel, setBreakLabel] = useState("Break");

  const [breakDuration, setBreakDuration] = useState(15);

  const slots = useMemo(
    () =>
      [...(schedule.slots ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
    [schedule.slots],
  );

  const isDraft = String(schedule.status).toLowerCase() === "draft";

  const refreshValidation = async () => {
    const result = await validationMutation.mutateAsync(schedule.id);

    setValidation(result);
  };

  const afterChange = async () => {
    setValidation(null);

    onChanged?.();
  };

  const move = async (slot: RaceScheduleSlot, direction: -1 | 1) => {
    const currentIndex = slots.findIndex((item) => item.id === slot.id);

    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= slots.length) {
      return;
    }

    await moveMutation.mutateAsync({
      slotId: slot.id,

      displayOrder: nextIndex,
    });

    await afterChange();
  };

  const mergeWithNext = async (target: RaceScheduleSlot) => {
    const index = slots.findIndex((item) => item.id === target.id);

    const source = slots
      .slice(index + 1)
      .find((item) => item.slotType === "race");

    if (!source) {
      return;
    }

    await mergeMutation.mutateAsync({
      targetSlotId: target.id,

      sourceSlotId: source.id,
    });

    await afterChange();
  };

  const splitClass = async (slot: RaceScheduleSlot, slotClassId: string) => {
    await splitMutation.mutateAsync({
      slotId: slot.id,

      slotClassId,
    });

    await afterChange();
  };

  const addBreak = async () => {
    const label = breakLabel.trim();

    if (!label) {
      return;
    }

    await breakMutation.mutateAsync({
      scheduleId: schedule.id,

      displayOrder: slots.length,

      label,

      durationMinutes: Math.max(1, breakDuration),
    });

    setBreakLabel("Break");

    setBreakDuration(15);

    await afterChange();
  };

  const error =
    moveMutation.error ||
    lockMutation.error ||
    mergeMutation.error ||
    splitMutation.error ||
    breakMutation.error ||
    validationMutation.error;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
            Race Director
          </div>

          <h3 className="mt-2 text-xl font-black uppercase text-white">
            Race Order Editor
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Adjust the physical race order, lock important positions, combine
            small classes, split combined races, and validate racer rest before
            publishing.
          </p>
        </div>

        <button
          type="button"
          disabled={validationMutation.isPending || !slots.length}
          onClick={refreshValidation}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 text-xs font-black uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-40"
        >
          {validationMutation.isPending ? (
            <BusyIcon />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Validate Schedule
        </button>
      </div>

      {!isDraft ? (
        <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4 text-xs leading-5 text-amber-100/70">
          This schedule is currently <strong>{schedule.status}</strong>. Manual
          edits are available only while the schedule is in draft.
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-300/15 bg-red-300/[0.05] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />

          <div className="text-xs leading-5 text-red-100/75">
            {(error as any)?.message ?? "Unable to update the race schedule."}
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {slots.map((slot, index) => {
          const isRace = slot.slotType === "race";

          const roundLabel = getRoundLabel(slot);

          const busy =
            moveMutation.isPending ||
            lockMutation.isPending ||
            mergeMutation.isPending ||
            splitMutation.isPending;

          return (
            <div
              key={slot.id}
              className={`rounded-[22px] border p-4 transition ${
                isRace
                  ? slot.isLocked
                    ? "border-cyan-300/20 bg-cyan-300/[0.045]"
                    : "border-white/10 bg-white/[0.025]"
                  : "border-amber-300/15 bg-amber-300/[0.045]"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border ${
                      isRace
                        ? "border-white/10 bg-black/20"
                        : "border-amber-300/15 bg-amber-300/10"
                    }`}
                  >
                    {isRace ? (
                      <>
                        <span className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-600">
                          Race
                        </span>

                        <span className="text-xl font-black text-white">
                          {slot.raceNumber ?? "—"}
                        </span>
                      </>
                    ) : (
                      <Clock3 className="h-5 w-5 text-amber-200" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-white">
                        {slot.label ||
                          (isRace ? `Race ${slot.raceNumber ?? ""}` : "Break")}
                      </h4>

                      {roundLabel ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
                          {roundLabel}
                        </span>
                      ) : null}

                      {slot.isCombinedRace ? (
                        <span className="rounded-full border border-purple-300/15 bg-purple-300/[0.07] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-purple-200">
                          Combined
                        </span>
                      ) : null}

                      {slot.isLocked ? (
                        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-cyan-200">
                          Locked
                        </span>
                      ) : null}
                    </div>

                    {isRace ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {slot.classes.map((slotClass) => (
                          <span
                            key={
                              slotClass.id ??
                              `${slotClass.eventClass.id}-${slotClass.roundNumber}`
                            }
                            className="rounded-xl border border-white/[0.07] bg-black/15 px-2.5 py-1.5 text-xs font-bold text-slate-300"
                          >
                            {getClassName(slotClass)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-500">
                        {slot.durationMinutes ?? 0} minutes
                      </div>
                    )}
                  </div>
                </div>

                {isDraft ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      title="Move up"
                      disabled={busy || index === 0}
                      onClick={() => move(slot, -1)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-25"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      title="Move down"
                      disabled={busy || index === slots.length - 1}
                      onClick={() => move(slot, 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-25"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>

                    {isRace ? (
                      <>
                        <button
                          type="button"
                          title={slot.isLocked ? "Unlock race" : "Lock race"}
                          disabled={busy}
                          onClick={async () => {
                            await lockMutation.mutateAsync({
                              slotId: slot.id,

                              isLocked: !slot.isLocked,
                            });

                            await afterChange();
                          }}
                          className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[9px] font-black uppercase tracking-[0.1em] text-slate-300 transition hover:bg-white/[0.08]"
                        >
                          {slot.isLocked ? (
                            <LockOpen className="h-3.5 w-3.5" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}

                          {slot.isLocked ? "Unlock" : "Lock"}
                        </button>

                        <button
                          type="button"
                          disabled={busy || !!slot.isLocked}
                          onClick={() => mergeWithNext(slot)}
                          className="flex h-9 items-center gap-2 rounded-xl border border-purple-300/15 bg-purple-300/[0.055] px-3 text-[9px] font-black uppercase tracking-[0.1em] text-purple-200 transition hover:bg-purple-300/10 disabled:opacity-30"
                        >
                          <Combine className="h-3.5 w-3.5" />
                          Merge Next
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {isDraft && isRace && slot.classes.length > 1 ? (
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                    <Scissors className="h-3.5 w-3.5" />
                    Split Class From Race
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {slot.classes.map((slotClass) => (
                      <button
                        key={slotClass.id}
                        type="button"
                        disabled={busy || !slotClass.id}
                        onClick={() => {
                          if (slotClass.id) {
                            splitClass(slot, slotClass.id);
                          }
                        }}
                        className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-red-300/20 hover:bg-red-300/[0.05] hover:text-red-100"
                      >
                        Split {getClassName(slotClass)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {isDraft ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-cyan-200" />

            <h4 className="text-sm font-black text-white">Add Manual Break</h4>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
            <input
              value={breakLabel}
              onChange={(event) => setBreakLabel(event.target.value)}
              placeholder="Break name"
              className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/30"
            />

            <input
              type="number"
              min={1}
              value={breakDuration}
              onChange={(event) => setBreakDuration(Number(event.target.value))}
              className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-cyan-300/30"
            />

            <button
              type="button"
              disabled={breakMutation.isPending || !breakLabel.trim()}
              onClick={addBreak}
              className="h-11 rounded-xl bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#04101C] transition hover:bg-cyan-200 disabled:opacity-40"
            >
              {breakMutation.isPending ? "Adding..." : "Add Break"}
            </button>
          </div>

          <p className="mt-2 text-[10px] text-slate-600">
            This adds the break to the end of the current order. Use the move
            controls afterward to place it exactly where you want it.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <RaceScheduleValidationPanel validation={validation} />
      </div>
    </section>
  );
}
