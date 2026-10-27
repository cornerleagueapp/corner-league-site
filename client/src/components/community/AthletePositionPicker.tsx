import { positionOptions } from "@/lib/athletePositions";
export default function AthletePositionPicker({
  sport,
  value,
  onChange,
  disabled = false,
}: {
  sport: string;
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const options = positionOptions[sport];
  if (!options) return null;
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="font-semibold">Positions you play</legend>
      <p className="text-sm text-cl-muted">
        Select all that apply. These preferences are shared with your league and
        draft room.
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((p) => (
          <label
            key={p}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 ${value.includes(p) ? "border-cl-accent bg-cl-accent/10 text-cl-accent" : "border-cl-border"}`}
          >
            <input
              type="checkbox"
              checked={value.includes(p)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, p]
                    : value.filter((v) => v !== p),
                )
              }
            />
            {p}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
