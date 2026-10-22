import { CalendarDays, CheckCircle2, MapPin, ShipWheel } from "lucide-react";

import type { PublicRegisteredRacer } from "../types/registration.types";

type PublicRegisteredRacerCardProps = {
  registration: PublicRegisteredRacer;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export default function PublicRegisteredRacerCard({
  registration,
}: PublicRegisteredRacerCardProps) {
  const { racer, selectedClasses } = registration;

  return (
    <article className="overflow-hidden rounded-[24px] border border-cl-border bg-cl-surface p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-cl-accent/[0.15] bg-cl-accent/10">
          {racer.imageUrl ? (
            <img
              src={racer.imageUrl}
              alt={racer.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-black text-cl-accent">
              {getInitials(racer.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black uppercase text-cl-ink">
              {racer.name}
            </h3>

            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-cl-success">
              <CheckCircle2 className="h-3 w-3" />

              {getStatusLabel(registration.status)}
            </span>
          </div>

          {racer.nickname ? (
            <p className="mt-1 text-xs font-bold text-cl-accent">
              “{racer.nickname}”
            </p>
          ) : null}

          <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-cl-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-cl-accent" />

            <span className="truncate">
              {racer.formattedLocation || "Location not listed"}
            </span>
          </div>
        </div>

        {racer.raceNumber ? (
          <div className="shrink-0 rounded-2xl border border-cl-border bg-cl-surface px-3 py-2 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-cl-muted">
              Number
            </p>

            <p className="mt-1 text-lg font-black text-cl-ink">
              #{racer.raceNumber}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-2 border-t border-cl-border pt-4">
        {selectedClasses.map((selection) => (
          <div
            key={selection.classId}
            className="rounded-[17px] border border-cl-border bg-cl-subtle p-3"
          >
            <p className="text-xs font-black uppercase text-cl-ink">
              {selection.className}
            </p>

            <div className="mt-2 flex items-start gap-1.5 text-[10px] text-cl-muted">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cl-accent" />

              <span>
                {selection.selectedEventDays.length
                  ? selection.selectedEventDays
                      .map((day) => day.label)
                      .join(" & ")
                  : "Event day not listed"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {racer.teamName ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-cl-muted">
          <ShipWheel className="h-3.5 w-3.5 text-cl-accent" />

          <span className="truncate">{racer.teamName}</span>
        </div>
      ) : null}
    </article>
  );
}
