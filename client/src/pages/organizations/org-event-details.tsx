import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";
import { CalendarDays, MapPin, Trophy, Waves, ChevronLeft } from "lucide-react";

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

export default function OrgEventDetailsPage(props: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const eventId = props?.params?.id;

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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03101b] text-white">
      <PageSEO title={`${data?.name || "Event Details"} • Corner League`} />

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_30%),radial-gradient(circle_at_82%_20%,_rgba(59,130,246,0.06),_transparent_24%),linear-gradient(to_bottom,_#04111d_0%,_#03101b_48%,_#020b14_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 pt-16 sm:pt-10">
        {/* Top hero */}
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

        {/* States */}
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
            {/* Main info */}
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

            {/* Placeholder sections */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-300">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="text-lg font-semibold text-white">
                  Event Results
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Final results, podium placements, and class winners can be
                  rendered here next.
                </p>
              </Card>

              <Card className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-300">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="text-lg font-semibold text-white">Classes</div>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Race classes, divisions, brackets, and event structure can
                  plug into this section.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
