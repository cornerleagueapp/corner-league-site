import { CalendarDays, Check, Info } from "lucide-react";

import RegistrationClassCard from "./RegistrationClassCard";

import type {
  RegistrationClassSelection,
  RegistrationEvent,
  RegistrationEventClass,
} from "../types/registration.types";

type Props = {
  event: RegistrationEvent;

  selectedClasses: RegistrationClassSelection[];

  onChange: (selections: RegistrationClassSelection[]) => void;
};

function estimateClassPriceCents(
  eventClass: RegistrationEventClass,
  selectedDayCount: number,
) {
  const base = Number(eventClass.basePriceCents ?? 0);

  switch (eventClass.pricingModel) {
    case "per_day":
      return base * Math.max(1, selectedDayCount);

    default:
      return base;
  }
}

export function isClassSelectionComplete(
  selections: RegistrationClassSelection[] | null | undefined,
) {
  return (
    Array.isArray(selections) &&
    selections.length > 0 &&
    selections.every((selection) => selection.selectedEventDayIds.length > 0)
  );
}

export default function ClassSelectionStep({
  event,
  selectedClasses,
  onChange,
}: Props) {
  const enabledDays = event.eventDays
    .filter((day) => day.isRegistrationEnabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  function getSelection(classId: string) {
    return selectedClasses.find((selection) => selection.classId === classId);
  }

  function removeClass(classId: string) {
    onChange(
      selectedClasses.filter((selection) => selection.classId !== classId),
    );
  }

  function addClass(eventClass: RegistrationEventClass) {
    if (getSelection(eventClass.id)) {
      removeClass(eventClass.id);

      return;
    }

    const minimumDays = Math.max(1, eventClass.minimumSelectedDays ?? 1);

    const initialDays = enabledDays.slice(0, minimumDays);

    const selection: RegistrationClassSelection = {
      classId: eventClass.id,

      className: eventClass.name,

      selectedEventDayIds: initialDays.map((day) => day.id),

      selectedEventDays: initialDays,

      estimatedPriceCents: estimateClassPriceCents(
        eventClass,
        initialDays.length,
      ),
    };

    onChange([...selectedClasses, selection]);
  }

  function toggleDay(
    eventClass: RegistrationEventClass,

    dayId: string,
  ) {
    const existing = getSelection(eventClass.id);

    if (!existing) {
      return;
    }

    const alreadySelected = existing.selectedEventDayIds.includes(dayId);

    let nextDayIds = alreadySelected
      ? existing.selectedEventDayIds.filter((id) => id !== dayId)
      : [...existing.selectedEventDayIds, dayId];

    const minimum = eventClass.minimumSelectedDays ?? 1;

    const maximum = eventClass.maximumSelectedDays ?? null;

    if (nextDayIds.length < minimum) {
      return;
    }

    if (maximum !== null && nextDayIds.length > maximum) {
      return;
    }

    const nextDays = enabledDays.filter((day) => nextDayIds.includes(day.id));

    const nextSelection: RegistrationClassSelection = {
      ...existing,

      selectedEventDayIds: nextDayIds,

      selectedEventDays: nextDays,

      estimatedPriceCents: estimateClassPriceCents(eventClass, nextDays.length),
    };

    onChange(
      selectedClasses.map((selection) =>
        selection.classId === eventClass.id ? nextSelection : selection,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200/60">
          Step 3 of 6
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">
          Select race classes
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          Select the classes this racer will enter, then choose the event days
          they will participate in for each class.
        </p>
      </div>

      {!enabledDays.length ? (
        <div className="rounded-[22px] border border-amber-300/15 bg-amber-300/[0.055] p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />

            <p className="text-xs leading-6 text-amber-100/70">
              This event does not currently have any registration-enabled race
              days.
            </p>
          </div>
        </div>
      ) : null}

      <div className="space-y-5">
        {event.classes
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((eventClass) => {
            const selection = getSelection(eventClass.id);

            return (
              <div key={eventClass.id} className="space-y-3">
                <RegistrationClassCard
                  eventClass={eventClass}
                  selected={!!selection}
                  interactive
                  onSelect={() => addClass(eventClass)}
                />

                {selection ? (
                  <div className="rounded-[22px] border border-cyan-300/10 bg-[#07111F]/82 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-cyan-200" />

                      <div>
                        <div className="text-xs font-black uppercase text-white">
                          Select Event Days
                        </div>

                        <div className="mt-1 text-[10px] text-white/35">
                          Minimum {eventClass.minimumSelectedDays}
                          {eventClass.maximumSelectedDays
                            ? ` • Maximum ${eventClass.maximumSelectedDays}`
                            : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {enabledDays.map((day) => {
                        const selected = selection.selectedEventDayIds.includes(
                          day.id,
                        );

                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleDay(eventClass, day.id)}
                            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[9px] font-black uppercase tracking-[0.11em] transition ${
                              selected
                                ? "border-cyan-300/30 bg-cyan-300 text-[#06111d]"
                                : "border-white/10 bg-white/[0.04] text-white/55 hover:border-cyan-300/20 hover:text-white"
                            }`}
                          >
                            {selected ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : null}

                            {day.label}
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
    </div>
  );
}
