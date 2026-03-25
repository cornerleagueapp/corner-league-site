import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";

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
    // hour: "numeric",
    // minute: "2-digit",
  });
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
    <div className="mx-auto w-full max-w-5xl pt-16 sm:pt-10 px-4 py-10 text-white">
      <PageSEO title={`${data?.name || "Event Details"} • Corner League`} />

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">
            {data?.name || "Event Details"}
          </h1>
          <p className="text-sm text-white/60">
            Results, divisions, classes, and winners will live here.
          </p>
        </div>

        <Button
          onClick={() => window.history.back()}
          className="bg-white text-black hover:bg-white/90 shrink-0"
        >
          Back
        </Button>
      </div>

      {isLoading ? (
        <Card className="bg-white/5 border-white/10 p-6 text-white/70">
          Loading event…
        </Card>
      ) : isError ? (
        <Card className="bg-red-500/10 border-red-500/30 p-6 text-white">
          <div className="font-semibold">Failed to load event</div>
          <div className="text-sm text-white/75 mt-1">
            {(error as any)?.message || "Unknown error"}
          </div>
        </Card>
      ) : !data ? (
        <Card className="bg-white/5 border-white/10 p-6 text-white/70">
          Event not found.
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/50">Name:</span>{" "}
                <span className="text-white">{data.name}</span>
              </div>

              <div>
                <span className="text-white/50">Sport:</span>{" "}
                <span className="text-white">{data.sport || "—"}</span>
              </div>

              <div>
                <span className="text-white/50">Location:</span>{" "}
                <span className="text-white">{data.location || "TBD"}</span>
              </div>

              <div>
                <span className="text-white/50">Start:</span>{" "}
                <span className="text-white">
                  {formatDateTime(data.startDate)}
                </span>
              </div>

              <div>
                <span className="text-white/50">End:</span>{" "}
                <span className="text-white">
                  {formatDateTime(data.endDate)}
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="text-white/50">Description:</span>
                <div className="mt-1 text-white whitespace-pre-wrap">
                  {data.description || "No description provided."}
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6 text-white/70">
            Event results UI coming soon.
          </Card>
        </div>
      )}
    </div>
  );
}
