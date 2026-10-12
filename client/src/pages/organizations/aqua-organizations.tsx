import React, { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchAllSportOrganizations } from "@/lib/sportOrganizations";
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

  const isAdminSelection =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("adminSelect") === "1";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/sports/catalog/jet-ski/organizations"],
    queryFn: async ({ signal }) =>
      fetchAllSportOrganizations("jet-ski", signal),
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
    <div className="relative min-h-screen overflow-x-hidden bg-cl-canvas text-cl-ink">
      <PageSEO
        title="AQUA Organizations • Corner League Sports"
        description="Explore official jet ski racing organizations, sanctioning bodies, race schedules, and event coverage."
        canonicalPath="/aqua-organizations"
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-cl-accent/[0.08] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[88rem] px-3 pb-12 pt-16 sm:px-6 lg:px-8 lg:pt-10">
        {/* Hero / header */}
        <div className="relative overflow-hidden rounded-[30px] border border-cl-accent/10 cl-panel-wash shadow-cl-panel sm:rounded-[38px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cl-accent/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-cl-accent/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-10">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  <span className="h-2 w-2 rounded-full bg-cl-accent shadow-cl-panel" />
                  Official Race Organizations
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
                  Jet Ski Racing
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cl-accent">
                  {isAdminSelection
                    ? "Corner League • Organization Administration"
                    : "Aqua • Sanctioning Bodies • Race Series"}
                </p>

                <h1 className="text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-cl-ink min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                  {isAdminSelection ? "SELECT " : "AQUA "}
                  <span className="cl-title-accent">Organization</span>
                </h1>

                <p className="max-w-2xl text-sm leading-7 text-cl-muted sm:text-base">
                  {isAdminSelection
                    ? "Choose an organization to enter its administration console and manage events, registrations, race scheduling, payments, results, members, and settings."
                    : "Explore sanctioning bodies and race organizations with a more modern, event-driven viewing experience. Select an organization to see its details, branding, and competition information."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={() => navigate("/scores/aqua")}
                className="inline-flex items-center justify-center rounded-full border border-cl-border bg-cl-subtle px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-cl-muted transition hover:border-cl-accent/25 hover:bg-cl-accent/10 hover:text-cl-ink"
              >
                ← Back to Aqua Home
              </button>

              <div className="inline-flex items-center gap-3 rounded-[24px] border border-cl-accent/10 bg-cl-subtle px-4 py-3 text-left shadow-cl-panel">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cl-accent/10 text-cl-accent shadow-[inset_0_0_0_1px_rgba(34,211,238,0.15)]">
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
                  <div className="text-[11px] uppercase tracking-[0.2em] text-cl-muted">
                    Total
                  </div>
                  <div className="text-sm font-bold text-cl-ink">
                    {orgs.length} organization{orgs.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* States */}
        {isLoading ? (
          <div className="mt-8 overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel sm:p-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-cl-accent/10" />
              <div className="space-y-2">
                <div className="h-4 w-44 animate-pulse rounded bg-cl-subtle" />
                <div className="h-3 w-64 animate-pulse rounded bg-cl-subtle" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-[24px] border border-cl-accent/10 bg-cl-subtle p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 animate-pulse rounded-2xl bg-cl-subtle" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-40 animate-pulse rounded bg-cl-subtle" />
                      <div className="h-4 w-24 animate-pulse rounded bg-cl-subtle" />
                      <div className="h-4 w-full animate-pulse rounded bg-cl-subtle" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-cl-subtle" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="mt-8 rounded-[30px] border border-red-400/25 bg-red-500/10 p-6 text-cl-ink shadow-cl-panel sm:p-8">
            <div className="mb-1 text-lg font-semibold">
              Failed to load organizations
            </div>
            <div className="text-sm text-cl-ink">
              {(error as any)?.message ?? "Unknown error"}
            </div>
          </div>
        ) : orgs.length === 0 ? (
          <div className="mt-8 rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 text-cl-muted shadow-cl-panel sm:p-8">
            No organizations found.
          </div>
        ) : (
          <div className="mt-8">
            {/* Section heading */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                  Browse
                </p>
                <h2 className="mt-1 text-3xl font-black uppercase tracking-[-0.03em] text-cl-ink sm:text-4xl">
                  Race Organizations
                </h2>
                <p className="mt-2 text-sm leading-7 text-cl-muted">
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

                    if (isAdminSelection) {
                      navigate(
                        `/organizations/${encodeURIComponent(o.id)}/admin`,
                      );
                      return;
                    }

                    navigate(`/aqua-organizations/${o.id}`);
                  }}
                  className="group relative min-w-0 w-full overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface p-5 text-left shadow-cl-panel transition duration-300 hover:-translate-y-1 hover:border-cl-accent/25 hover:bg-cl-accent/[0.045] focus:outline-none focus:ring-2 focus:ring-cl-accent/30 sm:p-6"
                >
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-cl-accent/10 blur-3xl transition duration-300 group-hover:bg-cl-accent/15" />
                    <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-cl-accent/[0.08] blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px]" />
                  </div>

                  <div className="relative">
                    {/* top badges */}
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cl-accent">
                        <span className="h-1.5 w-1.5 rounded-full bg-cl-accent shadow-cl-panel" />
                        Organization
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cl-muted">
                          #{String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cl-border bg-cl-subtle text-cl-accent transition group-hover:border-cl-accent/30 group-hover:bg-cl-accent/10">
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
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-cl-accent/10 bg-cl-subtle shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] sm:h-24 sm:w-24">
                        {o.logoUrl ? (
                          <img
                            src={o.logoUrl}
                            alt={`${o.name} logo`}
                            className="h-full w-full object-contain p-3"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(255,255,255,0.02))] text-center">
                            <span className="px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-cl-muted">
                              No Logo
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="min-w-0 break-words text-xl font-black uppercase leading-tight tracking-[-0.02em] text-cl-ink sm:text-2xl">
                            {o.name}
                          </h3>

                          {o.abbreviation ? (
                            <span className="rounded-full border border-cl-accent/20 bg-cl-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cl-accent">
                              {o.abbreviation}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-cl-muted">
                          {o.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0 rounded-2xl border border-cl-border bg-cl-subtle px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-cl-muted">
                          Type
                        </div>
                        <div className="mt-1 text-sm font-semibold text-cl-ink">
                          Race Organization
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-cl-border bg-cl-subtle px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-cl-muted">
                          Details
                        </div>
                        <div className="mt-1 text-sm font-semibold text-cl-accent">
                          {isAdminSelection
                            ? "Open Admin Console"
                            : "View Profile"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-cl-border pt-4">
                      <p className="min-w-0 break-all text-[10px] uppercase tracking-[0.16em] text-cl-muted">
                        ID: {o.id}
                      </p>
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
