import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { publicSportData, sandboxSportData } from "@/lib/sportRegistration";
import { useSandbox } from "@/pages/organizations/SandboxContext";
type Participant = {
  id: string;
  profileId: string;
  name: string;
  number: string;
};
type Heat = {
  id: string;
  classId: string;
  className: string;
  label: string;
  startsAt: string;
  durationMinutes: number;
  round: number;
  timingBasis: "gun" | "chip";
  distanceMeters: number | null;
  participants: Participant[];
};
type Finish = Participant & {
  status: string;
  position: number | null;
  laps: number;
  elapsedMs: number | null;
  chipTimeMs: number | null;
  penaltyMs: number;
  adjustedMs: number | null;
  points: number;
};
export type PublicOperations = {
  eventId: string;
  organizationId: string;
  sportKey: string;
  workflow: string;
  schedule: Heat[];
  results: { heatId: string; rows: Finish[] }[];
  standings: {
    classId: string;
    className: string;
    rows: {
      profileId: string;
      name: string;
      number: string;
      points: number;
      finishes: number;
    }[];
  }[];
  schedulePublishedAt: string | null;
  resultsPublishedAt: string | null;
};
export function formatFinishTime(ms: number | null): string {
  if (ms == null) return "—";
  const hours = Math.floor(ms / 3600000),
    minutes = Math.floor(ms / 60000) % 60,
    seconds = Math.floor(ms / 1000) % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}
export function validatePublicOperations(
  value: PublicOperations,
  eventId: string,
  sportKey: string,
  organizationId: string,
): PublicOperations {
  if (
    !value ||
    value.eventId !== eventId ||
    value.organizationId !== organizationId ||
    value.sportKey !== sportKey ||
    !Array.isArray(value.schedule) ||
    !Array.isArray(value.results) ||
    !Array.isArray(value.standings)
  )
    throw new Error("Competition information does not match this event.");
  if (
    value.schedule.some(
      (h) =>
        !Array.isArray(h.participants) ||
        !Number.isFinite(Date.parse(h.startsAt)),
    ) ||
    value.results.some(
      (r) =>
        !Array.isArray(r.rows) ||
        r.rows.some(
          (row) =>
            !["finished", "dnf", "dns", "dq"].includes(row.status) ||
            typeof row.profileId !== "string" ||
            typeof row.name !== "string" ||
            !Number.isFinite(row.penaltyMs),
        ),
    ) ||
    value.standings.some((group) => !Array.isArray(group.rows))
  )
    throw new Error("Invalid competition information.");
  return value;
}
export default function SportEventOperations({
  eventId,
  sportKey,
  organizationId,
}: {
  eventId: string;
  sportKey: string;
  organizationId: string;
}) {
  const sandbox = useSandbox();
  const query = useQuery({
    queryKey: [
      "sport-event-operations",
      sandbox?.id,
      sandbox?.account,
      eventId,
      sportKey,
      organizationId,
    ],
    queryFn: async () =>
      validatePublicOperations(
        await (sandbox
          ? sandboxSportData<PublicOperations>(
              sandbox.id,
              `/sport-operations/events/${eventId}`,
            )
          : publicSportData<PublicOperations>(
              `/sport-operations/events/${eventId}`,
            )),
        eventId,
        sportKey,
        organizationId,
      ),
    staleTime: 15_000,
  });
  const data = query.isError ? undefined : query.data;
  const running = data?.workflow === "timed-endurance";
  const athlete = (a: { name: string; profileId: string }) =>
    sandbox ? (
      <span>{a.name}</span>
    ) : (
      <Link
        className="text-cyan-200 underline"
        href={`/racer/${encodeURIComponent(a.profileId)}?sport=${encodeURIComponent(sportKey)}`}
      >
        {a.name}
      </Link>
    );
  return (
    <section
      aria-label="Schedule and results"
      className="space-y-5 rounded-3xl border border-white/10 bg-[#07111f] p-5 sm:p-7"
    >
      <h2 className="text-2xl font-black">
        {running ? "Start waves & finish results" : "Race schedule & results"}
      </h2>
      {query.isLoading ? (
        <p role="status">Loading schedule and results…</p>
      ) : query.isError ? (
        <div role="alert">
          <p>Schedule and results are temporarily unavailable.</p>
          <button
            className="mt-3 min-h-11 rounded-xl border border-white/20 px-4"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </div>
      ) : (
        data && (
          <>
            {!data.schedule.length && (
              <p className="text-slate-300">
                The organizer has not published a schedule yet.
              </p>
            )}
            {data.schedule.map((h) => {
              const result = data.results.find((r) => r.heatId === h.id);
              return (
                <article
                  key={h.id}
                  className="space-y-4 rounded-2xl border border-cyan-200/15 p-4"
                >
                  <h3 className="text-xl font-bold">{h.label}</h3>
                  <p className="text-slate-300">
                    {h.className}
                    {h.distanceMeters
                      ? ` · ${(h.distanceMeters / 1000).toLocaleString()} km`
                      : ""}{" "}
                    · Round {h.round} · {new Date(h.startsAt).toLocaleString()}{" "}
                    ({Intl.DateTimeFormat().resolvedOptions().timeZone}) ·{" "}
                    {h.durationMinutes} minutes
                    {running ? ` · ${h.timingBasis} timing` : ""}
                  </p>
                  <details>
                    <summary className="min-h-11 cursor-pointer py-2 text-cyan-200">
                      {h.participants.length} athletes · View{" "}
                      {running ? "wave" : "race list"}
                    </summary>
                    <ul className="space-y-2">
                      {h.participants.map((a) => (
                        <li key={a.id}>
                          {athlete(a)}
                          {a.number ? ` · #${a.number}` : ""}
                        </li>
                      ))}
                    </ul>
                  </details>
                  {result ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <caption className="mb-3 text-left font-bold">
                          Published results ·{" "}
                          {data.resultsPublishedAt
                            ? new Date(data.resultsPublishedAt).toLocaleString()
                            : ""}
                        </caption>
                        <thead>
                          <tr>
                            <th className="p-2">Place</th>
                            <th className="p-2">Athlete</th>
                            {!running && <th className="p-2">Laps</th>}
                            <th className="p-2">
                              {running ? h.timingBasis : "Elapsed"} time
                            </th>
                            <th className="p-2">Penalty</th>
                            <th className="p-2">Adjusted</th>
                            {!running && <th className="p-2">Points</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rows.map((r) => (
                            <tr key={r.id} className="border-t border-white/10">
                              <td className="p-2">
                                {r.status === "finished"
                                  ? r.position
                                  : r.status.toUpperCase()}
                              </td>
                              <td className="p-2">
                                {athlete(r)}
                                {r.number ? ` · #${r.number}` : ""}
                              </td>
                              {!running && <td className="p-2">{r.laps}</td>}
                              <td className="whitespace-nowrap p-2">
                                {formatFinishTime(
                                  h.timingBasis === "chip"
                                    ? r.chipTimeMs
                                    : r.elapsedMs,
                                )}
                              </td>
                              <td className="p-2">
                                {(r.penaltyMs / 1000).toFixed(3)}s
                              </td>
                              <td className="whitespace-nowrap p-2">
                                {formatFinishTime(r.adjustedMs)}
                              </td>
                              {!running && <td className="p-2">{r.points}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-400">
                      Results have not been published for this{" "}
                      {running ? "wave" : "heat"}.
                    </p>
                  )}
                </article>
              );
            })}
            {!running &&
              data.standings.map((group) => (
                <div key={group.classId} className="space-y-3">
                  <h3 className="font-bold">
                    {group.className} · Event points standings
                  </h3>
                  <ol className="space-y-2">
                    {group.rows.map((a) => (
                      <li key={a.profileId}>
                        {athlete(a)} · {a.points} points · {a.finishes} finishes
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-slate-400">
                    Totals use the published heats for this event. Equal points
                    and finishes are tied.
                  </p>
                </div>
              ))}
          </>
        )
      )}
    </section>
  );
}
