import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";
import { useLocation } from "wouter";
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

import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackContentEngagementToBackend } from "@/lib/contentEngagementApi";

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
    <div className="min-w-0 rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
        {icon}
      </div>

      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>

      <div className="mt-1 min-w-0 break-words text-sm font-black uppercase leading-snug text-white sm:text-base">
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
      className={`group relative min-w-0 overflow-hidden rounded-[30px] border p-5 text-left shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 sm:p-6 ${
        active
          ? "border-cyan-300/30 bg-cyan-300/[0.1]"
          : "border-cyan-300/10 bg-[#07111F]/80 hover:border-cyan-300/25 hover:bg-cyan-300/[0.045]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 top-0 h-52 w-52 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px]" />
      </div>

      <div className="relative">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
          {icon}
        </div>

        <div className="break-words text-xl font-black uppercase leading-tight tracking-[-0.02em] text-white">
          {title}
        </div>

        <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>

        <div className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
          Open Section
          <ChevronDown className="h-4 w-4 -rotate-90 transition group-hover:translate-x-1" />
        </div>
      </div>
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
  const [, navigate] = useLocation();

  const searchParams = React.useMemo(() => {
    return new URLSearchParams(window.location.search);
  }, [urlVersion]);

  const orgIdFromQuery = searchParams.get("orgId") || "";
  const activeModal = searchParams.get("modal") || "";
  const activeDivisionId = searchParams.get("division") || "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/sport-event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const res = await apiFetch(`/sport-event/${eventId}`, {
        method: "GET",
        skipAuth: true,
        noRefresh: true,
      });
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
          skipAuth: true,
          noRefresh: true,
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
            {
              method: "GET",
              skipAuth: true,
              noRefresh: true,
            },
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

  const setModalState = React.useCallback(
    (modal?: string, division?: string) => {
      if (modal) {
        trackEvent(AnalyticsEvents.EVENT_SECTION_OPENED, {
          event_id: eventId,
          event_name: data?.name ?? null,
          modal,
          division_id: division ?? null,
          organization_id: orgIdFromQuery || null,
          sport: data?.sport ?? "jet_ski",
          source_page: "event_details",
        });

        if (division) {
          const selectedDivision = divisions.find((d) => d.id === division);

          trackEvent(AnalyticsEvents.DIVISION_RESULT_VIEWED, {
            event_id: eventId,
            event_name: data?.name ?? null,
            organization_id: orgIdFromQuery || null,
            division_id: division,
            division_name: selectedDivision?.name ?? null,
            sport: data?.sport ?? "jet_ski",
            source_page: "event_details",
          });

          void trackContentEngagementToBackend({
            contentType: "division",
            action: "division_result_viewed",
            contentId: division,
            contentName: selectedDivision?.name ?? null,
            divisionId: division,
            divisionName: selectedDivision?.name ?? null,
            eventId,
            eventName: data?.name ?? null,
            organizationId: orgIdFromQuery || null,
            organizationName: null,
            sport: data?.sport ?? "jet_ski",
            sourcePage: "event_details",
          }).catch(() => {});
        }
      }

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
    [eventId, orgIdFromQuery, data?.id, data?.name, data?.sport, divisions],
  );

  React.useEffect(() => {
    const onPopState = () => bumpUrlVersion();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  React.useEffect(() => {
    if (!data) return;

    trackEvent(AnalyticsEvents.EVENT_DETAILS_VIEWED, {
      event_id: data.id,
      event_name: data.name,
      organization_id: orgIdFromQuery || null,
      sport: data.sport ?? "jet_ski",
      location: data.location ?? null,
      start_date: data.startDate,
      end_date: data.endDate,
      page_type: "event_details",
    });

    void trackContentEngagementToBackend({
      contentType: "event",
      action: "event_details_viewed",
      contentId: data.id,
      contentName: data.name,
      eventId: data.id,
      eventName: data.name,
      organizationId: orgIdFromQuery || null,
      organizationName: null,
      sport: data.sport ?? "jet_ski",
      sourcePage: "event_details",
    }).catch(() => {});
  }, [data?.id, orgIdFromQuery]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] text-white">
      <PageSEO
        title={`${data?.name || "Event Details"} • Corner League Sports`}
        description="View event details, classes, divisions, final standings, and official jet ski racing results."
        canonicalPath={
          eventId ? `/aqua-organizations/event-details/${eventId}` : undefined
        }
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-cyan-400/8 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-3 py-10 pt-16 sm:px-6 sm:pt-10 lg:px-8">
        <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(4,10,19,0.98)_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:rounded-[38px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative p-5 sm:p-7 lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-4xl">
                <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                    <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                    Event Details
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199] sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                    Official Results
                  </div>
                </div>

                <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/65">
                  Aqua • Jet Ski Racing • Event Coverage
                </p>

                <h1 className="mt-3 max-w-full break-words text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                  {data?.name || "Event Details"}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  {data?.description ||
                    "Results, divisions, classes, and winners will live here."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Button
                  onClick={() => {
                    if (orgIdFromQuery) {
                      navigate(
                        `/aqua-organizations/${encodeURIComponent(orgIdFromQuery)}`,
                      );
                      return;
                    }

                    navigate("/aqua-organizations");
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/75 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                {data?.sport ? (
                  <div className="inline-flex items-center gap-3 rounded-[24px] border border-cyan-300/10 bg-white/[0.04] px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
                      <Waves className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                        Sport
                      </div>
                      <div className="text-sm font-bold text-white">
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
          <Card className="mt-8 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 text-slate-300 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            Loading event…
          </Card>
        ) : isError ? (
          <Card className="mt-8 rounded-[30px] border border-red-400/25 bg-red-500/10 p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="font-semibold">Failed to load event</div>
            <div className="mt-1 text-sm text-white/75">
              {(error as any)?.message || "Unknown error"}
            </div>
          </Card>
        ) : !data ? (
          <Card className="mt-8 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 text-slate-300 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            Event not found.
          </Card>
        ) : (
          <div className="mt-8 space-y-6">
            <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-6">
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

              <div className="mt-6 rounded-[24px] border border-cyan-300/10 bg-black/25 p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
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
              <DialogContent className="max-w-6xl overflow-hidden border-cyan-300/10 bg-[#07111F] text-white shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                    Event Results
                  </DialogTitle>
                  <DialogDescription className="text-slate-300">
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
                        className="overflow-hidden rounded-[24px] border border-cyan-300/10 bg-black/25"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            isOpen
                              ? setModalState("results")
                              : setModalState("results", division.id)
                          }
                          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-cyan-300/[0.045]"
                        >
                          <div>
                            <div className="break-words text-base font-black uppercase tracking-[-0.01em] text-white">
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
              <DialogContent className="max-w-3xl overflow-hidden border-cyan-300/10 bg-[#07111F] text-white shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                    Classes
                  </DialogTitle>
                  <DialogDescription className="text-slate-300">
                    Classes attached to this event.
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
                        className="rounded-[24px] border border-cyan-300/10 bg-black/25 px-4 py-4"
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
