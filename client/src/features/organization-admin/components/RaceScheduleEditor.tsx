import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Combine,
  GripVertical,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  Scissors,
  ShieldCheck,
  Users,
  Save,
  X,
} from "lucide-react";
import type {
  RaceSchedule,
  RaceScheduleClassConfig,
  RaceScheduleSlot,
  RaceScheduleValidationResult,
} from "../types/organizationRaceSchedule";
import {
  useAddRaceScheduleBreak,
  useMergeRaceScheduleSlots,
  useSaveRaceScheduleOrder,
  useSetRaceScheduleSlotLock,
  useSplitRaceScheduleSlot,
  useValidateRaceScheduleDetailed,
} from "../hooks/useOrganizationRaceSchedule";
import { RaceScheduleValidationPanel } from "./RaceScheduleValidationPanel";

const SCHEDULE_BLOCK_PRESETS = [
  "Practice A",
  "Practice B",
  "Pro/Am Practice",
  "Junior Practice",
  "Riders Meeting",
  "Lunch",
  "Awards",
];

type Props = {
  dayId: string;

  schedule: RaceSchedule;

  classConfigs?: RaceScheduleClassConfig[];

  minimumRestRaceGap?: number;

  onChanged?: () => void;
};

type Participant = {
  racerId?: string;
  id?: string;
  racerName?: string;
  name?: string;
};

type SlotConflict = {
  severity: "clear" | "warning" | "critical";

  racers: string[];

  message: string;
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

function participantId(participant: Participant) {
  return String(participant.racerId ?? participant.id ?? "");
}

function participantName(participant: Participant) {
  return (
    participant.racerName?.trim() || participant.name?.trim() || "Unknown Racer"
  );
}

export function RaceScheduleEditor({
  dayId,
  schedule,
  classConfigs = [],
  minimumRestRaceGap = 2,
  onChanged,
}: Props) {
  const saveOrderMutation = useSaveRaceScheduleOrder(dayId);
  const lockMutation = useSetRaceScheduleSlotLock(dayId);

  const mergeMutation = useMergeRaceScheduleSlots(dayId);

  const splitMutation = useSplitRaceScheduleSlot(dayId);

  const breakMutation = useAddRaceScheduleBreak(dayId);

  const validationMutation = useValidateRaceScheduleDetailed();

  const [validation, setValidation] =
    useState<RaceScheduleValidationResult | null>(null);

  const [breakLabel, setBreakLabel] = useState("Break");

  const [breakDuration, setBreakDuration] = useState(15);

  const [expandedRacerSlots, setExpandedRacerSlots] = useState<Set<string>>(
    new Set(),
  );

  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);

  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  const sortedServerSlots = useMemo(
    () =>
      [...(schedule.slots ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
    [schedule.slots],
  );

  const [slots, setSlots] = useState<RaceScheduleSlot[]>(sortedServerSlots);

  const [orderDirty, setOrderDirty] = useState(false);

  useEffect(() => {
    if (orderDirty) {
      return;
    }

    setSlots(sortedServerSlots);
  }, [sortedServerSlots, orderDirty]);

  const saveOrder = async () => {
    if (!orderDirty) {
      return;
    }

    await saveOrderMutation.mutateAsync({
      scheduleId: schedule.id,

      input: {
        slots: slots.map((slot, index) => ({
          slotId: slot.id,
          displayOrder: index,
        })),
      },
    });

    setOrderDirty(false);

    onChanged?.();
  };

  const localRaceNumberBySlotId = useMemo(() => {
    const numbers = new Map<string, number>();

    let raceNumber = 1;

    for (const slot of slots) {
      if (slot.slotType !== "race") {
        continue;
      }

      numbers.set(slot.id, raceNumber);

      raceNumber += 1;
    }

    return numbers;
  }, [slots]);

  const raceSlots = useMemo(
    () => slots.filter((slot) => slot.slotType === "race"),
    [slots],
  );

  const classConfigByEventClassId = useMemo(() => {
    const map = new Map<string, RaceScheduleClassConfig>();

    for (const config of classConfigs) {
      if (config.eventClass?.id) {
        map.set(config.eventClass.id, config);
      }
    }

    return map;
  }, [classConfigs]);

  const isDraft = String(schedule.status).toLowerCase() === "draft";

  const participantsForSlot = (slot: RaceScheduleSlot): Participant[] => {
    const racers = new Map<string, Participant>();

    for (const slotClass of slot.classes ?? []) {
      const config = classConfigByEventClassId.get(slotClass.eventClass.id);

      const participants = (config?.participants ?? []) as Participant[];

      for (const participant of participants) {
        const id = participantId(participant);

        if (!id) {
          continue;
        }

        racers.set(id, participant);
      }
    }

    return [...racers.values()];
  };

  const sharedParticipants = (
    first: RaceScheduleSlot,
    second: RaceScheduleSlot,
  ) => {
    const firstParticipants = participantsForSlot(first);

    const secondParticipants = participantsForSlot(second);

    const firstIds = new Set(
      firstParticipants.map(participantId).filter(Boolean),
    );

    return secondParticipants.filter((participant) =>
      firstIds.has(participantId(participant)),
    );
  };

  const conflictForSlot = (slot: RaceScheduleSlot): SlotConflict => {
    if (slot.slotType !== "race") {
      return {
        severity: "clear",
        racers: [],
        message: "",
      };
    }

    const currentRaceIndex = raceSlots.findIndex((item) => item.id === slot.id);

    if (currentRaceIndex <= 0) {
      return {
        severity: "clear",
        racers: [],
        message: "No racer rest conflicts.",
      };
    }

    const currentParticipants = participantsForSlot(slot);

    const currentIds = new Map(
      currentParticipants.map((participant) => [
        participantId(participant),
        participantName(participant),
      ]),
    );

    const criticalNames = new Set<string>();
    const warningNames = new Set<string>();

    for (
      let previousIndex = currentRaceIndex - 1;
      previousIndex >= 0;
      previousIndex -= 1
    ) {
      const gap = currentRaceIndex - previousIndex - 1;

      if (gap >= minimumRestRaceGap) {
        break;
      }

      const previous = raceSlots[previousIndex];

      const previousParticipants = participantsForSlot(previous);

      for (const participant of previousParticipants) {
        const id = participantId(participant);

        if (!id || !currentIds.has(id)) {
          continue;
        }

        const name = currentIds.get(id) ?? participantName(participant);

        if (gap === 0) {
          criticalNames.add(name);
        } else {
          warningNames.add(name);
        }
      }
    }

    if (criticalNames.size > 0) {
      return {
        severity: "critical",
        racers: [...criticalNames],
        message:
          criticalNames.size === 1
            ? "1 racer has back-to-back races."
            : `${criticalNames.size} racers have back-to-back races.`,
      };
    }

    if (warningNames.size > 0) {
      return {
        severity: "warning",
        racers: [...warningNames],
        message:
          warningNames.size === 1
            ? `1 racer is inside the ${minimumRestRaceGap}-race rest window.`
            : `${warningNames.size} racers are inside the ${minimumRestRaceGap}-race rest window.`,
      };
    }

    return {
      severity: "clear",
      racers: [],
      message: "No racer rest conflicts.",
    };
  };

  const refreshValidation = async () => {
    const result = await validationMutation.mutateAsync(schedule.id);

    setValidation(result);
  };

  const afterChange = async () => {
    setValidation(null);

    setMergeTargetId(null);

    onChanged?.();
  };

  const moveSlotToIndex = (slotId: string, targetIndex: number) => {
    setSlots((currentSlots) => {
      const currentIndex = currentSlots.findIndex((item) => item.id === slotId);

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= currentSlots.length ||
        currentIndex === targetIndex
      ) {
        return currentSlots;
      }

      const nextSlots = [...currentSlots];

      const [movedSlot] = nextSlots.splice(currentIndex, 1);

      nextSlots.splice(targetIndex, 0, movedSlot);

      return nextSlots.map((slot, index) => ({
        ...slot,
        displayOrder: index,
      }));
    });

    setOrderDirty(true);
    setValidation(null);
  };

  const mergeSlots = async (
    target: RaceScheduleSlot,
    source: RaceScheduleSlot,
  ) => {
    if (
      target.id === source.id ||
      target.slotType !== "race" ||
      source.slotType !== "race"
    ) {
      return;
    }

    const shared = sharedParticipants(target, source);

    /**
     * Never allow two classes containing the same
     * racer to be combined into one physical race.
     */
    if (shared.length > 0) {
      return;
    }

    await mergeMutation.mutateAsync({
      targetSlotId: target.id,
      sourceSlotId: source.id,
    });

    await afterChange();
  };

  const unmergeSlot = async (slot: RaceScheduleSlot) => {
    if (slot.classes.length <= 1) {
      return;
    }

    /**
     * Keep the first class in the current race.
     * Split every additional class back into its
     * own physical race.
     */
    const classesToSplit = slot.classes.slice(1);

    for (const slotClass of classesToSplit) {
      if (!slotClass.id) {
        continue;
      }

      await splitMutation.mutateAsync({
        slotId: slot.id,
        slotClassId: slotClass.id,
      });
    }

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

  const toggleRacers = (slotId: string) => {
    setExpandedRacerSlots((current) => {
      const next = new Set(current);

      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }

      return next;
    });
  };

  const error =
    saveOrderMutation.error ||
    lockMutation.error ||
    mergeMutation.error ||
    splitMutation.error ||
    breakMutation.error ||
    validationMutation.error;

  const busy =
    saveOrderMutation.isPending ||
    lockMutation.isPending ||
    mergeMutation.isPending ||
    splitMutation.isPending;

  return (
    <section>
      {/* ------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
            Race Director
          </div>

          <h3 className="mt-2 text-xl font-black uppercase text-white">
            Race Order Editor
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Drag races and schedule blocks into position, combine compatible
            classes, review racer-rest warnings, and check the final schedule
            before publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!orderDirty || saveOrderMutation.isPending}
            onClick={saveOrder}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-xs font-black uppercase tracking-[0.12em] transition disabled:opacity-40 ${
              orderDirty
                ? "border-cyan-300/30 bg-cyan-300 text-[#04101C] hover:bg-cyan-200"
                : "border-white/10 bg-white/[0.03] text-white/35"
            }`}
          >
            {saveOrderMutation.isPending ? (
              <BusyIcon />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saveOrderMutation.isPending ? "Saving..." : "Save Order"}
          </button>

          <button
            type="button"
            disabled={
              validationMutation.isPending || !slots.length || orderDirty
            }
            onClick={refreshValidation}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 text-xs font-black uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-40"
          >
            {validationMutation.isPending ? (
              <BusyIcon />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}

            {orderDirty ? "Save Before Checking" : "Check Schedule"}
          </button>
        </div>
      </div>

      {orderDirty ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-xs text-amber-100/70">
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          Race order has unsaved changes. Save the order before checking or
          publishing the schedule.
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 text-[10px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.05] px-3 py-2 text-emerald-200/70">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Clear
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.05] px-3 py-2 text-amber-200/70">
          <AlertTriangle className="h-3.5 w-3.5" />
          Rest warning
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-red-300/15 bg-red-300/[0.05] px-3 py-2 text-red-200/70">
          <AlertTriangle className="h-3.5 w-3.5" />
          Back-to-back conflict
        </div>
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
            {(error as any)?.body?.message ??
              (error as any)?.message ??
              "Unable to update the race schedule."}
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ */}
      {/* Sortable race/schedule list */}
      {/* ------------------------------------------------ */}

      <div className="mt-6 space-y-3">
        {slots.map((slot, index) => {
          const isRace = slot.slotType === "race";

          const roundLabel = getRoundLabel(slot);

          const participants = isRace ? participantsForSlot(slot) : [];

          const conflict = isRace ? conflictForSlot(slot) : null;

          const racersExpanded = expandedRacerSlots.has(slot.id);

          const mergeOpen = mergeTargetId === slot.id;

          const targetRounds = isRace
            ? Array.from(
                new Set(slot.classes.map((slotClass) => slotClass.roundNumber)),
              )
            : [];

          const targetRound =
            targetRounds.length === 1 ? targetRounds[0] : null;

          return (
            <div
              key={slot.id}
              draggable={isDraft && !busy && !slot.isLocked}
              onDragStart={(event) => {
                if (!isDraft || slot.isLocked) {
                  event.preventDefault();
                  return;
                }

                setDraggedSlotId(slot.id);

                event.dataTransfer.effectAllowed = "move";

                event.dataTransfer.setData("text/plain", slot.id);
              }}
              onDragEnter={(event) => {
                event.preventDefault();

                if (draggedSlotId && draggedSlotId !== slot.id) {
                  setDragOverSlotId(slot.id);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();

                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={async (event) => {
                event.preventDefault();

                const sourceId =
                  event.dataTransfer.getData("text/plain") || draggedSlotId;

                setDragOverSlotId(null);
                setDraggedSlotId(null);

                if (!sourceId) {
                  return;
                }

                moveSlotToIndex(sourceId, index);
              }}
              onDragEnd={() => {
                setDraggedSlotId(null);
                setDragOverSlotId(null);
              }}
              className={`rounded-[22px] border p-4 transition ${
                dragOverSlotId === slot.id
                  ? "border-cyan-300/50 bg-cyan-300/[0.08]"
                  : isRace
                    ? conflict?.severity === "critical"
                      ? "border-red-300/20 bg-red-300/[0.035]"
                      : conflict?.severity === "warning"
                        ? "border-amber-300/20 bg-amber-300/[0.035]"
                        : slot.isLocked
                          ? "border-cyan-300/20 bg-cyan-300/[0.045]"
                          : "border-white/10 bg-white/[0.025]"
                    : "border-amber-300/15 bg-amber-300/[0.045]"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {/* drag handle */}

                <div
                  className={`flex h-10 w-8 shrink-0 items-center justify-center rounded-xl text-white/25 ${
                    isDraft && !slot.isLocked
                      ? "cursor-grab hover:bg-white/[0.05] hover:text-white/60 active:cursor-grabbing"
                      : "cursor-not-allowed opacity-30"
                  }`}
                  title={
                    slot.isLocked
                      ? "Unlock this item before moving it"
                      : "Drag to reorder"
                  }
                >
                  <GripVertical className="h-5 w-5" />
                </div>

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
                          {isRace
                            ? (localRaceNumberBySlotId.get(slot.id) ?? "—")
                            : "—"}
                        </span>
                      </>
                    ) : (
                      <Clock3 className="h-5 w-5 text-amber-200" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-white">
                        {slot.label ||
                          (isRace
                            ? `Race ${localRaceNumberBySlotId.get(slot.id) ?? ""}`
                            : "Schedule Block")}
                      </h4>

                      {roundLabel ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
                          {roundLabel}
                        </span>
                      ) : null}

                      {slot.isCombinedRace ? (
                        <span className="rounded-full border border-purple-300/20 bg-purple-300/[0.08] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-purple-200">
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
                      <>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleRacers(slot.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-black/15 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 transition hover:text-white"
                          >
                            <Users className="h-3.5 w-3.5" />
                            {participants.length} Racer
                            {participants.length === 1 ? "" : "s"}
                            {racersExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>

                          {conflict?.severity === "critical" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-300/20 bg-red-300/[0.08] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-red-200">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {conflict.racers.length} Back-to-back
                            </span>
                          ) : conflict?.severity === "warning" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-amber-200">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {conflict.racers.length} Rest warning
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Clear
                            </span>
                          )}
                        </div>

                        {racersExpanded ? (
                          <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
                            <div className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30">
                              Racers in this race
                            </div>

                            {participants.length > 0 ? (
                              <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                                {participants.map((participant) => (
                                  <div
                                    key={participantId(participant)}
                                    className="rounded-lg bg-white/[0.035] px-3 py-2 text-xs font-semibold text-white/65"
                                  >
                                    {participantName(participant)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-2 text-xs text-white/30">
                                No racer data available for these classes.
                              </div>
                            )}
                          </div>
                        ) : null}

                        {conflict && conflict.racers.length > 0 ? (
                          <div
                            className={`mt-3 rounded-xl border p-3 ${
                              conflict.severity === "critical"
                                ? "border-red-300/15 bg-red-300/[0.045]"
                                : "border-amber-300/15 bg-amber-300/[0.045]"
                            }`}
                          >
                            <div className="text-[10px] font-bold text-white/70">
                              {conflict.message}
                            </div>

                            <div className="mt-1 text-[10px] text-white/40">
                              {conflict.racers.join(", ")}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="mt-1 text-xs text-slate-500">
                        {slot.durationMinutes ?? 0} minutes
                      </div>
                    )}
                  </div>
                </div>

                {/* actions */}

                {isDraft ? (
                  <div className="flex flex-wrap items-center gap-2">
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
                      className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[9px] font-black uppercase tracking-[0.1em] text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-40"
                    >
                      {slot.isLocked ? (
                        <LockOpen className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}

                      {slot.isLocked ? "Unlock" : "Lock"}
                    </button>

                    {isRace && slot.classes.length > 1 ? (
                      <button
                        type="button"
                        disabled={busy || !!slot.isLocked}
                        onClick={() => unmergeSlot(slot)}
                        className="flex h-9 items-center gap-2 rounded-xl border border-red-300/15 bg-red-300/[0.055] px-3 text-[9px] font-black uppercase tracking-[0.1em] text-red-200 transition hover:bg-red-300/10 disabled:opacity-30"
                      >
                        <Scissors className="h-3.5 w-3.5" />
                        Unmerge
                      </button>
                    ) : isRace ? (
                      <button
                        type="button"
                        disabled={busy || !!slot.isLocked}
                        onClick={() =>
                          setMergeTargetId(mergeOpen ? null : slot.id)
                        }
                        className="flex h-9 items-center gap-2 rounded-xl border border-purple-300/15 bg-purple-300/[0.055] px-3 text-[9px] font-black uppercase tracking-[0.1em] text-purple-200 transition hover:bg-purple-300/10 disabled:opacity-30"
                      >
                        {mergeOpen ? (
                          <X className="h-3.5 w-3.5" />
                        ) : (
                          <Combine className="h-3.5 w-3.5" />
                        )}

                        {mergeOpen ? "Cancel" : "Merge"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* -------------------------------------- */}
              {/* Merge selection */}
              {/* -------------------------------------- */}

              {isDraft && isRace && mergeOpen ? (
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <div className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-200/70">
                    Select Moto {targetRound ?? ""} Race to Merge With
                  </div>

                  <p className="mt-1 text-xs text-white/35">
                    Only races from the same moto can be combined. Classes
                    sharing the same racer cannot be combined. Additional
                    scheduling rules are still enforced by the server.
                  </p>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {raceSlots
                      .filter((candidate) => {
                        if (candidate.id === slot.id) {
                          return false;
                        }

                        if (targetRound === null) {
                          return false;
                        }

                        const candidateRounds = Array.from(
                          new Set(
                            candidate.classes.map(
                              (slotClass) => slotClass.roundNumber,
                            ),
                          ),
                        );

                        if (candidateRounds.length !== 1) {
                          return false;
                        }

                        return candidateRounds[0] === targetRound;
                      })
                      .map((candidate) => {
                        const shared = sharedParticipants(slot, candidate);

                        const invalid =
                          candidate.isLocked ||
                          shared.length > 0 ||
                          candidate.classes.length > 1;

                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            disabled={busy || invalid}
                            onClick={() => mergeSlots(slot, candidate)}
                            className={`rounded-xl border p-3 text-left transition ${
                              invalid
                                ? "cursor-not-allowed border-white/[0.05] bg-white/[0.015] opacity-45"
                                : "border-purple-300/15 bg-purple-300/[0.04] hover:border-purple-300/30 hover:bg-purple-300/[0.08]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-black text-white">
                                  Race{" "}
                                  {localRaceNumberBySlotId.get(candidate.id) ??
                                    "—"}
                                </div>

                                <div className="mt-1 text-[11px] text-white/50">
                                  {candidate.label ||
                                    candidate.classes
                                      .map(getClassName)
                                      .join(" + ")}
                                </div>
                              </div>

                              <div className="text-[9px] font-black uppercase tracking-[0.08em]">
                                {shared.length > 0 ? (
                                  <span className="text-red-200">
                                    Shared racer
                                  </span>
                                ) : candidate.isLocked ? (
                                  <span className="text-amber-200">Locked</span>
                                ) : candidate.classes.length > 1 ? (
                                  <span className="text-purple-200">
                                    Combined
                                  </span>
                                ) : (
                                  <span className="text-emerald-200">
                                    Moto {targetRound} · Available
                                  </span>
                                )}
                              </div>
                            </div>

                            {shared.length > 0 ? (
                              <div className="mt-2 text-[10px] leading-4 text-red-200/60">
                                Cannot combine:{" "}
                                {shared.map(participantName).join(", ")} is
                                entered in both races.
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------ */}
      {/* Add schedule block */}
      {/* ------------------------------------------------ */}

      {isDraft ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-cyan-200" />

            <div>
              <h4 className="text-sm font-black text-white">
                Add Schedule Block
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                Add practice, meetings, lunch, awards, or any custom block to
                the day's schedule.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SCHEDULE_BLOCK_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBreakLabel(preset)}
                className={`rounded-full border px-3 py-2 text-[9px] font-black uppercase tracking-[0.11em] transition ${
                  breakLabel === preset
                    ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-white/[0.03] text-white/45 hover:border-cyan-300/20 hover:text-white/70"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
            <input
              value={breakLabel}
              onChange={(event) => setBreakLabel(event.target.value)}
              placeholder="Practice A, Lunch, Riders Meeting..."
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
              {breakMutation.isPending ? "Adding..." : "Add Block"}
            </button>
          </div>

          <p className="mt-2 text-[10px] text-slate-600">
            Schedule blocks do not require registered racers. Add the block,
            then drag it anywhere in the day's schedule.
          </p>
        </div>
      ) : null}

      {/* ------------------------------------------------ */}
      {/* Validation */}
      {/* ------------------------------------------------ */}

      <div className="mt-6">
        <RaceScheduleValidationPanel validation={validation} />
      </div>
    </section>
  );
}
