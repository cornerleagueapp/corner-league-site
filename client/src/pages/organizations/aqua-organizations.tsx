import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

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
      const res = await apiFetch("/organizations", { method: "GET" });

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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03101f] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.06),_transparent_24%),linear-gradient(to_bottom,_#04111d_0%,_#03101b_48%,_#020b14_100%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-cyan-400/6 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[88rem] px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pt-10">
        {/* Hero / header */}
        <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(10,26,43,0.92)_0%,rgba(5,18,33,0.96)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.10),_transparent_26%)]" />

          <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-10">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                Official race organizations
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
                  Aqua • Jet Ski Racing
                </p>

                <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  AQUA Organizations
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
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
              >
                ← Back to Aqua Home
              </button>

              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left">
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
                  <div className="text-lg font-bold text-white">
                    {orgs.length} organization{orgs.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* States */}
        {isLoading ? (
          <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
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
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
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
          <div className="mt-8 rounded-[28px] border border-red-500/25 bg-red-500/10 p-6 text-white sm:p-8">
            <div className="mb-1 text-lg font-semibold">
              Failed to load organizations
            </div>
            <div className="text-sm text-white/80">
              {(error as any)?.message ?? "Unknown error"}
            </div>
          </div>
        ) : orgs.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-white/70 sm:p-8">
            No organizations found.
          </div>
        ) : (
          <div className="mt-8">
            {/* Section heading */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
                  Browse
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  Race Organizations
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Browse all professional Jet Ski racing organizations
                </p>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {orgs.map((o, index) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => navigate(`/aqua-organizations/${o.id}`)}
                  className="group relative w-full overflow-hidden rounded-[26px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(10,26,43,0.92)_0%,rgba(7,19,33,0.98)_100%)] p-5 text-left shadow-[0_15px_40px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:shadow-[0_25px_60px_rgba(0,0,0,0.34)] focus:outline-none focus:ring-2 focus:ring-cyan-300/40 sm:p-6"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.10),_transparent_26%)] opacity-80" />
                  <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-cyan-400/10 blur-2xl transition duration-300 group-hover:bg-cyan-300/15" />

                  <div className="relative">
                    {/* top badges */}
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
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
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] sm:h-24 sm:w-24">
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
                          <h3 className="truncate text-lg font-bold tracking-tight text-white sm:text-[1.35rem]">
                            {o.name}
                          </h3>

                          {o.abbreviation ? (
                            <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/85">
                              {o.abbreviation}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-300">
                          {o.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                          Type
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white">
                          Race Organization
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                          Details
                        </div>
                        <div className="mt-1 text-sm font-semibold text-cyan-300">
                          View Profile
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                      <p className="truncate text-[11px] uppercase tracking-[0.18em] text-white/35">
                        ID: {o.id}
                      </p>

                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition group-hover:text-cyan-200">
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
                      </span>
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
