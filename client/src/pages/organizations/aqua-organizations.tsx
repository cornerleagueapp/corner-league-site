import React, { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { trackContentEngagementToBackend } from "@/lib/contentEngagementApi";
import { PageSEO } from "@/seo/usePageSEO";

type Organization = {
  id: string;
  name: string;
  abbreviation?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function AquaOrganizationsPage() {
  const [, navigate] = useLocation();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/organizations"],
    queryFn: async () => {
      const res = await apiFetch("/organizations", {
        method: "GET",
        skipAuth: true,
        noRefresh: true,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to load organizations.");
      }

      const json = await res.json();

      const list =
        json?.data?.organizations ??
        json?.organizations ??
        json?.data?.items ??
        json?.items ??
        [];

      return Array.isArray(list) ? list : [];
    },
    staleTime: 60_000,
  });

  const orgs = (data ?? []) as Organization[];

  useEffect(() => {
    if (isLoading || isError) return;

    trackEvent(AnalyticsEvents.ORGANIZATIONS_LIST_VIEWED, {
      organization_count: orgs.length,
      sport: "jet_ski",
      page_type: "organizations_list",
    });
  }, [isLoading, isError, orgs.length]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] text-white">
      <PageSEO
        title="AQUA Organizations • Corner League Sports"
        description="Explore official jet ski racing organizations, sanctioning bodies, race schedules, and event coverage."
        canonicalPath="/aqua-organizations"
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-cyan-400/8 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[88rem] px-3 pb-12 pt-16 sm:px-6 lg:px-8 lg:pt-10">
        {/* Hero / header */}
        <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(4,10,19,0.98)_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:rounded-[38px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-10">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Official Race Organizations
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199] sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  Jet Ski Racing
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/65">
                  Aqua • Sanctioning Bodies • Race Series
                </p>

                <h1 className="text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                  AQUA{" "}
                  <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#FF7849_100%)] bg-clip-text text-transparent">
                    Organizations
                  </span>
                </h1>

                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Explore sanctioning bodies and race organizations with a more
                  modern, event-driven viewing experience. Select an
                  organization to see its details, branding, and competition
                  information.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={() => navigate("/scores/aqua")}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/75 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
              >
                ← Back to Aqua Home
              </button>

              <div className="inline-flex items-center gap-3 rounded-[24px] border border-cyan-300/10 bg-white/[0.04] px-4 py-3 text-left shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.15)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12h18" />
                    <path d="M12 3v18" />
                  </svg>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Total
                  </div>
                  <div className="text-sm font-bold text-white">
                    {orgs.length} organization{orgs.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* States */}
        {isLoading ? (
          <div className="mt-8 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-cyan-400/10" />
              <div className="space-y-2">
                <div className="h-4 w-44 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-64 animate-pulse rounded bg-white/5" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 animate-pulse rounded-2xl bg-white/10" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
                      <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="mt-8 rounded-[30px] border border-red-400/25 bg-red-500/10 p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="mb-1 text-lg font-semibold">
              Failed to load organizations
            </div>
            <div className="text-sm text-white/80">
              {(error as any)?.message ?? "Unknown error"}
            </div>
          </div>
        ) : orgs.length === 0 ? (
          <div className="mt-8 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 text-slate-300 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
            No organizations found.
          </div>
        ) : (
          <div className="mt-8">
            {/* Section heading */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/65">
                  Browse
                </p>
                <h2 className="mt-1 text-3xl font-black uppercase tracking-[-0.03em] text-white sm:text-4xl">
                  Race Organizations
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Browse professional jet ski racing organizations, sanctioning
                  bodies, and event series.
                </p>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {orgs.map((o, index) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.ORGANIZATION_CLICKED, {
                      organization_id: o.id,
                      organization_name: o.name,
                      organization_abbreviation: o.abbreviation ?? null,
                      sport: "jet_ski",
                      source_page: "organizations_list",
                      card_position: index + 1,
                    });

                    void trackContentEngagementToBackend({
                      contentType: "organization",
                      action: "organization_clicked",
                      contentId: o.id,
                      contentName: o.name,
                      organizationId: o.id,
                      organizationName: o.name,
                      sport: "jet_ski",
                      sourcePage: "organizations_list",
                    }).catch(() => {});

                    navigate(`/aqua-organizations/${o.id}`);
                  }}
                  className="group relative min-w-0 w-full overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-5 text-left shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-cyan-300/[0.045] focus:outline-none focus:ring-2 focus:ring-cyan-300/30 sm:p-6"
                >
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl transition duration-300 group-hover:bg-cyan-300/15" />
                    <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-[#FF6B35]/8 blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px]" />
                  </div>

                  <div className="relative">
                    {/* top badges */}
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                        Organization
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                          #{String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-300 transition group-hover:border-cyan-300/30 group-hover:bg-cyan-400/10">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 transition group-hover:translate-x-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14" />
                            <path d="m13 5 7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-cyan-300/10 bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] sm:h-24 sm:w-24">
                        {o.logoUrl ? (
                          <img
                            src={o.logoUrl}
                            alt={`${o.name} logo`}
                            className="h-full w-full object-contain p-3"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(255,255,255,0.02))] text-center">
                            <span className="px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                              No Logo
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="min-w-0 break-words text-xl font-black uppercase leading-tight tracking-[-0.02em] text-white sm:text-2xl">
                            {o.name}
                          </h3>

                          {o.abbreviation ? (
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                              {o.abbreviation}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-300">
                          {o.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                          Type
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white">
                          Race Organization
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                          Details
                        </div>
                        <div className="mt-1 text-sm font-semibold text-cyan-300">
                          View Profile
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                      <p className="min-w-0 break-all text-[10px] uppercase tracking-[0.16em] text-white/35">
                        ID: {o.id}
                      </p>

                      {/* <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition group-hover:text-cyan-200">
                        Open organization
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 transition group-hover:translate-x-0.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7 17 17 7" />
                          <path d="M8 7h9v9" />
                        </svg>
                      </span> */}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
