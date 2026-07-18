import { useState } from "react";
import { Check, MapPin, Search, UserPlus, UserRound } from "lucide-react";
import RacerSearchModal from "@/components/RacerSearchModal";
import type { RegistrationRacer } from "../types/registration.types";
import CreateDemoRacerModal from "./CreateDemoRacerModal";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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
            Search the Corner League racer database and select the racer being
            entered. A parent or guardian may select a dependent racer.
          </p>
        </div>

        {selectedRacer ? (
          <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/[0.07] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-emerald-300/25 bg-[#07111F]">
                  {selectedRacer.imageUrl ? (
                    <img
                      src={selectedRacer.imageUrl}
                      alt={selectedRacer.name}
                      className="h-full w-full object-cover"
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
                    {selectedRacer.name}
                  </h3>

                  {selectedRacer.nickname ? (
                    <p className="mt-1 truncate text-xs font-bold text-cyan-200/65">
                      “{selectedRacer.nickname}”
                    </p>
                  ) : null}

                  <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-white/45">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />

                    <span className="truncate">
                      {selectedRacer.formattedLocation || "Location not listed"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[9px] font-black uppercase tracking-[0.12em] text-white/60 transition hover:border-cyan-300/20 hover:bg-cyan-300/10 hover:text-white"
              >
                <Search className="h-4 w-4" />
                Change Racer
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-5 sm:p-6">
            <div className="rounded-[22px] border border-dashed border-white/10 bg-black/15 px-5 py-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
                <UserRound className="h-6 w-6" />
              </div>

              <h3 className="mt-4 text-lg font-black uppercase text-white">
                Select a racer
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
                Search existing Corner League racer profiles before continuing
                with the registration.
              </p>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:bg-cyan-200"
              >
                <Search className="h-4 w-4" />
                Search Racers
              </button>
            </div>
          </div>
        )}

        <div className="rounded-[22px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.055] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#FF6B35]/20 bg-[#FF6B35]/10 text-[#FFB199]">
                <UserPlus className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-sm font-black uppercase text-white">
                  Racer not found?
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  Create a temporary racer record without leaving the
                  registration flow.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-4 text-[9px] font-black uppercase tracking-[0.13em] text-[#FFB199] transition hover:bg-[#FF6B35] hover:text-white"
            >
              <UserPlus className="h-4 w-4" />
              Create New Racer
            </button>
          </div>
        </div>
      </div>

      <RacerSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectRacer={(racer) => {
          const selectedRegistrationRacer: RegistrationRacer = {
            id: String(racer.id),
            name: racer.racerName,
            nickname: null,
            imageUrl: racer.racerImage ?? null,

            city: null,
            stateCode: null,
            countryCode: null,
            formattedLocation: racer.location ?? null,

            raceNumber: null,
            teamName: racer.boatManufacturers ?? null,

            isDemoCreated: false,
          };

          onSelectRacer(selectedRegistrationRacer);
          setSearchOpen(false);
        }}
      />

      <CreateDemoRacerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(racer) => {
          onSelectRacer(racer);
          setCreateModalOpen(false);
        }}
      />
    </>
  );
}
