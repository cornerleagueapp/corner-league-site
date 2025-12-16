// pages/updateEventPage.tsx
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { apiFetch } from "@/lib/apiClient";

type SportEnum =
  | "jet ski"
  | "football"
  | "basketball"
  | "tennis"
  | "volleyball";
const SPORT_OPTIONS: SportEnum[] = [
  "jet ski",
  "football",
  "basketball",
  "tennis",
  "volleyball",
];

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
    startDate: "", // yyyy-mm-dd
    endDate: "", // yyyy-mm-dd
  });

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

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
    <div className="w-full max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-white space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Update Event</h1>
          <p className="text-sm text-zinc-400">Edit the event details below.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            onClick={() => navigate("/organization/event-list")}
          >
            Back
          </Button>
          <Button
            className="bg-white text-black hover:bg-zinc-200"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card className="bg-zinc-900 border border-zinc-700 p-6 md:p-8 text-white space-y-4">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-400">Event Name *</label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-400">Location *</label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  value={draft.location}
                  onChange={(e) => set("location", e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm text-zinc-400">Description *</label>
                <textarea
                  className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white placeholder:text-zinc-500 h-24"
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              {/* Sport */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-400">Sport *</label>
                <select
                  className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white"
                  value={draft.sport}
                  onChange={(e) => set("sport", e.target.value as SportEnum)}
                >
                  {SPORT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start/End */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-400">Start Date *</label>
                <Input
                  type="date"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={draft.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </div>

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

            {/* Go manage classes/results */}
            <div className="pt-6">
              <Button
                variant="outline"
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                onClick={() =>
                  navigate(`/organization/events/${eventId}/classes`)
                }
              >
                Manage Classes & Results
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
