import { Flag, TrendingUp, Users } from "lucide-react";
import type {
  PublicRegisteredRacer,
  RegistrationEvent,
} from "../types/registration.types";

type EventRegistrationProgressProps = {
  event: RegistrationEvent;
  registrations: PublicRegisteredRacer[];
};

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function EventRegistrationProgress({
  event,
  registrations,
}: EventRegistrationProgressProps) {
  const classes = [...event.classes].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return (
    <section className="rounded-[28px] border border-cyan-300/10 bg-[#07111F]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
            <TrendingUp className="h-3.5 w-3.5" />
            Live Registration Progress
          </div>

          <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.035em] text-white">
            Class entry progress
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/45">
            See how registration is filling across each available race class.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/60">
          <Users className="h-4 w-4 text-cyan-200" />
          {registrations.length} Public Entries
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {classes.map((eventClass) => {
          const locallyConfirmed = registrations.filter((registration) =>
            registration.selectedClasses.some(
              (selection) => selection.classId === eventClass.id,
            ),
          ).length;

          const entered = Math.max(
            eventClass.confirmedRacerCount,
            locallyConfirmed,
          );

          const capacity = eventClass.capacity ?? null;

          const percentage = capacity
            ? clampPercentage((entered / capacity) * 100)
            : entered > 0
              ? 100
              : 0;

          const remaining =
            capacity !== null ? Math.max(0, capacity - entered) : null;

          return (
            <article
              key={eventClass.id}
              className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 shrink-0 text-cyan-200" />

                    <h3 className="truncate text-sm font-black uppercase text-white">
                      {eventClass.name}
                    </h3>
                  </div>

                  <p className="mt-2 text-xs text-white/40">
                    {capacity !== null
                      ? `${entered} of ${capacity} entries`
                      : `${entered} confirmed entries`}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-black text-white">
                    {capacity !== null ? `${Math.round(percentage)}%` : entered}
                  </p>

                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/30">
                    {capacity !== null ? "Filled" : "Entries"}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/10 bg-black/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-cyan-100 transition-[width] duration-500"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-[10px]">
                <span className="font-bold text-white/45">
                  {entered} registered
                </span>

                {remaining !== null ? (
                  <span
                    className={
                      remaining === 0
                        ? "font-black uppercase text-red-200"
                        : remaining <= 5
                          ? "font-black uppercase text-[#FFB199]"
                          : "font-bold text-white/45"
                    }
                  >
                    {remaining === 0
                      ? "Class full"
                      : `${remaining} spot${remaining === 1 ? "" : "s"} left`}
                  </span>
                ) : (
                  <span className="font-bold text-white/35">
                    No capacity limit
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
