import {
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Share2,
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

function formatRegistrationDeadline(date: string) {
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
        className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
      };

    case "upcoming":
      return {
        label: "Coming Soon",
        className: "border-amber-300/20 bg-amber-300/10 text-amber-200",
      };

    case "closed":
      return {
        label: "Registration Closed",
        className: "border-red-300/20 bg-red-300/10 text-red-200",
      };

    case "completed":
      return {
        label: "Completed",
        className: "border-white/10 bg-white/[0.05] text-white/55",
      };

    default:
      return {
        label: status,
        className: "border-white/10 bg-white/[0.05] text-white/55",
      };
  }
}

export default function RegistrationEventCard({
  event,
  featured = false,
}: RegistrationEventCardProps) {
  const [, navigate] = useLocation();

  const status = getStatusStyles(event.registrationStatus);

  const openEvent = () => {
    navigate(`/registration/events/${event.slug}`);
  };

  return (
    <article
      className={`group relative min-w-0 overflow-hidden rounded-[28px] border shadow-[0_24px_70px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 ${
        featured
          ? "border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.14)_0%,rgba(7,17,31,0.98)_46%,rgba(255,107,53,0.12)_100%)]"
          : "border-cyan-300/10 bg-[#07111F]/88 hover:border-cyan-300/25"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[#FF6B35]/8 blur-3xl" />

        <div className="absolute inset-0 opacity-[0.028] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:52px_52px]" />
      </div>

      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
              {featured ? (
                <Trophy className="h-5 w-5" />
              ) : (
                <CalendarDays className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate text-[10px] font-black uppercase tracking-[0.17em] text-cyan-200/65">
                {event.organizationAbbreviation || event.organizationName}
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
          <h2 className="break-words text-2xl font-black uppercase leading-[0.98] tracking-[-0.035em] text-white transition group-hover:text-cyan-100 sm:text-3xl">
            {event.name}
          </h2>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
            {event.description}
          </p>
        </button>

        <div className="mt-5 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2.5 rounded-[16px] border border-white/8 bg-white/[0.035] px-3 py-3 text-slate-300">
            <CalendarDays className="h-4 w-4 shrink-0 text-cyan-200" />

            <span className="min-w-0 truncate">
              {formatDateRange(event.startDate, event.endDate)}
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-[16px] border border-white/8 bg-white/[0.035] px-3 py-3 text-slate-300">
            <MapPin className="h-4 w-4 shrink-0 text-[#FFB199]" />

            <span className="min-w-0 truncate">{event.formattedLocation}</span>
          </div>

          <div className="flex items-center gap-2.5 rounded-[16px] border border-white/8 bg-white/[0.035] px-3 py-3 text-slate-300">
            <Users className="h-4 w-4 shrink-0 text-cyan-200" />

            <span>
              {event.confirmedRacerCount} confirmed racer
              {event.confirmedRacerCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-[16px] border border-white/8 bg-white/[0.035] px-3 py-3 text-slate-300">
            <Clock3 className="h-4 w-4 shrink-0 text-[#FFB199]" />

            <span className="min-w-0 truncate">
              Closes {formatRegistrationDeadline(event.registrationCloseDate)}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <div className="flex items-center gap-2 text-xs font-bold text-white/50">
            <Building2 className="h-4 w-4 text-white/35" />
            <span className="line-clamp-1">{event.organizationName}</span>
          </div>

          <button
            type="button"
            onClick={openEvent}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200"
          >
            View Event
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
