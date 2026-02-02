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
    <div className="mx-auto w-full max-w-[80rem] overflow-x-hidden p-6 pt-16 sm:pt-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">
            Jet Ski
          </p>
          <h1 className="text-2xl font-bold text-white">AQUA Organizations</h1>
          <p className="text-sm text-white/70">
            Browse AQUA race organizations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/scores")}
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
        >
          ← Back
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Loading organizations…
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-white">
          <div className="font-semibold mb-1">Failed to load organizations</div>
          <div className="text-sm text-white/80">
            {(error as any)?.message ?? "Unknown error"}
          </div>
        </div>
      ) : orgs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          No organizations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orgs.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => navigate(`/aqua-organizations/${o.id}`)}
              className="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-cyan-300/50 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            >
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                  {o.logoUrl ? (
                    <img
                      src={o.logoUrl}
                      alt={`${o.name} logo`}
                      className="h-full w-full object-contain p-2"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-white/50 text-xs">Logo</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-white truncate">
                      {o.name}
                    </h2>
                    {o.abbreviation ? (
                      <span className="rounded-full border border-white/15 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-white/65">
                        {o.abbreviation}
                      </span>
                    ) : null}
                  </div>

                  {o.description ? (
                    <p className="mt-2 text-sm text-white/70 line-clamp-3">
                      {o.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-white/50">
                      No description provided.
                    </p>
                  )}

                  <p className="mt-3 text-[11px] text-white/40">ID: {o.id}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
