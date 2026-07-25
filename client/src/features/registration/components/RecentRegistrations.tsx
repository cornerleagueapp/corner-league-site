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
    <section className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#FF6B35]/15 bg-[#FF6B35]/10 text-[#FFB199]">
          <Users className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FFB199]/70">
            Event Activity
          </p>

          <h3 className="mt-1 text-base font-black uppercase text-white">
            Recently Registered
          </h3>
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="mt-5 rounded-[18px] border border-dashed border-white/10 bg-black/15 px-4 py-8 text-center">
          <Users className="mx-auto h-6 w-6 text-white/20" />

          <p className="mt-3 text-xs leading-5 text-white/40">
            Recent confirmed registrations will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {recent.map((registration) => (
            <article
              key={registration.registrationId}
              className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 text-xs font-black text-cyan-200">
                  {getInitials(registration.racer.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-200" />

                    <p className="truncate text-xs font-black uppercase text-white">
                      {registration.racer.name}
                    </p>
                  </div>

                  <p className="mt-1 truncate text-[11px] text-white/40">
                    {registration.selectedClasses
                      .map((selection) => selection.className)
                      .join(", ")}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 text-[9px] font-bold text-white/35">
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
