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

function getOrgFromResponse(json: any): Organization | null {
  return json?.organization ?? json?.data?.organization ?? null;
}

export default function AquaOrganizationDetailsPage(props: {
  params: { id: string };
}) {
  const [, navigate] = useLocation();
  const orgId = props?.params?.id;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/organizations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const res = await apiFetch(`/organizations/${orgId}`, { method: "GET" });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Failed to load organization.");
      }

      const org = getOrgFromResponse(json);
      if (!org) throw new Error("Organization not found in response.");
      return org;
    },
    staleTime: 60_000,
  });

  const org = data as Organization | undefined;

  return (
    <div className="mx-auto w-full max-w-[80rem] overflow-x-hidden px-4 sm:px-6 pt-16 sm:pt-10 pb-6">
      <div className="mb-6 flex items-start sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">
            Jet Ski
          </p>
          <h1 className="text-2xl font-bold text-white truncate">
            {org?.name || "Organization"}
          </h1>
          <p className="text-sm text-white/70">News • Schedule • Results</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/aqua-organizations")}
          className="shrink-0 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
        >
          ← Back
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Loading organization…
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-white">
          <div className="font-semibold mb-1">Failed to load organization</div>
          <div className="text-sm text-white/80">
            {(error as any)?.message ?? "Unknown error"}
          </div>
        </div>
      ) : !org ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Organization not found.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={`${org.name} logo`}
                  className="h-full w-full object-contain p-2"
                  loading="lazy"
                />
              ) : (
                <span className="text-white/50 text-xs">Logo</span>
              )}
            </div>

            <div className="min-w-0 w-full">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <div className="text-white text-lg font-semibold break-words w-full sm:w-auto sm:truncate">
                  {org.name}
                </div>

                {org.abbreviation ? (
                  <span className="shrink-0 rounded-full border border-white/15 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-white/65">
                    {org.abbreviation}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 text-white/70">
                {org.description || "No description provided."}
              </div>

              <div className="mt-4 text-[11px] text-white/40 break-all max-w-full">
                ID: {org.id}
              </div>
            </div>
          </div>

          {/* Placeholder sections */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70">
              <div className="font-semibold text-white mb-1">
                News & Updates
              </div>
              Coming soon…
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70">
              <div className="font-semibold text-white mb-1">Schedule</div>
              Coming soon…
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70">
              <div className="font-semibold text-white mb-1">Race Results</div>
              Coming soon…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
