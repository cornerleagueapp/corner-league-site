import {
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import type { RegistrationEvent } from "../types/registration.types";
import RegistrationShareButton from "./RegistrationShareButton";

type RegistrationEventCardProps = {
  event: RegistrationEvent;
  featured?: boolean;
};

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const sameDay = sameMonth && start.getDate() === end.getDate();

  if (sameDay) {
    return start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

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
    year: sameYear ? undefined : "numeric",
  })}${sameYear ? `, ${end.getFullYear()}` : ""}`;
}

function formatRegistrationDeadline(date?: string | null) {
  if (!date) {
    return "No deadline";
  }

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusStyles(status: RegistrationEvent["registrationStatus"]) {
  switch (status) {
    case "open":
      return {
        label: "Registration Open",
        className: "border-emerald-300/20 bg-emerald-300/10 text-cl-success",
      };

    case "upcoming":
      return {
        label: "Coming Soon",
        className: "border-amber-300/20 bg-amber-300/10 text-cl-warning",
      };

    case "closed":
      return {
        label: "Registration Closed",
        className: "border-red-300/20 bg-red-300/10 text-cl-danger",
      };

    default:
      return {
        label: status,
        className: "border-cl-border bg-cl-subtle text-cl-muted",
      };
  }
}

export default function RegistrationEventCard({
  event,
  featured = false,
}: RegistrationEventCardProps) {
  const [, navigate] = useLocation();

  const status = getStatusStyles(event.registrationStatus);

  const organizationName = event.organization?.name || "Corner League";

  const organizationAbbreviation =
    event.organization?.abbreviation || organizationName;

  const openEvent = () => {
    navigate(`/registration/events/${event.slug}`);
  };

  return (
    <article
      className={`group relative min-w-0 overflow-hidden rounded-[28px] border transition duration-300 hover:-translate-y-1 ${
        featured
          ? "border-cl-accent/20 cl-panel-wash shadow-cl-panel"
          : "border-cl-accent/[0.14] bg-cl-canvas shadow-cl-panel hover:border-cl-accent/30 hover:bg-cl-canvas"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cl-accent/10 blur-3xl" />

        <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-cl-accent/[0.08] blur-3xl" />

        <div className="absolute inset-0 opacity-[0.028] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:52px_52px]" />
      </div>

      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent">
              {featured ? (
                <Trophy className="h-5 w-5" />
              ) : (
                <CalendarDays className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate text-[10px] font-black uppercase tracking-[0.17em] text-cl-accent">
                {organizationAbbreviation}
              </div>

              <div
                className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${status.className}`}
              >
                {status.label}
              </div>
            </div>
          </div>

          <RegistrationShareButton
            eventName={event.name}
            eventSlug={event.slug}
            startDate={event.startDate}
            endDate={event.endDate}
            variant="icon"
          />
        </div>

        <button
          type="button"
          onClick={openEvent}
          className="mt-5 block text-left"
        >
          <h2 className="break-words text-2xl font-black uppercase leading-[0.98] tracking-[-0.035em] text-cl-ink transition group-hover:text-cl-accent sm:text-3xl">
            {event.name}
          </h2>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-cl-muted">
            {event.description}
          </p>
        </button>

        <div className="mt-5 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2.5 rounded-[16px] border border-cl-border bg-cl-subtle px-3 py-3 text-cl-muted">
            <CalendarDays className="h-4 w-4 shrink-0 text-cl-accent" />

            <span className="min-w-0 truncate">
              {formatDateRange(event.startDate, event.endDate)}
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-[16px] border border-cl-border bg-cl-subtle px-3 py-3 text-cl-muted">
            <MapPin className="h-4 w-4 shrink-0 text-cl-accent" />

            <span className="min-w-0 truncate">{event.formattedLocation}</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-[16px] border border-cl-border bg-cl-subtle px-3 py-3 text-cl-muted">
            <Users className="h-4 w-4 shrink-0 text-cl-accent" />

            <span>
              {event.confirmedRacerCount} confirmed racer
              {event.confirmedRacerCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-[16px] border border-cl-border bg-cl-subtle px-3 py-3 text-cl-muted">
            <Clock3 className="h-4 w-4 shrink-0 text-cl-accent" />

            <span className="min-w-0 truncate">
              {event.registrationClosesAt
                ? `Closes ${formatRegistrationDeadline(event.registrationClosesAt)}`
                : "No registration deadline"}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-cl-border pt-5">
          <div className="flex items-center gap-2 text-xs font-bold text-cl-muted">
            <Building2 className="h-4 w-4 text-cl-muted" />

            <span className="line-clamp-1">{organizationName}</span>
          </div>

          <button
            type="button"
            onClick={openEvent}
            className="inline-flex items-center gap-2 rounded-full bg-cl-accent px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-cl-contrast transition hover:bg-cl-accent"
          >
            View Event
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
