import { CalendarDays, CheckCircle2, MapPin, ShipWheel } from "lucide-react";
import type {
  PublicRegisteredRacer,
  RegistrationRaceDay,
} from "../types/registration.types";

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

function formatRaceDays(days: RegistrationRaceDay[]) {
  return days
    .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(" & ");
}

export default function PublicRegisteredRacerCard({
  registration,
}: PublicRegisteredRacerCardProps) {
  const { racer, selectedClasses } = registration;

  return (
    <article className="rounded-[24px] border border-cyan-300/10 bg-[#07111F]/82 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.2)] transition hover:border-cyan-300/22 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-cyan-300/15 bg-cyan-300/10">
          {racer.imageUrl ? (
            <img
              src={racer.imageUrl}
              alt={racer.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-black text-cyan-200">
              {getInitials(racer.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black uppercase text-white">
              {racer.name}
            </h3>

            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              Confirmed
            </span>
          </div>

          {racer.nickname ? (
            <p className="mt-1 text-xs font-bold text-cyan-200/65">
              “{racer.nickname}”
            </p>
          ) : null}

          <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-white/40">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FFB199]" />

            <span className="truncate">
              {racer.formattedLocation || "Location not listed"}
            </span>
          </div>
        </div>

        {racer.raceNumber ? (
          <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/30">
              Number
            </p>

            <p className="mt-1 text-lg font-black text-white">
              #{racer.raceNumber}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        {selectedClasses.map((selection) => (
          <div
            key={selection.classId}
            className="rounded-[17px] border border-white/8 bg-white/[0.025] p-3"
          >
            <p className="text-xs font-black uppercase text-white">
              {selection.className}
            </p>

            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/40">
              <CalendarDays className="h-3.5 w-3.5 text-cyan-200" />
              {formatRaceDays(selection.raceDays)}
            </div>
          </div>
        ))}
      </div>

      {racer.teamName ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
          <ShipWheel className="h-3.5 w-3.5 text-[#FFB199]" />
          <span className="truncate">{racer.teamName}</span>
        </div>
      ) : null}
    </article>
  );
}
