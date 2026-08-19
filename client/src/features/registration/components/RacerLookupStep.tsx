import { useEffect, useMemo, useState } from "react";

import {
  Check,
  Loader2,
  MapPin,
  Search,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import stockAvatar from "@/assets/stockprofilepicture.jpeg";

import { searchRegistrationRacers } from "../services/registrationRacerService";

import type { RegistrationRacer } from "../types/registration.types";

import CreateRegistrationRacerModal from "./CreateRegistrationRacerModal";

type RacerLookupStepProps = {
  selectedRacer: RegistrationRacer | null | undefined;

  onSelectRacer: (racer: RegistrationRacer) => void;
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

export default function RacerLookupStep({
  selectedRacer,
  onSelectRacer,
}: RacerLookupStepProps) {
  const [query, setQuery] = useState("");

  const [results, setResults] = useState<RegistrationRacer[]>([]);

  const [loading, setLoading] = useState(false);

  const [searchError, setSearchError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const normalizedQuery = query.trim();

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setResults([]);
      setSearchError(null);
      setLoading(false);

      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError(null);

        const racers = await searchRegistrationRacers(normalizedQuery);

        if (!cancelled) {
          setResults(racers);
        }
      } catch (error: any) {
        if (!cancelled) {
          setResults([]);

          setSearchError(error?.message || "Unable to search racers.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;

      window.clearTimeout(timer);
    };
  }, [normalizedQuery]);

  const hasSearch = normalizedQuery.length >= 2;

  const selectedDisplayName = useMemo(
    () => selectedRacer?.name || "",
    [selectedRacer],
  );

  return (
    <>
      <div className="space-y-5">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
            Step 1 of 6
          </div>

          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">
            Who is racing?
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
            Search the Corner League racer database and choose the athlete being
            entered. Parents, guardians, and team representatives may register
            another racer when permitted.
          </p>
        </div>

        {selectedRacer ? (
          <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/[0.07] p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-emerald-300/25 bg-[#07111F]">
                {selectedRacer.imageUrl ? (
                  <img
                    src={selectedRacer.imageUrl}
                    alt={selectedRacer.name}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = stockAvatar;
                    }}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm font-black text-emerald-200">
                    {getInitials(selectedRacer.name)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-200" />

                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200">
                    Racer selected
                  </p>
                </div>

                <h3 className="mt-1 truncate text-lg font-black uppercase text-white">
                  {selectedDisplayName}
                </h3>

                {selectedRacer.nickname ? (
                  <p className="mt-1 truncate text-xs font-bold text-cyan-200/65">
                    “{selectedRacer.nickname}”
                  </p>
                ) : null}

                <p className="mt-1 truncate text-xs text-white/45">
                  {selectedRacer.formattedLocation || "Location not listed"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuery("");

                  setResults([]);

                  setSearchError(null);
                }}
                className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/60 transition hover:bg-white/10 hover:text-white sm:block"
              >
                Search Again
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-4 sm:p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search racer name, nickname, team, or location..."
              autoComplete="off"
              className="h-14 w-full rounded-[18px] border border-white/10 bg-white/[0.045] py-3 pl-12 pr-12 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-cyan-300/30 focus:bg-cyan-300/[0.05] focus:ring-2 focus:ring-cyan-300/10"
            />

            {loading ? (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-200" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");

                  setResults([]);

                  setSearchError(null);
                }}
                aria-label="Clear racer search"
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          {!hasSearch ? (
            <div className="mt-4 rounded-[20px] border border-dashed border-white/10 bg-black/15 px-5 py-8 text-center">
              <UserRound className="mx-auto h-7 w-7 text-white/20" />

              <p className="mt-3 text-sm font-bold text-white/55">
                Enter at least two characters to find a racer.
              </p>

              <p className="mt-1 text-xs leading-5 text-white/35">
                Search existing Corner League racer profiles before creating a
                new athlete.
              </p>
            </div>
          ) : loading ? (
            <div className="mt-4 grid min-h-[180px] place-items-center rounded-[20px] border border-white/10 bg-black/15">
              <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-200" />

                <p className="mt-2 text-xs text-white/40">
                  Searching racers...
                </p>
              </div>
            </div>
          ) : searchError ? (
            <div className="mt-4 rounded-[20px] border border-red-300/15 bg-red-300/[0.04] px-5 py-7 text-center">
              <p className="text-sm font-bold text-red-100">
                Racer search unavailable
              </p>

              <p className="mt-2 text-xs leading-5 text-red-100/55">
                {searchError}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="mt-4 rounded-[20px] border border-dashed border-white/10 bg-black/15 px-5 py-8 text-center">
              <Search className="mx-auto h-7 w-7 text-white/20" />

              <h3 className="mt-3 text-base font-black uppercase text-white">
                Racer not found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/40">
                Try a different spelling or create a new Corner League racer
                without leaving registration.
              </p>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200"
              >
                <UserPlus className="h-4 w-4" />
                Create New Racer
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {results.map((racer) => {
                const selected = selectedRacer?.id === racer.id;

                return (
                  <button
                    key={racer.id}
                    type="button"
                    onClick={() => onSelectRacer(racer)}
                    className={`flex w-full items-center gap-3 rounded-[20px] border p-3 text-left transition sm:p-4 ${
                      selected
                        ? "border-cyan-300/35 bg-cyan-300/10"
                        : "border-white/10 bg-white/[0.03] hover:border-cyan-300/20 hover:bg-cyan-300/[0.05]"
                    }`}
                  >
                    <div className="h-13 w-13 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/25">
                      {racer.imageUrl ? (
                        <img
                          src={racer.imageUrl}
                          alt={racer.name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = stockAvatar;
                          }}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-sm font-black text-cyan-200">
                          {getInitials(racer.name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-black uppercase text-white">
                          {racer.name}
                        </h3>

                        {racer.raceNumber ? (
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-white/50">
                            #{racer.raceNumber}
                          </span>
                        ) : null}
                      </div>

                      {racer.nickname ? (
                        <p className="mt-1 text-xs font-bold text-cyan-200/65">
                          “{racer.nickname}”
                        </p>
                      ) : null}

                      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-white/40">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />

                        <span className="truncate">
                          {racer.formattedLocation || "Location not listed"}
                        </span>
                      </div>

                      {racer.teamName ? (
                        <p className="mt-1 truncate text-[11px] text-white/35">
                          {racer.teamName}
                        </p>
                      ) : null}
                    </div>

                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? "border-cyan-300/30 bg-cyan-300 text-[#06111d]"
                          : "border-white/10 bg-white/[0.04] text-white/25"
                      }`}
                    >
                      {selected ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <UserRound className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-5 border-t border-white/10 pt-5">
            <div className="flex flex-col gap-3 rounded-[20px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-white">
                  New to Corner League?
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  Create a real racer profile and continue registration
                  immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-4 text-[9px] font-black uppercase tracking-[0.13em] text-[#FFB199] transition hover:bg-[#FF6B35] hover:text-white"
              >
                <UserPlus className="h-4 w-4" />
                Create Racer
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateRegistrationRacerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(racer) => {
          onSelectRacer(racer);

          setQuery(racer.name);

          setResults([racer]);

          setSearchError(null);
        }}
      />
    </>
  );
}
