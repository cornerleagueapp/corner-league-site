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
    <section className="rounded-[28px] border border-cl-accent/10 bg-cl-surface p-5 shadow-cl-panel sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/[0.15] bg-cl-accent/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-cl-accent">
            <TrendingUp className="h-3.5 w-3.5" />
            Live Registration Progress
          </div>

          <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink">
            Class entry progress
          </h2>

          <p className="mt-2 text-sm leading-6 text-cl-muted">
            See how registration is filling across each available race class.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-cl-border bg-cl-subtle px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-cl-muted">
          <Users className="h-4 w-4 text-cl-accent" />
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
              className="rounded-[22px] border border-cl-border bg-cl-subtle p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 shrink-0 text-cl-accent" />

                    <h3 className="truncate text-sm font-black uppercase text-cl-ink">
                      {eventClass.name}
                    </h3>
                  </div>

                  <p className="mt-2 text-xs text-cl-muted">
                    {capacity !== null
                      ? `${entered} of ${capacity} entries`
                      : `${entered} confirmed entries`}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-black text-cl-ink">
                    {capacity !== null ? `${Math.round(percentage)}%` : entered}
                  </p>

                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-cl-muted">
                    {capacity !== null ? "Filled" : "Entries"}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full border border-cl-border bg-cl-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cl-accent to-cl-accent transition-[width] duration-500"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-[10px]">
                <span className="font-bold text-cl-muted">
                  {entered} registered
                </span>

                {remaining !== null ? (
                  <span
                    className={
                      remaining === 0
                        ? "font-black uppercase text-cl-danger"
                        : remaining <= 5
                          ? "font-black uppercase text-cl-accent"
                          : "font-bold text-cl-muted"
                    }
                  >
                    {remaining === 0
                      ? "Class full"
                      : `${remaining} spot${remaining === 1 ? "" : "s"} left`}
                  </span>
                ) : (
                  <span className="font-bold text-cl-muted">
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
