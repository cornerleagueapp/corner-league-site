import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";
import {
  CalendarDays,
  MapPin,
  Trophy,
  Waves,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";
import RaceResultsTable, {
  type RaceResults,
} from "@/components/RaceResultsTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type SportEvent = {
  id: string;
  name: string;
  description?: string | null;
  sport?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Division = {
  id: string;
  name: string;
  isWorldFinal?: boolean;
};

type DivisionFinalResult = {
  overallPosition: number;
  participantId: string;
  racerDetailId?: string | null;
  athlete?: {
    id: string;
    name: string;
    age?: number | null;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
  totalPoints: number;
  sumPositions: number;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-300">
        {icon}
      </div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white sm:text-base">
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[28px] border p-6 text-left transition ${
        active
          ? "border-cyan-300/30 bg-cyan-400/[0.08]"
          : "border-white/10 bg-white/[0.03] hover:border-cyan-300/20 hover:bg-white/[0.05]"
      }`}
    >
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-300">
        {icon}
      </div>
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
    </button>
  );
}

function buildRaceResultsData(
  divisionName: string,
  rows: DivisionFinalResult[],
): RaceResults {
  return {
    raceLabel: "Final Results",
    title: divisionName,
    motoLabels: ["Points"],
    rows: rows.map((row) => ({
      rank: row.overallPosition,
      rider: row.athlete?.name || row.team?.name || "Unknown",
      riderHref: row.racerDetailId
        ? `/racer/${encodeURIComponent(String(row.racerDetailId))}`
        : undefined,
      age: row.athlete?.age ?? null,
      bikeNumber: undefined,
      motos: [{ pos: row.totalPoints }],
      finalPos: row.overallPosition,
    })),
  };
}

export default function OrgEventDetailsPage(props: { params: { id: string } }) {
  const eventId = props?.params?.id;
  const [urlVersion, bumpUrlVersion] = React.useReducer((x) => x + 1, 0);

  const searchParams = React.useMemo(() => {
    return new URLSearchParams(window.location.search);
  }, [urlVersion]);

  const activeModal = searchParams.get("modal") || "";
  const activeDivisionId = searchParams.get("division") || "";

  const setModalState = React.useCallback(
    (modal?: string, division?: string) => {
      const params = new URLSearchParams(window.location.search);

      if (modal) {
        params.set("modal", modal);
      } else {
        params.delete("modal");
      }

      if (division) {
        params.set("division", division);
      } else {
        params.delete("division");
      }

      const query = params.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;

      window.history.pushState({}, "", nextUrl);
      bumpUrlVersion();
    },
    [],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/sport-event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const res = await apiFetch(`/sport-event/${eventId}`, { method: "GET" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load event.");
      }

      return (json?.sportEvent ??
        json?.data?.sportEvent ??
        null) as SportEvent | null;
    },
    staleTime: 60_000,
  });

  const {
    data: divisions = [],
    isLoading: divisionsLoading,
    isError: divisionsError,
  } = useQuery({
    queryKey: ["/sport-event/division/event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const res = await apiFetch(
        `/sport-event/division/event/${eventId}?page=1&limit=50`,
        {
          method: "GET",
        },
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load classes.");
      }

      const list = json?.divisions ?? json?.data?.divisions ?? [];
      return Array.isArray(list) ? (list as Division[]) : [];
    },
    staleTime: 60_000,
  });

  const { data: resultsByDivision = {}, isLoading: resultsLoading } = useQuery({
    queryKey: ["/results/final-results-by-division", eventId, divisions],
    enabled: !!eventId && divisions.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        divisions.map(async (division) => {
          const res = await apiFetch(
            `/results/final-results-by-division/${division.id}`,
            { method: "GET" },
          );
          const json = await res.json().catch(() => ({}));

          if (!res.ok) {
            return [division.id, []] as const;
          }

          const list =
            json?.results ?? json?.data?.results ?? json?.data ?? json ?? [];

          return [
            division.id,
            Array.isArray(list) ? (list as DivisionFinalResult[]) : [],
          ] as const;
        }),
      );

      return Object.fromEntries(entries) as Record<
        string,
        DivisionFinalResult[]
      >;
    },
    staleTime: 30_000,
  });

  React.useEffect(() => {
    const onPopState = () => bumpUrlVersion();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03101b] text-white">
      <PageSEO title={`${data?.name || "Event Details"} • Corner League`} />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_30%),radial-gradient(circle_at_82%_20%,_rgba(59,130,246,0.06),_transparent_24%),linear-gradient(to_bottom,_#04111d_0%,_#03101b_48%,_#020b14_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 pt-16 sm:pt-10">
        <div className="relative overflow-hidden rounded-[30px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.94)_0%,rgba(4,17,29,0.98)_100%)] shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.05),_transparent_24%)]" />

          <div className="relative p-5 sm:p-7 lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-4xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  Event details
                </div>

                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                  Aqua • Jet Ski Racing
                </p>

                <h1 className="mt-3 break-words text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  {data?.name || "Event Details"}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  {data?.description ||
                    "Results, divisions, classes, and winners will live here."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white hover:border-cyan-300/30 hover:bg-white/[0.08]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                {data?.sport ? (
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-300">
                      <Waves className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                        Sport
                      </div>
                      <div className="text-lg font-bold text-white">
                        {data.sport}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Card className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-white/70">
            Loading event…
          </Card>
        ) : isError ? (
          <Card className="mt-8 rounded-[28px] border border-red-500/30 bg-red-500/10 p-6 text-white">
            <div className="font-semibold">Failed to load event</div>
            <div className="mt-1 text-sm text-white/75">
              {(error as any)?.message || "Unknown error"}
            </div>
          </Card>
        ) : !data ? (
          <Card className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-white/70">
            Event not found.
          </Card>
        ) : (
          <div className="mt-8 space-y-6">
            <Card className="rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.94)_0%,rgba(4,17,29,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoTile
                  icon={<Waves className="h-5 w-5" />}
                  label="Sport"
                  value={data.sport || "—"}
                />

                <InfoTile
                  icon={<MapPin className="h-5 w-5" />}
                  label="Location"
                  value={data.location || "TBD"}
                />

                <InfoTile
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="Start"
                  value={formatDateTime(data.startDate)}
                />

                <InfoTile
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="End"
                  value={formatDateTime(data.endDate)}
                />
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Description
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/85 sm:text-base">
                  {data.description || "No description provided."}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SectionCard
                icon={<Trophy className="h-5 w-5" />}
                title="Event Results"
                description="View final class standings, podium placements, and winners for this event."
                active={activeModal === "results"}
                onClick={() => setModalState("results", divisions[0]?.id)}
              />

              <SectionCard
                icon={<CalendarDays className="h-5 w-5" />}
                title="Classes"
                description="View all classes/divisions attached to this event."
                active={activeModal === "classes"}
                onClick={() => setModalState("classes")}
              />
            </div>

            <Dialog
              open={activeModal === "results"}
              onOpenChange={(open) => {
                if (!open) setModalState();
              }}
            >
              <DialogContent className="max-w-6xl border-white/10 bg-[#07131f] text-white">
                <DialogHeader>
                  <DialogTitle>Event Results</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Final class standings for this event.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[75vh] overflow-y-auto space-y-4 pr-1">
                  {divisions.map((division) => {
                    const rows = resultsByDivision[division.id] || [];
                    if (rows.length === 0) return null;

                    const isOpen = activeDivisionId === division.id;

                    return (
                      <div
                        key={division.id}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            isOpen
                              ? setModalState("results")
                              : setModalState("results", division.id)
                          }
                          className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-white/[0.04]"
                        >
                          <div>
                            <div className="text-base font-semibold text-white">
                              {division.name}
                            </div>
                            <div className="mt-1 text-xs text-white/50">
                              {rows.length} ranked result
                              {rows.length === 1 ? "" : "s"}
                            </div>
                          </div>

                          <ChevronDown
                            className={`h-5 w-5 text-white/60 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="border-t border-white/10 p-4">
                            <RaceResultsTable
                              data={buildRaceResultsData(division.name, rows)}
                              showFinalOnDesktop
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={activeModal === "classes"}
              onOpenChange={(open) => {
                if (!open) setModalState();
              }}
            >
              <DialogContent className="max-w-3xl border-white/10 bg-[#07131f] text-white">
                <DialogHeader>
                  <DialogTitle>Classes</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Classes/divisions attached to this event.
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-1">
                  {divisionsLoading ? (
                    <div className="text-sm text-white/60">
                      Loading classes…
                    </div>
                  ) : divisions.length === 0 ? (
                    <div className="text-sm text-white/60">
                      No classes found for this event.
                    </div>
                  ) : (
                    divisions.map((division) => (
                      <div
                        key={division.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
                      >
                        <div className="font-medium text-white">
                          {division.name}
                        </div>
                        <div className="mt-1 text-xs text-white/50">
                          {division.isWorldFinal ? "World Finals" : "Class"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
