// pages/raceClassEditor.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";
import AccordionSection from "@/components/AccordionSection";

// dialogs
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Pencil, Trash2 } from "lucide-react";

type Division = {
  id: string;
  name: string;
  isWorldFinal?: boolean;
};

type SportEvent = {
  id?: string;
  name?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
};

export default function RaceClassEditor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [, params] = useRoute("/organization/events/:id/classes");
  const eventId = params?.id || "";

  const [loading, setLoading] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [event, setEvent] = useState<SportEvent | null>(null);

  // create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");

  // delete dialog
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const deletingDivision = useMemo(
    () => divisions.find((d) => d.id === pendingDelete),
    [pendingDelete, divisions]
  );

  const fmtDate = (s?: string) =>
    s
      ? new Date(s).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  async function loadEvent() {
    if (!eventId) return;
    try {
      const res = await apiFetch(`/sport-event/${eventId}`, { method: "GET" });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.message || "Failed to fetch event.");

      const ev =
        json?.sportEvent ??
        json?.event ??
        json?.data?.sportEvent ??
        json?.data ??
        null;

      setEvent(ev);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Could not fetch event.",
      });
    }
  }

  async function loadDivisions() {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/sport-event/division/event/${eventId}`, {
        method: "GET",
      });
      const json = await res.json();
      const list = json?.divisions ?? json?.data?.divisions ?? [];
      setDivisions(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to load classes.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvent();
    loadDivisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleCreate() {
    if (!formName.trim()) {
      toast({ variant: "destructive", title: "Class name required" });
      return;
    }
    setCreating(true);
    try {
      const res = await apiFetch(`/sport-event/division`, {
        method: "POST",
        body: { eventId, name: formName.trim() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Create failed");
      toast({ title: "Class created" });
      setCreateOpen(false);
      setFormName("");
      await loadDivisions();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to create class.",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await apiFetch(`/sport-event/division/${id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Delete failed");
      toast({ title: "Deleted", description: "Class deleted successfully." });
      setDivisions((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to delete class.",
      });
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-white space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Classes & Results
            </h1>
            <p className="text-sm text-zinc-400">
              Manage classes (divisions), motos, and results for this event.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Button
              variant="outline"
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              onClick={() => navigate(`/organization/events/${eventId}`)}
            >
              Back to Event
            </Button>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-zinc-200">
                  + Add Class
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-700 text-white">
                <DialogHeader>
                  <DialogTitle>Create Class</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Add a race class (e.g., “Novice Runabout Stock”).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div className="grid gap-2">
                    <Label className="text-zinc-300">Class name *</Label>
                    <Input
                      autoFocus
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Enter race class name…"
                      className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    className="bg-white text-black hover:bg-zinc-200"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    {creating ? "Creating…" : "Create Class"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {event ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-sm text-white/90 font-medium">
              {event.name}
            </div>
            <div className="text-xs text-white/60">
              {event.location} • {fmtDate(event.startDate)} →{" "}
              {fmtDate(event.endDate)}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
            Loading event…
          </div>
        )}
      </div>

      {/* Classes list */}
      <Card className="bg-zinc-900 border border-zinc-700 p-6">
        {loading ? (
          <div className="text-zinc-400">Loading…</div>
        ) : divisions.length === 0 ? (
          <div className="text-zinc-300">No classes yet.</div>
        ) : (
          <div className="space-y-3">
            {divisions.map((d) => (
              <Card
                key={d.id}
                className="bg-zinc-900/70 border border-zinc-700/70 p-0 overflow-hidden"
              >
                {/* Row header */}
                <div className="flex items-start justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">
                      {d.name}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {d.isWorldFinal ? "World Finals" : "Class"}
                    </div>
                  </div>

                  {/* Icon actions (better on mobile) */}
                  <div className="flex items-center gap-1">
                    <button
                      aria-label="Edit class"
                      title="Edit / Manage"
                      className="p-2 m-2 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700"
                      onClick={() =>
                        navigate(
                          `/organization/events/${eventId}/classes/${d.id}/manage`
                        )
                      }
                    >
                      <Pencil size={16} className="text-white" />
                    </button>

                    <button
                      aria-label="Delete class"
                      title="Delete"
                      className="p-2 rounded-lg bg-red-950/40 border border-red-900 hover:bg-red-900/30"
                      onClick={() => setPendingDelete(d.id)}
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Results accordion */}
                <AccordionSection
                  labelShow="Show results"
                  labelHide="Hide results"
                  className="rounded-none border-t border-zinc-800"
                >
                  {/* Scores-style compact list (empty state for now) */}
                  <div className="space-y-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-zinc-400">
                      No results yet. Add motos & results in “Manage”.
                    </div>
                  </div>
                </AccordionSection>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Delete class confirm */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {deletingDivision?.name
                ? `“${deletingDivision.name}”`
                : "This class"}{" "}
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
