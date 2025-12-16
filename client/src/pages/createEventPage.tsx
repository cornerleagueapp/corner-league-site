// pages/createEventPage.tsx
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiFetch } from "@/lib/apiClient";

// --- Fixed wiring ---
const ORG_ID = "b678f954-c1ba-11f0-8229-42010a420005";
const FIXED_SPORT = "jet_ski" as const;

export default function CreateEventPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    location: "",
    startDate: "", // yyyy-mm-dd or mm/dd/yyyy
    endDate: "",
  });

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  async function handleCreate() {
    if (
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
      // Normalize to YYYY-MM-DD
      function toYmd(dateOnly: string) {
        if (!dateOnly) throw new Error("Missing date");
        if (dateOnly.includes("-")) return dateOnly.slice(0, 10);
        if (dateOnly.includes("/")) {
          const [mm, dd, yyyy] = dateOnly.split("/").map((n) => Number(n));
          const m = String(mm).padStart(2, "0");
          const d = String(dd).padStart(2, "0");
          return `${yyyy}-${m}-${d}`;
        }
        const d = new Date(dateOnly);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }

      const payload = {
        organizerId: ORG_ID,
        name: draft.name.trim(),
        description: draft.description.trim(),
        sport: FIXED_SPORT,
        location: draft.location.trim(),
        startDate: toYmd(draft.startDate),
        endDate: toYmd(draft.endDate),
      };

      const res = await apiFetch("/sport-event", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status} ${res.statusText}`;
        try {
          const text = await res.text();
          try {
            const j = JSON.parse(text);
            msg =
              (Array.isArray(j?.message) && j.message.join(", ")) ||
              j?.message ||
              j?.error ||
              msg;
          } catch {
            msg = text || msg;
          }
        } catch {}
        throw new Error(msg);
      }

      const json = await res.json();

      toast({
        title: "Event Created",
        description: json?.message || "Sport event created successfully.",
      });

      navigate("/organization/event-list");
    } catch (err: any) {
      console.error("Create event failed:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to create event.",
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
          disabled={saving}
        >
          {saving ? "Creating..." : "Create Event"}
        </Button>
      </div>

      <Card className="bg-zinc-900 border border-zinc-700 p-6 md:p-8 text-white space-y-4">
        <h2 className="text-xl font-medium text-white mb-2">Event Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
