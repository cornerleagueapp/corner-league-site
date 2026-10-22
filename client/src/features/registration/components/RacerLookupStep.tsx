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

import { useMyRacerProfile } from "@/hooks/useMyRacerProfile";
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
  const identity = useMyRacerProfile();
  const own = identity.data?.profile;
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
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cl-accent">
            Step 1 of 6
          </div>

          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink sm:text-3xl">
            Who is racing?
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-cl-muted">
            Search the Corner League racer database and choose the athlete being
            entered. Parents, guardians, and team representatives may register
            another racer when permitted.
          </p>
        </div>

        {own && (
          <button
            type="button"
            onClick={() =>
              onSelectRacer({
                id: own.athleteId,
                name: own.name,
                nickname: own.nickname,
                imageUrl: own.imageUrl,
                formattedLocation: own.formattedLocation,
              })
            }
            className="rounded-xl border border-cl-accent/25 bg-cl-accent/10 px-4 py-3 font-bold text-cl-accent"
          >
            Register as {own.name}
            {own.isVerifiedAthlete ? " • Verified athlete" : ""}
          </button>
        )}

        {selectedRacer ? (
          <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/[0.07] p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-emerald-300/25 bg-cl-canvas">
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
                  <div className="grid h-full w-full place-items-center text-sm font-black text-cl-success">
                    {getInitials(selectedRacer.name)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-cl-success" />

                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cl-success">
                    Racer selected
                  </p>
                </div>

                <h3 className="mt-1 truncate text-lg font-black uppercase text-cl-ink">
                  {selectedDisplayName}
                </h3>

                {selectedRacer.nickname ? (
                  <p className="mt-1 truncate text-xs font-bold text-cl-accent">
                    “{selectedRacer.nickname}”
                  </p>
                ) : null}

                <p className="mt-1 truncate text-xs text-cl-muted">
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
                className="hidden rounded-full border border-cl-border bg-cl-subtle px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted transition hover:bg-cl-subtle hover:text-cl-ink sm:block"
              >
                Search Again
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-[26px] border border-cl-accent/10 bg-cl-surface p-4 sm:p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cl-muted" />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search racer name, nickname, team, or location..."
              autoComplete="off"
              className="h-14 w-full rounded-[18px] border border-cl-border bg-cl-subtle py-3 pl-12 pr-12 text-sm text-cl-ink outline-none placeholder:text-cl-muted transition focus:border-cl-accent/30 focus:bg-cl-accent/[0.05] focus:ring-2 focus:ring-cl-accent/10"
            />

            {loading ? (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cl-accent" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");

                  setResults([]);

                  setSearchError(null);
                }}
                aria-label="Clear racer search"
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-cl-muted transition hover:bg-cl-subtle hover:text-cl-ink"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          {!hasSearch ? (
            <div className="mt-4 rounded-[20px] border border-dashed border-cl-border bg-cl-surface px-5 py-8 text-center">
              <UserRound className="mx-auto h-7 w-7 text-cl-muted" />

              <p className="mt-3 text-sm font-bold text-cl-muted">
                Enter at least two characters to find a racer.
              </p>

              <p className="mt-1 text-xs leading-5 text-cl-muted">
                Search existing Corner League racer profiles before creating a
                new athlete.
              </p>
            </div>
          ) : loading ? (
            <div className="mt-4 grid min-h-[180px] place-items-center rounded-[20px] border border-cl-border bg-cl-surface">
              <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-cl-accent" />

                <p className="mt-2 text-xs text-cl-muted">
                  Searching racers...
                </p>
              </div>
            </div>
          ) : searchError ? (
            <div className="mt-4 rounded-[20px] border border-red-300/15 bg-red-300/[0.04] px-5 py-7 text-center">
              <p className="text-sm font-bold text-cl-danger">
                Racer search unavailable
              </p>

              <p className="mt-2 text-xs leading-5 text-cl-danger">
                {searchError}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="mt-4 rounded-[20px] border border-dashed border-cl-border bg-cl-surface px-5 py-8 text-center">
              <Search className="mx-auto h-7 w-7 text-cl-muted" />

              <h3 className="mt-3 text-base font-black uppercase text-cl-ink">
                Racer not found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-cl-muted">
                Try a different spelling or create a new Corner League racer
                without leaving registration.
              </p>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cl-accent px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cl-contrast transition hover:bg-cl-accent"
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
                        ? "border-cl-accent/[0.35] bg-cl-accent/10"
                        : "border-cl-border bg-cl-subtle hover:border-cl-accent/20 hover:bg-cl-accent/[0.05]"
                    }`}
                  >
                    <div className="h-13 w-13 shrink-0 overflow-hidden rounded-full border border-cl-border bg-cl-surface">
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
                        <div className="grid h-full w-full place-items-center text-sm font-black text-cl-accent">
                          {getInitials(racer.name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-black uppercase text-cl-ink">
                          {racer.name}
                        </h3>

                        {racer.raceNumber ? (
                          <span className="rounded-full border border-cl-border bg-cl-surface px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-cl-muted">
                            #{racer.raceNumber}
                          </span>
                        ) : null}
                      </div>

                      {racer.nickname ? (
                        <p className="mt-1 text-xs font-bold text-cl-accent">
                          “{racer.nickname}”
                        </p>
                      ) : null}

                      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-cl-muted">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />

                        <span className="truncate">
                          {racer.formattedLocation || "Location not listed"}
                        </span>
                      </div>

                      {racer.teamName ? (
                        <p className="mt-1 truncate text-[11px] text-cl-muted">
                          {racer.teamName}
                        </p>
                      ) : null}
                    </div>

                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? "border-cl-accent/30 bg-cl-accent text-cl-contrast"
                          : "border-cl-border bg-cl-subtle text-cl-muted"
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

          <div className="mt-5 border-t border-cl-border pt-5">
            <div className="flex flex-col gap-3 rounded-[20px] border border-cl-accent/[0.15] bg-cl-accent/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-cl-ink">
                  New to Corner League?
                </h3>

                <p className="mt-1 text-xs leading-5 text-cl-muted">
                  Create a real racer profile and continue registration
                  immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-cl-accent/25 bg-cl-accent/10 px-4 text-[9px] font-black uppercase tracking-[0.13em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
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
