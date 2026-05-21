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
      className={`min-w-0 overflow-hidden rounded-[26px] border border-cyan-300/10 bg-[#07111F]/80 shadow-[0_18px_50px_rgba(0,0,0,0.24)] ${className}`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full min-w-0 items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-cyan-300/[0.045] sm:px-5"
      >
        <span className="min-w-0 break-words text-xs font-black uppercase tracking-[0.16em] text-white/80 transition group-hover:text-cyan-100">
          {open ? labelHide || "Hide" : labelShow}
        </span>

        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
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
          className="border-t border-white/10 px-4 pb-5 pt-4 text-sm leading-7 text-slate-300 sm:px-5"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
