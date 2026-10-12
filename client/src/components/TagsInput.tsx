// components/TagsInput.tsx
import { useState } from "react";

export default function TagsInput({
  value,
  onChange,
  placeholder = "Add a tag",
  max,
  onMaxReached,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  onMaxReached?: () => void;
}) {
  const [draft, setDraft] = useState("");

  const add = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    if (value.includes(t)) return;

    if (typeof max === "number" && value.length >= max) {
      onMaxReached?.();
      setDraft("");
      return;
    }

    onChange([...value, t]);
    setDraft("");
  };

  const remove = (tag: string) => {
    onChange(value.filter((x) => x !== tag));
  };

  return (
    <div className="rounded-md border border-cl-border bg-cl-subtle p-2">
      <div className="flex flex-wrap gap-2">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-cl-subtle text-sm"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-cl-muted hover:text-cl-ink"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-[160px] bg-transparent outline-none text-sm placeholder:text-cl-muted"
        />
      </div>
    </div>
  );
}
