// pages/createEventPage.tsx
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/apiClient";
import { ArrowLeft, CalendarDays, Flag, MapPin, Trophy } from "lucide-react";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";

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
    formattedAddress: "",
    latitude: "",
    longitude: "",
    placeId: "",
    locationProvider: "",
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
        formattedAddress: draft.formattedAddress || undefined,
        latitude: draft.latitude || undefined,
        longitude: draft.longitude || undefined,
        placeId: draft.placeId || undefined,
        locationProvider: draft.locationProvider || undefined,
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
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.94)_0%,rgba(4,10,19,0.98)_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:rounded-[38px] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate("/organization/event-list")}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Admin Events
                </div>

                <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Jet Ski
                </div>
              </div>

              <h1 className="max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Create Race{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Event
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Fill in the race details, assign the organization, and create a
                new event for the Corner League platform.
              </p>
            </div>

            <Button
              className="h-12 w-full rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 disabled:opacity-50 sm:w-auto"
              onClick={handleCreate}
              disabled={saving || loadingOrgs}
            >
              {saving ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </section>

        <Card className="mt-6 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
                  Event Details
                </div>
                <p className="mt-1 text-sm text-white/55">
                  All required fields must be completed before creating.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  Organization *
                </label>

                <div className="relative">
                  <select
                    className="h-12 w-full appearance-none rounded-[14px] border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
                    value={draft.organizerId}
                    onChange={(e) => set("organizerId", e.target.value)}
                    disabled={loadingOrgs}
                  >
                    <option className="bg-[#07111F] text-white" value="">
                      {loadingOrgs
                        ? "Loading organizations..."
                        : "Select organization"}
                    </option>

                    {organizations.map((org) => (
                      <option
                        className="bg-[#07111F] text-white"
                        key={org.id}
                        value={org.id}
                      >
                        {org.name}
                      </option>
                    ))}
                  </select>

                  <Flag className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  Event Name *
                </label>
                <Input
                  className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                  placeholder="Enter race event name..."
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <LocationAutocomplete
                  label="Location *"
                  value={draft.location}
                  placeholder="Search city, venue, lake, or address..."
                  onTextChange={(location) =>
                    setDraft((prev) => ({
                      ...prev,
                      location,
                      formattedAddress: "",
                      latitude: "",
                      longitude: "",
                      placeId: "",
                      locationProvider: "",
                    }))
                  }
                  onSelect={(selected) =>
                    setDraft((prev) => ({
                      ...prev,
                      location: selected.location,
                      formattedAddress: selected.formattedAddress,
                      latitude: selected.latitude,
                      longitude: selected.longitude,
                      placeId: selected.placeId,
                      locationProvider: selected.locationProvider,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  Description *
                </label>
                <textarea
                  className="min-h-28 rounded-[14px] border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 transition focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
                  placeholder="Enter event occasion..."
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  Start Date *
                </label>
                <Input
                  type="date"
                  className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white focus-visible:ring-cyan-300/30"
                  value={draft.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  End Date *
                </label>
                <Input
                  type="date"
                  className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white focus-visible:ring-cyan-300/30"
                  value={draft.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-[20px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-4 py-4 text-sm leading-6 text-[#FFB199]/80">
              <div className="mb-1 flex items-center gap-2 font-black uppercase tracking-[0.16em] text-[#FFB199]">
                <Trophy className="h-4 w-4" />
                Fixed Sport
              </div>
              This event will be created as{" "}
              <span className="font-semibold text-[#FFD2C2]">jet ski</span>.
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="ghost"
                className="h-12 rounded-full border border-white/10 px-6 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => navigate("/organization/event-list")}
              >
                Cancel
              </Button>

              <Button
                className="h-12 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 disabled:opacity-50"
                onClick={handleCreate}
                disabled={saving || loadingOrgs}
              >
                {saving ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
