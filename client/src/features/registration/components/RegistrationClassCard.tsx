import { Check, ChevronRight, Flag, Users } from "lucide-react";

import type { RegistrationEventClass } from "../types/registration.types";

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

export default function RegistrationClassCard({
  eventClass,
  selected = false,
  interactive = false,
  onSelect,
}: RegistrationClassCardProps) {
  const full =
    typeof eventClass.capacity === "number" &&
    eventClass.confirmedRacerCount >= eventClass.capacity;

  const disabled =
    !eventClass.isRegistrationOpen || (full && !eventClass.allowWaitlist);

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
          ? "border-cl-accent/[0.35] bg-cl-accent/10 shadow-cl-panel"
          : "border-cl-border bg-cl-subtle"
      } ${
        interactive && !disabled
          ? "cursor-pointer hover:border-cl-accent/25 hover:bg-cl-accent/[0.06]"
          : ""
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cl-accent/[0.06] blur-3xl" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${
                selected
                  ? "border-cl-accent/25 bg-cl-accent/[0.15] text-cl-accent"
                  : "border-cl-border bg-cl-subtle text-cl-muted"
              }`}
            >
              {selected ? (
                <Check className="h-5 w-5" />
              ) : (
                <Flag className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="break-words text-base font-black uppercase leading-tight text-cl-ink sm:text-lg">
                {eventClass.name}
              </h3>

              {eventClass.code ? (
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-cl-accent">
                  {eventClass.code}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-lg font-black text-cl-ink">
              {formatCurrency(eventClass.basePriceCents / 100)}
            </div>

            <div className="text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted">
              Entry
            </div>
          </div>
        </div>

        {eventClass.description ? (
          <p className="mt-4 text-sm leading-6 text-cl-muted">
            {eventClass.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cl-border bg-cl-surface px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted">
            <Users className="h-3 w-3 text-cl-accent" />
            {eventClass.confirmedRacerCount} entered
          </span>

          {full && eventClass.allowWaitlist ? (
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cl-warning">
              Waitlist Available
            </span>
          ) : full ? (
            <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cl-danger">
              Class Full
            </span>
          ) : !eventClass.isRegistrationOpen ? (
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-cl-warning">
              Not Open
            </span>
          ) : null}
        </div>

        {interactive && !disabled ? (
          <div className="mt-4 flex items-center justify-end border-t border-cl-border pt-4 text-[10px] font-black uppercase tracking-[0.13em] text-cl-accent">
            {selected ? "Selected" : "Select Class"}
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </div>
        ) : null}
      </div>
    </button>
  );
}
