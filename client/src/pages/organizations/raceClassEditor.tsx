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

import {
  ArrowLeft,
  CalendarDays,
  Flag,
  Layers3,
  Pencil,
  Plus,
  Trophy,
  Trash2,
} from "lucide-react";

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

type DivisionFinalResult = {
  overallPosition: number;
  participantId: string;
  athlete?: {
    id: string;
    name: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
  totalPoints: number;
  sumPositions: number;
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

  const [divisionResults, setDivisionResults] = useState<
    Record<string, DivisionFinalResult[]>
  >({});

  const [loadingResultsByDivision, setLoadingResultsByDivision] = useState<
    Record<string, boolean>
  >({});

  // delete dialog
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const deletingDivision = useMemo(
    () => divisions.find((d) => d.id === pendingDelete),
    [pendingDelete, divisions],
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
      const res = await apiFetch(
        `/sport-event/division/event/${eventId}?page=1&limit=50`,
        {
          method: "GET",
        },
      );
      const json = await res.json();
      const list = json?.divisions ?? json?.data?.divisions ?? [];
      const safeDivisions = Array.isArray(list) ? list : [];
      setDivisions(safeDivisions);

      await Promise.all(
        safeDivisions.map((division) => loadDivisionResults(division.id)),
      );
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

  async function loadDivisionResults(divisionId: string) {
    try {
      setLoadingResultsByDivision((prev) => ({
        ...prev,
        [divisionId]: true,
      }));

      const res = await apiFetch(
        `/results/final-results-by-division/${divisionId}`,
        { method: "GET" },
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load final results");
      }

      const list =
        json?.results ?? json?.data?.results ?? json?.data ?? json ?? [];

      setDivisionResults((prev) => ({
        ...prev,
        [divisionId]: Array.isArray(list) ? list : [],
      }));
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to load final results.",
      });

      setDivisionResults((prev) => ({
        ...prev,
        [divisionId]: [],
      }));
    } finally {
      setLoadingResultsByDivision((prev) => ({
        ...prev,
        [divisionId]: false,
      }));
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
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 pb-24 sm:px-6 sm:py-12 lg:px-8">
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
                onClick={() => navigate(`/organization/events/${eventId}`)}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Event
              </button>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Admin Classes
                </div>

                <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Results Setup
                </div>
              </div>

              <h1 className="max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Classes &{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Results
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Manage classes, divisions, motos, and event result groups.
              </p>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-12 w-full rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Class
                </Button>
              </DialogTrigger>

              <DialogContent className="rounded-[28px] border border-cyan-300/10 bg-[#07111F] text-white shadow-[0_30px_90px_rgba(0,0,0,0.52)]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                    Create Class
                  </DialogTitle>
                  <DialogDescription className="text-slate-300">
                    Add a race class, such as “Novice Runabout Stock”.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                      Class name *
                    </Label>
                    <Input
                      autoFocus
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Enter race class name…"
                      className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 pt-2 sm:gap-2">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="h-11 rounded-full border-white/10 bg-white/[0.05] px-5 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button
                    className="h-11 rounded-full bg-cyan-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-[#06111d] hover:bg-cyan-200"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    {creating ? "Creating…" : "Create Class"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative mt-6">
            {event ? (
              <div className="rounded-[22px] border border-cyan-300/10 bg-cyan-300/[0.04] px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="break-words text-base font-black uppercase tracking-[-0.02em] text-white">
                      {event.name}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">
                      <span className="inline-flex items-center gap-1.5">
                        <Flag className="h-3.5 w-3.5 text-cyan-200" />
                        {event.location || "Location TBD"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-[#FFB199]" />
                        {fmtDate(event.startDate)} → {fmtDate(event.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex w-fit items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                    {divisions.length} Class{divisions.length === 1 ? "" : "es"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/55">
                Loading event…
              </div>
            )}
          </div>
        </section>

        <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <Layers3 className="h-5 w-5" />
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
                  Classes List
                </div>
                <p className="mt-1 text-sm text-white/55">
                  Open a class to manage motos and final results.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                Loading classes…
              </div>
            ) : divisions.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                No classes yet.
              </div>
            ) : (
              <div className="space-y-4">
                {divisions.map((d) => (
                  <Card
                    key={d.id}
                    className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.045] p-0 transition hover:border-cyan-300/25 hover:bg-white/[0.06]"
                  >
                    <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="break-words text-base font-black uppercase tracking-[-0.01em] text-white sm:text-lg">
                            {d.name}
                          </div>

                          {d.isWorldFinal ? (
                            <span className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199]">
                              World Finals
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                              Class
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-white/45">
                          Manage racers, motos, scoring, and final standings.
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                        <button
                          aria-label="Edit class"
                          title="Edit / Manage"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-300/15"
                          onClick={() =>
                            navigate(
                              `/organization/events/${eventId}/classes/${d.id}/manage`,
                            )
                          }
                        >
                          <Pencil size={15} />
                          Manage
                        </button>

                        <button
                          aria-label="Delete class"
                          title="Delete"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-400/15 bg-red-500/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-500/20"
                          onClick={() => setPendingDelete(d.id)}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </div>

                    <AccordionSection
                      labelShow="Show results"
                      labelHide="Hide results"
                      className="rounded-none border-t border-white/10"
                    >
                      <div className="space-y-2 p-4">
                        {loadingResultsByDivision[d.id] ? (
                          <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-6 text-center text-sm text-white/55">
                            Loading results…
                          </div>
                        ) : !divisionResults[d.id] ||
                          divisionResults[d.id].length === 0 ? (
                          <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-6 text-center text-sm text-white/55">
                            No results yet. Add motos & results in “Manage”.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-[20px] border border-white/10 bg-white/[0.04]">
                            <table className="min-w-[520px] w-full text-sm">
                              <thead className="bg-white/[0.05] text-white/65">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em]">
                                    Pos
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em]">
                                    Racer
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em]">
                                    Points
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {divisionResults[d.id].map((row) => (
                                  <tr
                                    key={row.participantId}
                                    className="border-t border-white/10 text-white"
                                  >
                                    <td className="px-4 py-3 font-black text-cyan-200">
                                      #{row.overallPosition}
                                    </td>
                                    <td className="px-4 py-3">
                                      {row.athlete?.name ||
                                        row.team?.name ||
                                        "Unknown"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6B35]/15 bg-[#FF6B35]/10 px-2.5 py-1 text-xs font-semibold text-[#FFB199]">
                                        <Trophy className="h-3.5 w-3.5" />
                                        {row.totalPoints}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </AccordionSection>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>

        <AlertDialog
          open={!!pendingDelete}
          onOpenChange={(o) => !o && setPendingDelete(null)}
        >
          <AlertDialogContent className="rounded-[28px] border border-cyan-300/10 bg-[#07111F] text-white shadow-[0_30px_90px_rgba(0,0,0,0.52)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black uppercase tracking-[-0.02em] text-white">
                Delete this class?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">
                {deletingDivision?.name
                  ? `“${deletingDivision.name}”`
                  : "This class"}{" "}
                will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full border border-white/10 bg-white/[0.05] px-5 text-white hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="rounded-full bg-red-500 px-5 text-white hover:bg-red-600"
                onClick={() => pendingDelete && handleDelete(pendingDelete)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
