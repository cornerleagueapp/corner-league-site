import { CheckCircle2, Clock3, Users } from "lucide-react";

import type { PublicRegisteredRacer } from "../types/registration.types";

type RecentRegistrationsProps = {
  registrations: PublicRegisteredRacer[];
  limit?: number;
};

function formatRelativeTime(dateValue: string) {
  const timestamp = new Date(dateValue).getTime();

  if (Number.isNaN(timestamp)) {
    return "Recently";
  }

  const differenceMs = Date.now() - timestamp;

  const minutes = Math.max(0, Math.floor(differenceMs / 60_000));

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Date(dateValue).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RecentRegistrations({
  registrations,
  limit = 5,
}: RecentRegistrationsProps) {
  const recent = [...registrations]
    .sort(
      (a, b) =>
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    )
    .slice(0, limit);

  return (
    <section className="rounded-[26px] border border-cl-accent/10 bg-cl-surface p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10">
          <Users className="h-4 w-4 text-cl-accent" />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-cl-accent">
            Event Activity
          </p>

          <h3 className="mt-1 text-base font-black uppercase text-cl-ink">
            Recently Registered
          </h3>
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="mt-5 rounded-[18px] border border-dashed border-cl-border bg-cl-surface px-4 py-8 text-center">
          <Users className="mx-auto h-6 w-6 text-cl-muted" />

          <p className="mt-3 text-xs leading-5 text-cl-muted">
            Recent confirmed registrations will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {recent.map((registration) => (
            <article
              key={registration.registrationId}
              className="rounded-[18px] border border-cl-border bg-cl-subtle p-3"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-cl-accent/[0.15] bg-cl-accent/10 text-xs font-black text-cl-accent">
                  {registration.racer.imageUrl ? (
                    <img
                      src={registration.racer.imageUrl}
                      alt={registration.racer.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(registration.racer.name)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cl-success" />

                    <p className="truncate text-xs font-black uppercase text-cl-ink">
                      {registration.racer.name}
                    </p>
                  </div>

                  <p className="mt-1 truncate text-[11px] text-cl-muted">
                    {registration.selectedClasses
                      .map((selection) => selection.className)
                      .join(", ")}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 text-[9px] font-bold text-cl-muted">
                  <Clock3 className="h-3 w-3" />

                  {formatRelativeTime(registration.registeredAt)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
