import {
  CalendarDays,
  CreditCard,
  MapPin,
  ShipWheel,
  UserRound,
} from "lucide-react";

import type {
  RegistrationDraft,
  RegistrationEvent,
} from "../types/registration.types";

type RegistrationSummaryProps = {
  event: RegistrationEvent;

  draft: RegistrationDraft;

  compact?: boolean;
};

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",

    currency,

    minimumFractionDigits: 2,

    maximumFractionDigits: 2,
  }).format(Number(cents || 0) / 100);
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

export default function RegistrationSummary({
  event,
  draft,
  compact = false,
}: RegistrationSummaryProps) {
  return (
    <aside
      className={`overflow-hidden rounded-[26px] border border-cl-accent/[0.12] bg-cl-surface shadow-cl-panel ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cl-accent">
          Registration Summary
        </p>

        <h2 className="mt-1 break-words text-base font-black uppercase leading-tight text-cl-ink">
          {event.name}
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

          <div>
            <p className="text-xs font-bold text-cl-ink">
              {formatDateRange(event.startDate, event.endDate)}
            </p>

            <p className="mt-0.5 text-[11px] text-cl-muted">Race dates</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

          <div>
            <p className="text-xs font-bold leading-5 text-cl-ink">
              {event.formattedLocation || "Location to be announced"}
            </p>

            <p className="mt-0.5 text-[11px] text-cl-muted">Location</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-cl-ink">
              {draft.racer?.name || "No racer selected"}
            </p>

            <p className="mt-0.5 text-[11px] text-cl-muted">Racer</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <ShipWheel className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-cl-ink">
              {draft.watercraft.make && draft.watercraft.model
                ? `${draft.watercraft.make} ${draft.watercraft.model}`
                : "No watercraft added"}
            </p>

            <p className="mt-0.5 text-[11px] text-cl-muted">
              {draft.watercraft.boatNumber
                ? `Boat #${draft.watercraft.boatNumber}`
                : "Watercraft"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-cl-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cl-muted">
            Selected classes
          </p>

          <span className="rounded-full border border-cl-border bg-cl-subtle px-2.5 py-1 text-[9px] font-black text-cl-muted">
            {draft.selectedClasses.length}
          </span>
        </div>

        {draft.selectedClasses.length === 0 ? (
          <p className="mt-3 text-xs leading-5 text-cl-muted">
            No race classes selected yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {draft.selectedClasses.map((selection) => (
              <div
                key={selection.classId}
                className="rounded-[16px] border border-cl-border bg-cl-subtle p-3"
              >
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-cl-ink">
                      {selection.className}
                    </p>

                    <p className="mt-1 text-[10px] text-cl-muted">
                      {selection.selectedEventDays
                        .map((day) => day.label)
                        .join(" & ")}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs font-black text-cl-ink">
                    {formatCurrency(
                      selection.estimatedPriceCents,
                      event.currency,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2 border-t border-cl-border pt-4">
        <div className="flex justify-between gap-3 text-xs text-cl-muted">
          <span>Class subtotal</span>

          <span>
            {formatCurrency(
              draft.pricing.classSubtotalCents,
              draft.pricing.currency,
            )}
          </span>
        </div>

        <div className="flex justify-between gap-3 text-xs text-cl-muted">
          <span>Estimated Corner League fee</span>

          <span>
            {formatCurrency(
              draft.pricing.platformFeeCents,
              draft.pricing.currency,
            )}
          </span>
        </div>

        <div className="flex justify-between gap-3 text-xs text-cl-muted">
          <span>Estimated processing fee</span>

          <span>
            {formatCurrency(
              draft.pricing.processingFeeCents,
              draft.pricing.currency,
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-cl-border pt-3">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-cl-ink">
            <CreditCard className="h-4 w-4 text-cl-accent" />
            Estimated Total
          </span>

          <span className="text-xl font-black text-cl-ink">
            {formatCurrency(draft.pricing.totalCents, draft.pricing.currency)}
          </span>
        </div>

        <p className="pt-2 text-[10px] leading-4 text-cl-muted">
          Final pricing is calculated by the server when the registration is
          submitted.
        </p>
      </div>
    </aside>
  );
}
