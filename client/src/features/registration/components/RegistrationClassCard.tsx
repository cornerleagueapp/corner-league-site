import { CalendarDays, Check, ChevronRight, Flag, Users } from "lucide-react";
import type {
  RegistrationEventClass,
  RegistrationRaceDay,
} from "../types/registration.types";

type RegistrationClassCardProps = {
  eventClass: RegistrationEventClass;
  selected?: boolean;
  interactive?: boolean;
  onSelect?: (eventClass: RegistrationEventClass) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRaceDay(day: RegistrationRaceDay) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export default function RegistrationClassCard({
  eventClass,
  selected = false,
  interactive = false,
  onSelect,
}: RegistrationClassCardProps) {
  const full =
    typeof eventClass.capacity === "number" &&
    eventClass.confirmedRacerCount >= eventClass.capacity;

  const disabled = !eventClass.isOpen || full;

  return (
    <button
      type="button"
      disabled={!interactive || disabled}
      onClick={() => {
        if (interactive && !disabled) {
          onSelect?.(eventClass);
        }
      }}
      className={`group relative w-full overflow-hidden rounded-[24px] border p-4 text-left transition sm:p-5 ${
        selected
          ? "border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.08)]"
          : "border-white/10 bg-white/[0.035]"
      } ${
        interactive && !disabled
          ? "cursor-pointer hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]"
          : ""
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cyan-400/[0.06] blur-3xl" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${
                selected
                  ? "border-cyan-300/25 bg-cyan-300/15 text-cyan-200"
                  : "border-white/10 bg-white/[0.04] text-white/45"
              }`}
            >
              {selected ? (
                <Check className="h-5 w-5" />
              ) : (
                <Flag className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="break-words text-base font-black uppercase leading-tight text-white sm:text-lg">
                {eventClass.name}
              </h3>

              {eventClass.code ? (
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-cyan-200/55">
                  {eventClass.code}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-lg font-black text-white">
              {formatCurrency(eventClass.price)}
            </div>

            <div className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">
              Entry
            </div>
          </div>
        </div>

        {eventClass.description ? (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            {eventClass.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {eventClass.availableDays.map((day) => (
            <span
              key={day}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/65"
            >
              <CalendarDays className="h-3 w-3 text-cyan-200" />
              {formatRaceDay(day)}
            </span>
          ))}

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/65">
            <Users className="h-3 w-3 text-[#FFB199]" />
            {eventClass.confirmedRacerCount} entered
          </span>

          {full ? (
            <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-red-200">
              Class Full
            </span>
          ) : !eventClass.isOpen ? (
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-200">
              Not Open
            </span>
          ) : null}
        </div>

        {interactive && !disabled ? (
          <div className="mt-4 flex items-center justify-end border-t border-white/8 pt-4 text-[10px] font-black uppercase tracking-[0.13em] text-cyan-200">
            {selected ? "Selected" : "Select Class"}
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </div>
        ) : null}
      </div>
    </button>
  );
}
