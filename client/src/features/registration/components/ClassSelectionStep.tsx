import { CalendarDays, Check, Flag, Info, Users } from "lucide-react";
import type {
  RegistrationClassSelection,
  RegistrationEvent,
  RegistrationEventClass,
  RegistrationRaceDay,
} from "../types/registration.types";

type ClassSelectionStepProps = {
  event: RegistrationEvent;
  selections: RegistrationClassSelection[];
  onChange: (selections: RegistrationClassSelection[]) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRaceDay(day: RegistrationRaceDay) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function findSelection(
  selections: RegistrationClassSelection[],
  classId: string,
) {
  return selections.find((selection) => selection.classId === classId);
}

function createDefaultDays(eventClass: RegistrationEventClass) {
  if (eventClass.availableDays.length === 1) {
    return [...eventClass.availableDays];
  }

  return [] as RegistrationRaceDay[];
}

export function isClassSelectionComplete(
  selections: RegistrationClassSelection[],
) {
  return (
    selections.length > 0 &&
    selections.every((selection) => selection.raceDays.length > 0)
  );
}

export default function ClassSelectionStep({
  event,
  selections,
  onChange,
}: ClassSelectionStepProps) {
  function toggleClass(eventClass: RegistrationEventClass) {
    const existing = findSelection(selections, eventClass.id);

    if (existing) {
      onChange(
        selections.filter((selection) => selection.classId !== eventClass.id),
      );

      return;
    }

    onChange([
      ...selections,
      {
        classId: eventClass.id,
        className: eventClass.name,
        raceDays: createDefaultDays(eventClass),
        price: eventClass.price,
      },
    ]);
  }

  function toggleRaceDay(
    eventClass: RegistrationEventClass,
    day: RegistrationRaceDay,
  ) {
    const existing = findSelection(selections, eventClass.id);

    if (!existing) {
      return;
    }

    const raceDays = existing.raceDays.includes(day)
      ? existing.raceDays.filter((existingDay) => existingDay !== day)
      : [...existing.raceDays, day];

    onChange(
      selections.map((selection) =>
        selection.classId === eventClass.id
          ? {
              ...selection,
              raceDays,
            }
          : selection,
      ),
    );
  }

  const sortedClasses = [...event.classes].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
          Step 3 of 6
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">
          Select race classes
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          Choose one or more classes. Each selected class must also have at
          least one race day selected.
        </p>
      </div>

      <div className="rounded-[20px] border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />

          <p className="text-xs leading-6 text-white/50">
            Selecting multiple classes adds each class entry fee to the
            registration total. Final eligibility checks will be handled by the
            organization when the production backend is connected.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedClasses.map((eventClass) => {
          const selected = findSelection(selections, eventClass.id);

          const isFull =
            typeof eventClass.capacity === "number" &&
            eventClass.confirmedRacerCount >= eventClass.capacity;

          const disabled = !eventClass.isOpen || isFull;

          return (
            <article
              key={eventClass.id}
              className={`overflow-hidden rounded-[24px] border transition ${
                selected
                  ? "border-cyan-300/30 bg-cyan-300/[0.075] shadow-[0_0_30px_rgba(34,211,238,0.08)]"
                  : "border-white/10 bg-[#07111F]/82"
              } ${disabled ? "opacity-60" : ""}`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleClass(eventClass)}
                className="flex w-full items-start gap-4 p-4 text-left sm:p-5"
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${
                    selected
                      ? "border-cyan-300/30 bg-cyan-300 text-[#06111d]"
                      : "border-white/10 bg-white/[0.04] text-white/35"
                  }`}
                >
                  {selected ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Flag className="h-5 w-5" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <span className="min-w-0">
                      <span className="block text-base font-black uppercase leading-tight text-white sm:text-lg">
                        {eventClass.name}
                      </span>

                      {eventClass.code ? (
                        <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200/55">
                          {eventClass.code}
                        </span>
                      ) : null}
                    </span>

                    <span className="shrink-0 text-left sm:text-right">
                      <span className="block text-lg font-black text-white">
                        {formatCurrency(eventClass.price)}
                      </span>

                      <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
                        Per entry
                      </span>
                    </span>
                  </span>

                  {eventClass.description ? (
                    <span className="mt-3 block text-sm leading-6 text-white/45">
                      {eventClass.description}
                    </span>
                  ) : null}

                  <span className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-white/55">
                      <Users className="h-3 w-3 text-[#FFB199]" />
                      {eventClass.confirmedRacerCount} entered
                    </span>

                    {typeof eventClass.capacity === "number" ? (
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-white/55">
                        Capacity {eventClass.capacity}
                      </span>
                    ) : null}

                    {isFull ? (
                      <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-red-200">
                        Full
                      </span>
                    ) : !eventClass.isOpen ? (
                      <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-amber-200">
                        Not open
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>

              {selected ? (
                <div className="border-t border-cyan-300/12 bg-black/15 p-4 sm:px-5">
                  <div className="mb-3 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-cyan-200" />

                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-white">
                      Select race days
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {eventClass.availableDays.map((day) => {
                      const daySelected = selected.raceDays.includes(day);

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleRaceDay(eventClass, day)}
                          className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase tracking-[0.13em] transition ${
                            daySelected
                              ? "border-cyan-300/30 bg-cyan-300 text-[#06111d]"
                              : "border-white/10 bg-white/[0.04] text-white/55 hover:border-cyan-300/20 hover:bg-cyan-300/10 hover:text-white"
                          }`}
                        >
                          {daySelected ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <CalendarDays className="h-4 w-4" />
                          )}

                          {formatRaceDay(day)}
                        </button>
                      );
                    })}
                  </div>

                  {selected.raceDays.length === 0 ? (
                    <p className="mt-3 text-xs font-bold text-[#FFB199]">
                      Select at least one race day for this class.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {selections.length > 0 ? (
        <div className="rounded-[22px] border border-emerald-300/15 bg-emerald-300/[0.055] p-4">
          <p className="text-sm font-black uppercase text-white">
            {selections.length} class
            {selections.length === 1 ? "" : "es"} selected
          </p>

          <p className="mt-1 text-xs leading-5 text-white/45">
            You can continue once every selected class has at least one race
            day.
          </p>
        </div>
      ) : null}
    </div>
  );
}
