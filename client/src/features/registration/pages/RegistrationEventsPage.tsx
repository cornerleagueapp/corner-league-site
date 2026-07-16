import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import RegistrationLayout from "../components/RegistrationLayout";
import RegistrationEventCard from "../components/RegistrationEventCard";
import { getRegistrationEvents } from "../services/registrationDemoService";
import type {
  RegistrationEvent,
  RegistrationEventStatus,
} from "../types/registration.types";

type EventStatusFilter = "all" | RegistrationEventStatus;

const statusFilters: Array<{
  value: EventStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All Events" },
  { value: "open", label: "Open" },
  { value: "upcoming", label: "Coming Soon" },
  { value: "closed", label: "Closed" },
];

function includesSearch(event: RegistrationEvent, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return [
    event.name,
    event.organizationName,
    event.organizationAbbreviation,
    event.city,
    event.stateCode,
    event.countryCode,
    event.formattedLocation,
    ...event.classes.map((eventClass) => eventClass.name),
  ].some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(normalized),
  );
}

export default function RegistrationEventsPage() {
  const [events, setEvents] = useState<RegistrationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);

        const result = await getRegistrationEvents();

        if (!cancelled) {
          setEvents(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Unable to load race events.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesStatus =
        statusFilter === "all" || event.registrationStatus === statusFilter;

      return matchesStatus && includesSearch(event, query);
    });
  }, [events, query, statusFilter]);

  const hasFilters = query.trim().length > 0 || statusFilter !== "all";

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
  }

  return (
    <RegistrationLayout
      eyebrow="Event Directory"
      title="Find race events"
      description="Search upcoming race registration by event, organization, location, class, or registration status."
      backHref="/registration"
      backLabel="Registration Home"
    >
      <div className="space-y-5">
        <section className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search event, organization, location, or class..."
                className="h-13 w-full rounded-[18px] border border-white/10 bg-white/[0.045] py-3.5 pl-11 pr-11 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-cyan-300/30 focus:bg-cyan-300/[0.055] focus:ring-2 focus:ring-cyan-300/10"
              />

              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear event search"
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/40 sm:grid">
                <SlidersHorizontal className="h-4 w-4" />
              </span>

              {statusFilters.map((filter) => {
                const active = statusFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`shrink-0 rounded-full border px-4 py-3 text-[9px] font-black uppercase tracking-[0.13em] transition ${
                      active
                        ? "border-cyan-300/25 bg-cyan-300 text-[#06111d]"
                        : "border-white/10 bg-white/[0.04] text-white/55 hover:border-cyan-300/20 hover:bg-cyan-300/10 hover:text-white"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200/55">
              Event results
            </div>

            <h2 className="mt-1 text-xl font-black uppercase text-white">
              {filteredEvents.length} event
              {filteredEvents.length === 1 ? "" : "s"}
            </h2>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.13em] text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="grid min-h-[360px] place-items-center rounded-[26px] border border-cyan-300/10 bg-[#07111F]/75">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-200" />
              <p className="mt-3 text-sm text-white/50">Loading events...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[26px] border border-red-300/15 bg-red-950/20 p-6 text-center">
            <p className="text-sm text-red-100/75">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-white/10 bg-[#07111F]/65 px-5 py-14 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-white/25" />

            <h2 className="mt-4 text-xl font-black uppercase text-white">
              No events found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
              Try another event name, organization, location, class, or
              registration status.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredEvents.map((event) => (
              <RegistrationEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </RegistrationLayout>
  );
}
