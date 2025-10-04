import React, { useEffect, useRef, useState } from "react";

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
      className={`rounded-2xl border border-white/10 bg-white/5 ${className}`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/10 rounded-2xl"
      >
        {open ? labelHide || "Hide" : labelShow}
      </button>

      <div
        style={{ maxHeight: open ? maxH : 0 }}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      >
        <div ref={panelRef} className="px-4 pb-4 pt-2 text-white/80">
          {children}
        </div>
      </div>
    </div>
  );
}
