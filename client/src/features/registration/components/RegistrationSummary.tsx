import {
  CalendarDays,
  CreditCard,
  Flag,
  MapPin,
  ShipWheel,
  UserRound,
} from "lucide-react";
import type {
  RegistrationDraft,
  RegistrationEvent,
  RegistrationRaceDay,
} from "../types/registration.types";

type RegistrationSummaryProps = {
  event: RegistrationEvent;
  draft: RegistrationDraft;
  compact?: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  if (sameMonth) {
    const month = start.toLocaleDateString(undefined, {
      month: "short",
    });

    return `${month} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatRaceDays(days: RegistrationRaceDay[]) {
  return days
    .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(" & ");
}

export default function RegistrationSummary({
  event,
  draft,
  compact = false,
}: RegistrationSummaryProps) {
  return (
    <aside
      className={`overflow-hidden rounded-[26px] border border-cyan-300/12 bg-[#07111F]/94 shadow-[0_24px_75px_rgba(0,0,0,0.28)] ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-start gap-3 border-b border-white/10 pb-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
          <Flag className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200/60">
            Registration Summary
          </p>

          <h2 className="mt-1 break-words text-base font-black uppercase leading-tight text-white">
            {event.name}
          </h2>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />

          <div>
            <p className="text-xs font-bold text-white">
              {formatDateRange(event.startDate, event.endDate)}
            </p>

            <p className="mt-0.5 text-[11px] text-white/40">Race dates</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB199]" />

          <div>
            <p className="text-xs font-bold leading-5 text-white">
              {event.formattedLocation}
            </p>

            <p className="mt-0.5 text-[11px] text-white/40">Location</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />

          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">
              {draft.racer?.name || "No racer selected"}
            </p>

            <p className="mt-0.5 text-[11px] text-white/40">Racer</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <ShipWheel className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB199]" />

          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">
              {draft.watercraft.make && draft.watercraft.model
                ? `${draft.watercraft.make} ${draft.watercraft.model}`
                : "No watercraft added"}
            </p>

            <p className="mt-0.5 text-[11px] text-white/40">
              {draft.watercraft.boatNumber
                ? `Boat #${draft.watercraft.boatNumber}`
                : "Watercraft"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
            Selected classes
          </p>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black text-white/55">
            {draft.selectedClasses.length}
          </span>
        </div>

        {draft.selectedClasses.length === 0 ? (
          <p className="mt-3 text-xs leading-5 text-white/35">
            No race classes selected yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {draft.selectedClasses.map((selection) => (
              <div
                key={selection.classId}
                className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3"
              >
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">
                      {selection.className}
                    </p>

                    <p className="mt-1 text-[10px] text-white/40">
                      {formatRaceDays(selection.raceDays)}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs font-black text-white">
                    {formatCurrency(selection.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
        <div className="flex justify-between gap-3 text-xs text-white/50">
          <span>Class subtotal</span>
          <span>{formatCurrency(draft.pricing.classSubtotal)}</span>
        </div>

        <div className="flex justify-between gap-3 text-xs text-white/50">
          <span>Corner League fee</span>
          <span>{formatCurrency(draft.pricing.platformFee)}</span>
        </div>

        <div className="flex justify-between gap-3 text-xs text-white/50">
          <span>Processing fee</span>
          <span>{formatCurrency(draft.pricing.processingFee)}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">
            <CreditCard className="h-4 w-4 text-cyan-200" />
            Total
          </span>

          <span className="text-xl font-black text-white">
            {formatCurrency(draft.pricing.total)}
          </span>
        </div>
      </div>
    </aside>
  );
}
