import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import AthleteSearchModal from "./AthleteSearchModal";
import RacerSearchModal from "./RacerSearchModal";

export type MotoResultCell = {
  pos: number | null;
  raceTime?: number | null;
};

export type RaceClassRacer = {
  athleteId: string; // from DB
  name: string; // "Braydem Baldwin"
  age: number | null;
  boatNumber: string | number | null;
  motos: MotoResultCell[]; // length = motoCount
  finalPos: number | null;
};

export type RaceClassDraft = {
  className: string;
  motoCount: number;
  racers: RaceClassRacer[];
};

export function emptyRaceClassDraft(): RaceClassDraft {
  return {
    className: "",
    motoCount: 3,
    racers: [],
  };
}

type Props = {
  draft: RaceClassDraft;
  onChange: (next: RaceClassDraft) => void;
  onRemove?: () => void;
};

export default function RaceClassEditor({ draft, onChange, onRemove }: Props) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  function updateField<K extends keyof RaceClassDraft>(
    key: K,
    value: RaceClassDraft[K]
  ) {
    onChange({ ...draft, [key]: value });
  }

  // When motoCount changes (2-4), we need to resize the motos arrays for each racer.
  function handleMotoCountChange(nextCount: number) {
    const fixed = draft.racers.map((r) => {
      const newArr = [...r.motos];
      if (newArr.length < nextCount) {
        while (newArr.length < nextCount) {
          newArr.push({ pos: null });
        }
      } else if (newArr.length > nextCount) {
        newArr.length = nextCount;
      }
      return { ...r, motos: newArr };
    });

    onChange({
      ...draft,
      motoCount: nextCount,
      racers: fixed,
    });
  }

  function handleUpdateRacer(idx: number, next: RaceClassRacer) {
    const copy = [...draft.racers];
    copy[idx] = next;
    onChange({ ...draft, racers: copy });
  }

  function handleRemoveRacer(idx: number) {
    const copy = draft.racers.filter((_, i) => i !== idx);
    onChange({ ...draft, racers: copy });
  }

  // Pretend we picked an athlete from search modal
  // In real code you'll call this when user confirms a racer from AthleteSearchModal
  function addRacerPlaceholder() {
    const newRacer: RaceClassRacer = {
      athleteId: crypto.randomUUID(),
      name: "New Racer",
      age: 18,
      boatNumber: "",
      motos: Array.from({ length: draft.motoCount }, () => ({ pos: null })),
      finalPos: null,
    };
    onChange({ ...draft, racers: [...draft.racers, newRacer] });
  }

  return (
    <Card className="bg-zinc-900 border border-zinc-700 p-6 text-white space-y-6">
      {/* Header row with class name / motos / remove */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Class Name *</label>
            <Input
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              placeholder="Novice Runabout Stock"
              value={draft.className}
              onChange={(e) => updateField("className", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400"># of Motos (2-4)</label>
            <Input
              type="number"
              min={2}
              max={4}
              className="bg-zinc-800 border-zinc-700 text-white"
              value={draft.motoCount}
              onChange={(e) =>
                handleMotoCountChange(
                  Math.min(4, Math.max(2, parseInt(e.target.value || "0", 10)))
                )
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Racers</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 text-xs px-3 py-2 h-8"
                onClick={() => setIsSearchOpen(true)}
              >
                + Add Racer
              </Button>

              <div className="text-xs text-zinc-400">
                {draft.racers.length} added
              </div>
            </div>
          </div>
        </div>

        {onRemove && (
          <Button
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 self-start md:self-auto"
            onClick={onRemove}
          >
            Remove Class
          </Button>
        )}
      </div>

      {/* Editable table of racers / motos */}
      <div className="overflow-x-auto border border-zinc-800 rounded-lg">
        <table className="min-w-full text-sm text-left text-zinc-300">
          <thead className="bg-zinc-800 text-xs uppercase text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Rank</th>
              <th className="px-3 py-2 font-medium">Boat #</th>
              <th className="px-3 py-2 font-medium">Rider</th>
              <th className="px-3 py-2 font-medium">Age</th>
              {Array.from({ length: draft.motoCount }).map((_, i) => (
                <th key={i} className="px-3 py-2 font-medium">
                  Moto {i + 1}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Final</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>

          <tbody>
            {draft.racers.map((racer, idx) => (
              <RaceClassRow
                key={racer.athleteId}
                idx={idx}
                racer={racer}
                motoCount={draft.motoCount}
                onChange={(nextRacer) => handleUpdateRacer(idx, nextRacer)}
                onRemove={() => handleRemoveRacer(idx)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {isSearchOpen && (
        <RacerSearchModal
          open={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectRacer={(r) => {
            const newRacer: RaceClassRacer = {
              athleteId: String(r.id),
              name: r.racerName,
              age: null, // add if your modal returns age
              boatNumber: null, // add if your modal returns boat #
              motos: Array.from({ length: draft.motoCount }, () => ({
                pos: null,
              })),
              finalPos: null,
            };
            onChange({ ...draft, racers: [...draft.racers, newRacer] });
            setIsSearchOpen(false);
          }}
        />
      )}
    </Card>
  );
}

// ----- row component -----

function RaceClassRow({
  idx,
  racer,
  motoCount,
  onChange,
  onRemove,
}: {
  idx: number;
  racer: RaceClassRacer;
  motoCount: number;
  onChange: (r: RaceClassRacer) => void;
  onRemove: () => void;
}) {
  // "Rank" is really just final rank in the table view you showed.
  // We can derive default rank = idx+1, but allow override.
  function setFinalPos(val: number | null) {
    onChange({ ...racer, finalPos: val });
  }

  function setBoatNumber(val: string) {
    onChange({ ...racer, boatNumber: val });
  }

  function setName(val: string) {
    onChange({ ...racer, name: val });
  }

  function setAge(val: number | null) {
    onChange({ ...racer, age: val });
  }

  function setMotoPos(motoIndex: number, val: number | null) {
    const newMotos = racer.motos.map((m, i) =>
      i === motoIndex ? { ...m, pos: val } : m
    );
    onChange({ ...racer, motos: newMotos });
  }

  return (
    <tr className="border-t border-zinc-800 text-white">
      {/* Rank (display idx+1 OR finalPos?) */}
      <td className="px-3 py-2 align-top whitespace-nowrap text-zinc-200 w-[60px]">
        <div className="text-xs text-zinc-400">{idx + 1}</div>
      </td>

      {/* Boat # */}
      <td className="px-3 py-2 align-top">
        <Input
          className="h-8 text-xs bg-zinc-800 border-zinc-700 text-white w-16"
          value={racer.boatNumber ?? ""}
          onChange={(e) => setBoatNumber(e.target.value)}
        />
      </td>

      {/* Rider name */}
      <td className="px-3 py-2 align-top min-w-[160px]">
        <Input
          className="h-8 text-xs bg-zinc-800 border-zinc-700 text-white"
          value={racer.name}
          onChange={(e) => setName(e.target.value)}
        />
      </td>

      {/* Age */}
      <td className="px-3 py-2 align-top w-[60px]">
        <Input
          className="h-8 text-xs bg-zinc-800 border-zinc-700 text-white w-14"
          type="number"
          value={racer.age ?? ""}
          onChange={(e) =>
            setAge(e.target.value === "" ? null : parseInt(e.target.value, 10))
          }
        />
      </td>

      {/* Moto columns */}
      {Array.from({ length: motoCount }).map((_, motoI) => (
        <td key={motoI} className="px-3 py-2 align-top w-[60px]">
          <Input
            className="h-8 text-xs bg-zinc-800 border-zinc-700 text-white w-14"
            type="number"
            placeholder="-"
            value={
              racer.motos[motoI] && racer.motos[motoI].pos !== null
                ? racer.motos[motoI].pos ?? ""
                : ""
            }
            onChange={(e) => {
              const v = e.target.value;
              setMotoPos(
                motoI,
                v === "" ? null : parseInt(e.target.value || "0", 10)
              );
            }}
          />
        </td>
      ))}

      {/* Final position */}
      <td className="px-3 py-2 align-top w-[60px]">
        <Input
          className="h-8 text-xs bg-zinc-800 border-zinc-700 text-white w-14"
          type="number"
          placeholder="-"
          value={racer.finalPos ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setFinalPos(v === "" ? null : parseInt(v || "0", 10));
          }}
        />
      </td>

      {/* remove button */}
      <td className="px-3 py-2 align-top text-right">
        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 px-2 text-xs"
          onClick={onRemove}
        >
          Remove
        </Button>
      </td>
    </tr>
  );
}
