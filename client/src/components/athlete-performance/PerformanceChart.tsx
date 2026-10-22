import { useId, useState } from "react";
import {
  performanceTrend,
  displayMetric,
  type PerformanceResult,
} from "@/lib/athletePerformance";
export default function PerformanceChart({
  rows,
}: {
  rows: PerformanceResult[];
}) {
  const [metric, setMetric] = useState<"finish" | "points">("finish"),
    id = useId(),
    points = performanceTrend(rows, metric);
  const values = points.map((p) => p.value),
    low = metric === "finish" ? 1 : Math.min(0, ...values),
    high = Math.max(low + 1, ...values);
  const coords = points.map((point, index) => ({
    x: 40 + (index * 560) / Math.max(1, points.length - 1),
    y:
      metric === "finish"
        ? 30 + ((point.value - low) / (high - low)) * 130
        : 160 - ((point.value - low) / (high - low)) * 130,
    point,
  }));
  const date = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return (
    <section className="athlete-panel athlete-trend">
      <header className="athlete-panel-heading">
        <div>
          <h2>Season trend</h2>
          <p>
            {metric === "finish"
              ? "Classified overall finishes · lower is better"
              : "Cumulative recorded overall points"}
          </p>
        </div>
        <div className="athlete-chart-toggle" aria-label="Chart metric">
          <button
            type="button"
            aria-pressed={metric === "finish"}
            onClick={() => setMetric("finish")}
          >
            Finishes
          </button>
          <button
            type="button"
            aria-pressed={metric === "points"}
            onClick={() => setMetric("points")}
          >
            Points
          </button>
        </div>
      </header>
      {!points.length ? (
        <p className="athlete-empty">
          No dated {metric === "finish" ? "classified finishes" : "points"} for
          these filters.
        </p>
      ) : (
        <>
          <svg
            viewBox="0 0 640 210"
            role="img"
            aria-labelledby={`${id}-title ${id}-description`}
            className="athlete-trend-chart"
          >
            <title id={`${id}-title`}>
              {metric === "finish"
                ? "Overall finish trend"
                : "Cumulative points trend"}
            </title>
            <desc id={`${id}-description`}>
              {points.length} recorded results in event-date order.{" "}
              {metric === "finish"
                ? "First place is at the top."
                : "Points accumulate across the selected classes."}{" "}
              Exact values are available below.
            </desc>
            {[30, 95, 160].map((y) => (
              <line
                key={y}
                x1="40"
                y1={y}
                x2="600"
                y2={y}
                stroke="currentColor"
                opacity=".14"
              />
            ))}
            <text x="10" y="34">
              {displayMetric(metric === "finish" ? low : high, 0)}
            </text>
            <text x="10" y="164">
              {displayMetric(metric === "finish" ? high : low, 0)}
            </text>
            {coords.length > 1 && (
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                points={coords.map((p) => `${p.x},${p.y}`).join(" ")}
              />
            )}
            {coords.map(({ x, y, point }) => (
              <circle key={point.id} cx={x} cy={y} r="4" fill="currentColor">
                <title>{`${date(point.date)} · ${point.event}: ${point.value}`}</title>
              </circle>
            ))}
            <text x="40" y="195">
              {date(points[0].date)}
            </text>
            <text x="600" y="195" textAnchor="end">
              {date(points.at(-1)!.date)}
            </text>
          </svg>
          <details className="athlete-chart-data">
            <summary>View chart values ({points.length})</summary>
            <ol>
              {points.map((p) => (
                <li key={p.id}>
                  <span>
                    {date(p.date)} · {p.event}
                  </span>
                  <strong>
                    {metric === "finish" ? "P" : ""}
                    {displayMetric(p.value, 0)}
                    {metric === "points" ? " pts" : ""}
                  </strong>
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
      <p className="athlete-method-note">
        Last 24 recorded results, ordered by event start date. Overall class
        points are combined for the selected filters; this is not an official
        championship standing.
      </p>
    </section>
  );
}
