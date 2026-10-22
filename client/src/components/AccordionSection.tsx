// components/AccordionSection.tsx
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  labelShow: string;
  labelHide?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

export default function AccordionSection({
  labelShow,
  labelHide = "Hide",
  defaultOpen = false,
  children,
  className = "",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [maxH, setMaxH] = useState<number>(0);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const resize = () => setMaxH(el.scrollHeight);
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-[26px] border border-cl-accent/10 bg-cl-surface shadow-cl-panel ${className}`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full min-w-0 items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-cl-accent/[0.045] sm:px-5"
      >
        <span className="min-w-0 break-words text-xs font-black uppercase tracking-[0.16em] text-cl-ink transition group-hover:text-cl-accent">
          {open ? labelHide || "Hide" : labelShow}
        </span>

        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      <div
        style={{ maxHeight: open ? maxH : 0 }}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      >
        <div
          ref={panelRef}
          className="border-t border-cl-border px-4 pb-5 pt-4 text-sm leading-7 text-cl-muted sm:px-5"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
