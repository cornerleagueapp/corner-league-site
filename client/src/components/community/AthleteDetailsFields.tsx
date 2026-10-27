type Details = {
  height?: number | null;
  weight?: number | null;
  school?: string | null;
};
export default function AthleteDetailsFields({
  value,
  onChange,
  disabled = false,
}: {
  value: Details;
  onChange: (details: Details) => void;
  disabled?: boolean;
}) {
  const input =
    "mt-2 min-h-11 w-full min-w-0 rounded-xl border border-cl-border bg-cl-surface p-3 text-cl-ink";
  return (
    <fieldset disabled={disabled} className="space-y-4 min-w-0">
      <legend className="font-semibold">Athlete details</legend>
      <p className="text-sm text-cl-muted">
        Optional public profile details. Add your current or former school, if
        applicable.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          Height (inches)
          <input
            className={input}
            type="number"
            inputMode="decimal"
            min="12"
            max="118"
            step="0.1"
            value={
              value.height == null
                ? ""
                : Math.round((value.height / 0.0254) * 10) / 10
            }
            onChange={(e) =>
              onChange({
                ...value,
                height:
                  e.target.value === ""
                    ? null
                    : Number(e.target.value) * 0.0254,
              })
            }
          />
        </label>
        <label>
          Weight (lb)
          <input
            className={input}
            type="number"
            inputMode="decimal"
            min="3"
            max="1543"
            step="0.1"
            value={
              value.weight == null
                ? ""
                : Math.round((value.weight / 0.45359237) * 10) / 10
            }
            onChange={(e) =>
              onChange({
                ...value,
                weight:
                  e.target.value === ""
                    ? null
                    : Number(e.target.value) * 0.45359237,
              })
            }
          />
        </label>
      </div>
      <label className="block">
        School attended / attending
        <input
          className={input}
          maxLength={160}
          value={value.school ?? ""}
          onChange={(e) => onChange({ ...value, school: e.target.value })}
        />
      </label>
    </fieldset>
  );
}
