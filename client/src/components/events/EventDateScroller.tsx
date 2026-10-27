import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dayDate, localDay, shiftDay } from "@/lib/eventDay";
import "@/styles/event-date-scroller.css";
export function useEventDay() {
  const [day, setDay] = useState(() => localDay(new Date()));
  const lastToday = useRef(localDay(new Date()));
  useEffect(() => {
    const tick = () => {
      const now = localDay(new Date());
      if (now !== lastToday.current) {
        const previous = lastToday.current;
        lastToday.current = now;
        setDay((value) => (value === previous ? now : value));
      }
    };
    const timer = window.setInterval(tick, 60000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, []);
  return [day, setDay] as const;
}
export default function EventDateScroller({
  value,
  onChange,
}: {
  value: string;
  onChange: (day: string) => void;
}) {
  const id = useId(),
    today = localDay(new Date()),
    selected = dayDate(value) || new Date();
  const [draft, setDraft] = useState({ base: value, text: value });
  const input = draft.base === value ? draft.text : value;
  return (
    <div className="cl-event-dates">
      <div className="cl-event-date-tools">
        <div>
          <strong>
            {selected.toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </strong>
          <small>
            Times in {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </small>
        </div>
        <div>
          <button
            type="button"
            onClick={() => onChange(today)}
            disabled={value === today}
          >
            Today
          </button>
          <label htmlFor={id}>
            Choose date
            <input
              id={id}
              type="date"
              value={input}
              min="1900-01-01"
              max="2200-12-31"
              onChange={(e) => {
                const next = e.target.value;
                setDraft({ base: value, text: next });
                if (
                  dayDate(next) &&
                  next >= "1900-01-01" &&
                  next <= "2200-12-31"
                )
                  onChange(next);
              }}
              onBlur={() => {
                if (
                  !dayDate(input) ||
                  input < "1900-01-01" ||
                  input > "2200-12-31"
                )
                  setDraft({ base: value, text: value });
              }}
            />
          </label>
        </div>
      </div>
      <div
        className="cl-event-date-strip"
        role="group"
        aria-label="Choose event day"
      >
        <button
          type="button"
          className="cl-event-date-arrow"
          aria-label="Previous day"
          disabled={value <= "1900-01-01"}
          onClick={() => onChange(shiftDay(value, -1))}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="cl-event-date-days">
          {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
            const key = shiftDay(value, offset),
              date = dayDate(key)!;
            return (
              <button
                type="button"
                key={offset}
                className={Math.abs(offset) > 1 ? "cl-event-date-wide" : ""}
                aria-pressed={key === value}
                aria-current={key === today ? "date" : undefined}
                aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${key === today ? ", today" : ""}`}
                disabled={key < "1900-01-01" || key > "2200-12-31"}
                onClick={() => onChange(key)}
              >
                <span>
                  {date.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <b>{date.getDate().toString().padStart(2, "0")}</b>
                <small>
                  {key === today
                    ? "Today"
                    : date.toLocaleDateString(undefined, { month: "short" })}
                </small>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="cl-event-date-arrow"
          aria-label="Next day"
          disabled={value >= "2200-12-31"}
          onClick={() => onChange(shiftDay(value, 1))}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
