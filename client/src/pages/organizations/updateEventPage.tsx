// pages/updateEventPage.tsx
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { apiFetch } from "@/lib/apiClient";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Save,
  Trophy,
} from "lucide-react";

import {
  LocationAutocomplete,
  type LocationSelection,
} from "@/components/LocationAutocomplete";

type SportEnum = "jet ski";

const SPORT_OPTIONS: SportEnum[] = ["jet ski"];

export default function UpdateEventPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/organization/events/:id");
  const eventId = params?.id || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    name: "",
    description: "",
    sport: "jet ski" as SportEnum,
    location: "",

    formattedAddress: "",
    latitude: "",
    longitude: "",
    placeId: "",
    locationProvider: "",
    city: "",
    stateCode: "",
    countryCode: "",

    startDate: "", // yyyy-mm-dd
    endDate: "", // yyyy-mm-dd
  });

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function handleLocationSelect(location: LocationSelection) {
    setDraft((d) => ({
      ...d,
      location: location.location || location.formattedAddress || "",
      formattedAddress: location.formattedAddress || location.location || "",
      latitude: location.latitude || "",
      longitude: location.longitude || "",
      placeId: location.placeId || "",
      locationProvider: location.locationProvider || "mapbox",
      city: location.city || "",
      stateCode: location.stateCode || "",
      countryCode: location.countryCode || "",
    }));
  }

  const toDateInput = (iso?: string) => {
    if (!iso) return "";
    const d = iso.includes("T") ? new Date(iso) : new Date(`${iso}T00:00:00Z`);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  async function load() {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/sport-event/${eventId}`, { method: "GET" });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.message || "Failed to load event.");

      const ev = json?.data?.sportEvent ?? json?.sportEvent;
      if (!ev) throw new Error("Event not found in response.");

      setDraft({
        name: ev.name ?? "",
        description: ev.description ?? "",
        sport: (ev.sport ?? "jet ski") as SportEnum,
        location: ev.location ?? "",

        formattedAddress: ev.formattedAddress ?? ev.formatted_address ?? "",
        latitude:
          ev.latitude !== null && ev.latitude !== undefined
            ? String(ev.latitude)
            : "",
        longitude:
          ev.longitude !== null && ev.longitude !== undefined
            ? String(ev.longitude)
            : "",
        placeId: ev.placeId ?? ev.place_id ?? "",
        locationProvider: ev.locationProvider ?? ev.location_provider ?? "",
        city: ev.city ?? "",
        stateCode: ev.stateCode ?? ev.state_code ?? "",
        countryCode: ev.countryCode ?? ev.country_code ?? "",

        startDate: toDateInput(ev.startDate),
        endDate: toDateInput(ev.endDate),
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Could not fetch event.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!eventId) return;
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        sport: draft.sport,
        location: draft.location.trim(),

        formattedAddress: draft.formattedAddress || null,
        latitude: draft.latitude || null,
        longitude: draft.longitude || null,
        placeId: draft.placeId || null,
        locationProvider: draft.locationProvider || null,
        city: draft.city || null,
        stateCode: draft.stateCode || null,
        countryCode: draft.countryCode || null,

        startDate: draft.startDate ? `${draft.startDate}T00:00:00Z` : undefined,
        endDate: draft.endDate ? `${draft.endDate}T00:00:00Z` : undefined,
      };

      const res = await apiFetch(`/sport-event/${eventId}`, {
        method: "PATCH",
        body: payload,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Update failed.");

      toast({ title: "Saved", description: json?.message || "Event updated." });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Could not update event.",
      });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

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
                  Update Event
                </div>
              </div>

              <h1 className="max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Update{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Event
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Edit event details, dates, location, and sport classification.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                className="h-12 rounded-full border-white/10 bg-white/[0.04] px-6 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => navigate("/organization/event-list")}
              >
                Back
              </Button>

              <Button
                className="h-12 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 disabled:opacity-50"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
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
                  Update the form below and save changes.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6 md:p-8">
            {loading ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                Loading event…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                      Event Name *
                    </label>
                    <Input
                      className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                      value={draft.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <LocationAutocomplete
                      label="Location *"
                      value={draft.location}
                      placeholder="Search city, venue, lake, or full address..."
                      onTextChange={(value) =>
                        setDraft((d) => ({
                          ...d,
                          location: value,
                          formattedAddress: "",
                          latitude: "",
                          longitude: "",
                          placeId: "",
                          locationProvider: "",
                          city: "",
                          stateCode: "",
                          countryCode: "",
                        }))
                      }
                      onSelect={handleLocationSelect}
                    />

                    {draft.latitude && draft.longitude ? (
                      <div className="rounded-[14px] border border-cyan-300/10 bg-cyan-300/[0.04] px-3 py-2 text-xs leading-5 text-cyan-100/70">
                        Coordinates attached:{" "}
                        {Number(draft.latitude).toFixed(5)},{" "}
                        {Number(draft.longitude).toFixed(5)}
                      </div>
                    ) : (
                      <div className="text-xs leading-5 text-white/40">
                        Select a location from the dropdown to attach map
                        coordinates.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                      Description *
                    </label>
                    <textarea
                      className="min-h-28 rounded-[14px] border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 transition focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
                      value={draft.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                      Sport *
                    </label>

                    <div className="relative">
                      <select
                        className="h-12 w-full appearance-none rounded-[14px] border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
                        value={draft.sport}
                        onChange={(e) =>
                          set("sport", e.target.value as SportEnum)
                        }
                      >
                        {SPORT_OPTIONS.map((s) => (
                          <option
                            className="bg-[#07111F] text-white"
                            key={s}
                            value={s}
                          >
                            {s}
                          </option>
                        ))}
                      </select>

                      <Trophy className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    </div>
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
                    <ClipboardList className="h-4 w-4" />
                    Results Setup
                  </div>
                  Once the event details are correct, manage classes, motos, and
                  racer results from the controls below.
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-cyan-300/15 bg-cyan-300/10 px-6 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 hover:bg-cyan-300/15 hover:text-white"
                    onClick={() =>
                      navigate(`/organization/events/${eventId}/classes`)
                    }
                  >
                    Manage Classes & Results
                  </Button>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="ghost"
                      className="h-12 rounded-full border border-white/10 px-6 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/10 hover:text-white"
                      onClick={() => navigate("/organization/event-list")}
                    >
                      Cancel
                    </Button>

                    <Button
                      className="h-12 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 disabled:opacity-50"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
