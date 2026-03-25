// pages/createEventPage.tsx
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/apiClient";

const FIXED_SPORT = "jet ski" as const;

type OrganizationOption = {
  id: string;
  name: string;
};

export default function CreateEventPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [saving, setSaving] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);

  const [draft, setDraft] = useState({
    organizerId: "",
    name: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
  });

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  useEffect(() => {
    let ignore = false;

    async function loadOrganizations() {
      try {
        setLoadingOrgs(true);

        const res = await apiRequest<any>("GET", "/organizations");

        const arr =
          res?.organizations ?? res?.data?.organizations ?? res?.data ?? [];

        const mapped = Array.isArray(arr)
          ? arr.map((org: any) => ({
              id: String(org.id),
              name: String(org.name ?? "Unnamed Organization"),
            }))
          : [];

        if (ignore) return;

        setOrganizations(mapped);

        if (mapped.length > 0) {
          setDraft((prev) => ({
            ...prev,
            organizerId: prev.organizerId || mapped[0].id,
          }));
        }
      } catch (err: any) {
        console.error("[CreateEvent] loadOrganizations error:", err);
        toast({
          variant: "destructive",
          title: "Failed to load organizations",
          description:
            err?.message || "Could not load organizations for event creation.",
        });
      } finally {
        if (!ignore) setLoadingOrgs(false);
      }
    }

    loadOrganizations();

    return () => {
      ignore = true;
    };
  }, [toast]);

  async function handleCreate() {
    if (
      !draft.organizerId ||
      !draft.name ||
      !draft.description ||
      !draft.location ||
      !draft.startDate ||
      !draft.endDate
    ) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please complete all required fields.",
      });
      return;
    }

    setSaving(true);
    try {
      function toIsoDate(dateOnly: string, endOfDay = false) {
        if (!dateOnly) throw new Error("Missing date");

        const base = dateOnly.includes("/")
          ? (() => {
              const [mm, dd, yyyy] = dateOnly.split("/").map(Number);
              const m = String(mm).padStart(2, "0");
              const d = String(dd).padStart(2, "0");
              return `${yyyy}-${m}-${d}`;
            })()
          : dateOnly.slice(0, 10);

        return endOfDay ? `${base}T23:59:59.999Z` : `${base}T00:00:00.000Z`;
      }

      const payload = {
        organizerId: draft.organizerId,
        name: draft.name.trim(),
        description: draft.description.trim(),
        sport: FIXED_SPORT,
        location: draft.location.trim(),
        startDate: toIsoDate(draft.startDate, false),
        endDate: toIsoDate(draft.endDate, true),
      };

      const json = await apiRequest<any>("POST", "/sport-event", payload);

      toast({
        title: "Event Created",
        description: json?.message || "Sport event created successfully.",
      });

      navigate("/organization/event-list");
    } catch (err: any) {
      console.error("Create event failed:", err);
      console.error("Create event failed body:", err?.body);

      toast({
        variant: "destructive",
        title: "Error",
        description:
          err?.body?.message || err?.message || "Failed to create event.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-white space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Create Race Event
          </h1>
          <p className="text-sm text-zinc-400">
            Fill details and create the event.
          </p>
        </div>
        <Button
          className="bg-white text-black hover:bg-zinc-200"
          onClick={handleCreate}
          disabled={saving || loadingOrgs}
        >
          {saving ? "Creating..." : "Create Event"}
        </Button>
      </div>

      <Card className="bg-zinc-900 border border-zinc-700 p-6 md:p-8 text-white space-y-4">
        <h2 className="text-xl font-medium text-white mb-2">Event Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Organization */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm text-zinc-400">Organization *</label>
            <select
              className="h-10 rounded-md bg-zinc-800 border border-zinc-700 px-3 text-white"
              value={draft.organizerId}
              onChange={(e) => set("organizerId", e.target.value)}
              disabled={loadingOrgs}
            >
              <option value="">
                {loadingOrgs
                  ? "Loading organizations..."
                  : "Select organization"}
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Event Name *</label>
            <Input
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              placeholder="Enter race event name..."
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Location *</label>
            <Input
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              placeholder="Enter location or city/state..."
              value={draft.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm text-zinc-400">Description *</label>
            <textarea
              className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white placeholder:text-zinc-500 h-24"
              placeholder="Enter event occasion..."
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* Start */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Start Date *</label>
            <Input
              type="date"
              className="bg-zinc-800 border-zinc-700 text-white"
              value={draft.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>

          {/* End */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">End Date *</label>
            <Input
              type="date"
              className="bg-zinc-800 border-zinc-700 text-white"
              value={draft.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
