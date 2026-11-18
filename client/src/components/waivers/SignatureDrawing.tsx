import { useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";

type Point = [number, number];
export type SignatureStrokes = Point[][];
export function hasDrawing(strokes: SignatureStrokes) {
  return strokes.some((stroke) =>
    stroke.some(
      ([x, y]) => Math.hypot(x - stroke[0][0], y - stroke[0][1]) >= 8,
    ),
  );
}
export function SignatureDrawing({
  strokes,
  onChange,
  disabled,
}: {
  strokes: SignatureStrokes;
  onChange: (value: SignatureStrokes) => void;
  disabled: boolean;
}) {
  const active = useRef<{ id: number; points: Point[] } | null>(null);
  const [preview, setPreview] = useState<Point[]>([]);
  const count = strokes.reduce((sum, line) => sum + line.length, 0);
  const full = strokes.length >= 32 || count + 2 > 2048;
  const point = (event: PointerEvent<SVGSVGElement>): Point => {
    const box = event.currentTarget.getBoundingClientRect();
    const scale = (n: number) =>
      Math.round(Math.min(1000, Math.max(0, n * 1000)));
    return [
      scale((event.clientX - box.left) / box.width),
      scale((event.clientY - box.top) / box.height),
    ];
  };
  function move(event: PointerEvent<SVGSVGElement>) {
    const line = active.current;
    if (!line || event.pointerId !== line.id || disabled) return;
    const p = point(event),
      last = line.points[line.points.length - 1];
    if (p[0] === last[0] && p[1] === last[1]) return;
    if (line.points.length < Math.min(256, 2048 - count)) line.points.push(p);
    else line.points[line.points.length - 1] = p;
    setPreview([...line.points]);
  }
  function cancel() {
    active.current = null;
    setPreview([]);
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Draw with your finger, mouse, or stylus.
      </p>
      <svg
        role="img"
        aria-label="Signature drawing area. Choose Type signature for keyboard entry."
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="block h-32 w-full touch-none select-none rounded-xl border border-border bg-background text-foreground"
        onPointerDown={(event) => {
          if (disabled || full || active.current || event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          active.current = { id: event.pointerId, points: [point(event)] };
        }}
        onPointerMove={move}
        onPointerUp={(event) => {
          if (active.current?.id !== event.pointerId) return;
          move(event);
          const line = active.current.points;
          if (line.length > 1 && !disabled) onChange([...strokes, line]);
          cancel();
        }}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
      >
        <line
          x1="36"
          x2="964"
          y1="780"
          y2="780"
          stroke="currentColor"
          opacity=".25"
          vectorEffect="non-scaling-stroke"
        />
        {[...strokes, preview].map((line, i) => (
          <polyline
            key={i}
            points={line.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || !count}
        onClick={() => {
          cancel();
          onChange([]);
        }}
      >
        Clear drawing
      </Button>
      {full && (
        <p role="status" className="text-sm text-muted-foreground">
          Drawing limit reached. Clear it to start over.
        </p>
      )}
    </div>
  );
}
