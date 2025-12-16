// pages/ClassMatchManagePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";
import AthleteSearchModal, {
  AthleteLite,
} from "@/components/AthleteSearchModal";
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

type MatchLite = {
  id: string;
  name: string;
  scheduledDate?: string;
  division?: { id: string; name: string };
  athletes?: { id: string; name: string }[];
  results?: {
    id: string;
    position: number;
    raceTime?: number;
    score?: number;
  }[];
  isFinalized?: boolean;
};

// --- helpers ---
function toDatetimeLocalString(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function firstMatch(json: any) {
  if (!json) return null;
  if (json.match) return json.match;
  if (json.data?.match) return json.data.match;

  const arrays = [
    json.matches,
    json.items,
    json.athletes,
    json.data?.matches,
    json.data?.items,
  ].filter(Array.isArray) as any[][];
  const arr = arrays[0];
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

export default function ClassMatchManagePage() {
  const [, params] = useRoute(
    "/organization/events/:eventId/classes/:divisionId/manage"
  );
  const { eventId = "", divisionId = "" } = params || {};
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<MatchLite | null>(null);

  const [divisionName, setDivisionName] = useState<string>("");

  const [name, setName] = useState("");
  const [date, setDate] = useState<string>("");
  const [saving, setSaving] = useState(false);

  type SelectedAthlete = { id: string; name: string; origin?: string | null };
  const [selectedAthletes, setSelectedAthletes] = useState<SelectedAthlete[]>(
    []
  );
  const [athleteModalOpen, setAthleteModalOpen] = useState(false);

  const athleteIds = useMemo(
    () => selectedAthletes.map((a) => String(a.id)),
    [selectedAthletes]
  );

  const racersCount = match?.athletes?.length ?? selectedAthletes.length ?? 0;

  useEffect(() => {
    if (!match?.athletes) return;
    setSelectedAthletes(
      match.athletes.map((a) => ({
        id: String(a.id),
        name: a.name ?? `#${a.id}`,
        origin: null,
      }))
    );
  }, [match?.id]);

  async function fetchDivision() {
    try {
      const res = await apiFetch(`/sport-event/division/${divisionId}`, {
        method: "GET",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Failed to load division");
      const d = j?.division ?? j?.data?.division ?? j;
      const autoName = d?.name ?? "";
      setDivisionName(autoName);
      setName(autoName);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Load failed",
      });
    }
  }

  async function fetchByDivision() {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/match/division/${divisionId}?limit=1&page=1`,
        { method: "GET" }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Failed to load match");

      const m = firstMatch(j);
      setMatch(m || null);

      if (m) {
        setName(m.name ?? divisionName ?? "");
        setDate(toDatetimeLocalString(m.scheduledDate));
        setSelectedAthletes(
          (m.athletes || []).map((a: any) => ({
            id: String(a.id),
            name: a.name ?? `#${a.id}`,
            origin: null,
          }))
        );
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Load failed",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDivision();
    fetchByDivision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionId]);

  // Create match
  async function handleCreate() {
    if (!name.trim() || !date) {
      toast({ variant: "destructive", title: "Name and date are required" });
      return;
    }
    if (!athleteIds.length) {
      toast({ variant: "destructive", title: "Select at least one racer" });
      return;
    }
    setSaving(true);
    try {
      const uniqueIds = Array.from(new Set(athleteIds)).map(String);

      const maybeBad = uniqueIds.filter(
        (id) => !/^[0-9a-f-]{32,36}$/i.test(id)
      );

      const payload = {
        name: name.trim(),
        divisionId,
        scheduledDate: new Date(date).toISOString(),
        athleteIds: uniqueIds,
      };

      console.groupCollapsed("%cCreate Match → payload", "color:#7aa2f7");
      console.log("payload", payload);
      console.table(
        selectedAthletes.map((a) => ({
          id: a.id,
          name: a.name,
          origin: a.origin,
        }))
      );
      if (maybeBad.length) {
        console.warn("IDs that look suspicious:", maybeBad);
      }
      console.groupEnd();

      const res = await apiFetch(`/match`, { method: "POST", body: payload });
      const j = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        console.groupCollapsed(
          "%cCreate Match → server error",
          "color:#f87171"
        );
        console.log("status", res.status);
        console.log("response", j);
        const idSet = new Set(uniqueIds);
        const suspect = selectedAthletes.filter(
          (a) => !idSet.has(String(a.id))
        );
        if (suspect.length) {
          console.warn(
            "Selected athletes not in payload (should be none):",
            suspect
          );
        }
        console.groupEnd();
        throw new Error(j?.message || `Create failed (HTTP ${res.status})`);
      }

      toast({ title: "Match created" });
      setDate("");
      setSelectedAthletes([]);
      await fetchByDivision();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Create failed",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpsert() {
    if (!name.trim() || !date) {
      toast({ variant: "destructive", title: "Name and date are required" });
      return;
    }
    if (!athleteIds.length) {
      toast({ variant: "destructive", title: "Select at least one racer" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        divisionId,
        scheduledDate: new Date(date).toISOString(),
        athleteIds: Array.from(new Set(athleteIds)).map(String),
      };

      if (match) {
        // UPDATE
        const res = await apiFetch(`/match/${match.id}`, {
          method: "PUT",
          body: payload,
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(j?.message || `Update failed (HTTP ${res.status})`);
        toast({ title: "Match updated" });
      } else {
        // CREATE
        const res = await apiFetch(`/match`, { method: "POST", body: payload });
        const j = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(j?.message || `Create failed (HTTP ${res.status})`);
        toast({ title: "Match created" });
      }

      await fetchByDivision();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  // Update match fields
  async function updateMatch(
    input: Partial<Pick<MatchLite, "name" | "scheduledDate">> & {
      athleteIds?: string[];
    }
  ) {
    if (!match) return;
    const res = await apiFetch(`/match/${match.id}`, {
      method: "PUT",
      body: input,
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.message || "Update failed");
  }

  async function handleEditRacers(newIds: string[]) {
    try {
      await updateMatch({ athleteIds: newIds });
      toast({ title: "Racers updated" });
      await fetchByDivision();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message,
      });
    }
  }

  async function handleEditSchedule(newDate: string) {
    try {
      await updateMatch({
        name: match?.name,
        scheduledDate: new Date(newDate).toISOString(),
      });
      toast({ title: "Match updated" });
      await fetchByDivision();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message,
      });
    }
  }

  async function handleFinalize() {
    if (!match) return;
    const res = await apiFetch(`/match/finalize/${match.id}`, {
      method: "POST",
    });
    const j = await res.json();
    if (!res.ok)
      return toast({
        variant: "destructive",
        title: "Error",
        description: j?.message || "Finalize failed",
      });
    toast({ title: "Match finalized" });
    await fetchByDivision();
  }

  async function handleUnfinalize() {
    if (!match) return;
    const res = await apiFetch(`/match/unfinalize/${match.id}`, {
      method: "POST",
    });
    const j = await res.json();
    if (!res.ok)
      return toast({
        variant: "destructive",
        title: "Error",
        description: j?.message || "Unfinalize failed",
      });
    toast({ title: "Match unfinalized" });
    await fetchByDivision();
  }

  async function handleDelete() {
    if (!match) return;
    const res = await apiFetch(`/match/${match.id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok)
      return toast({
        variant: "destructive",
        title: "Error",
        description: j?.message || "Delete failed",
      });
    toast({ title: "Match deleted" });
    setMatch(null);
  }

  const fmtDate = (s?: string) =>
    s
      ? new Date(s).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  function addAthleteObj(a: {
    id: string | number;
    name: string;
    location?: string | null;
  }) {
    const id = String(a.id);
    setSelectedAthletes((prev) => {
      if (prev.some((p) => p.id === id)) return prev;
      return [...prev, { id, name: a.name, origin: a.location ?? null }];
    });
  }
  function removeAthlete(id: string) {
    setSelectedAthletes((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Manage Class Match</h1>
          <p className="text-sm text-zinc-400">
            Create the class match, attach racers, schedule, and finalize.
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          onClick={() => navigate(`/organization/events/${eventId}/classes`)}
        >
          Back to Classes
        </Button>
      </div>

      {/* Create form when no match exists */}
      {!loading && !match && (
        <Card className="bg-zinc-900 border border-zinc-700 p-6 space-y-4">
          <div className="text-sm text-zinc-300 mb-2">
            No match exists for this class. Create one to add racers and motos.
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-zinc-300">Match name</Label>
              <Input
                value={name}
                disabled
                className="bg-zinc-900 border-zinc-700 text-white/90 disabled:opacity-100"
                placeholder={divisionName || "Class name"}
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-zinc-300">Scheduled date (ISO)</Label>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-white/60"
                placeholder="Select date/time"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-zinc-300">Racers</Label>

            <Button
              variant="outline"
              className="bg-zinc-800 border-zinc-700 text-white/90 hover:bg-zinc-700"
              onClick={() => setAthleteModalOpen(true)}
            >
              Select racers ({selectedAthletes.length})
            </Button>

            {/* selected chips */}
            {selectedAthletes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedAthletes.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full
                   text-xs bg-white/10 border border-white/15"
                  >
                    <span className="text-white/90">
                      {a.name}
                      {a.origin ? ` • ${a.origin}` : ""}
                    </span>
                    <button
                      aria-label="Remove"
                      className="text-white/80 hover:text-white"
                      onClick={() => removeAthlete(a.id)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              className="bg-white text-black hover:bg-zinc-200"
              disabled={saving}
              onClick={handleUpsert}
            >
              {saving ? "Creating…" : "Create Match"}
            </Button>
          </div>
        </Card>
      )}

      {/* Existing match view */}
      {!loading && match && (
        <>
          <Card className="bg-zinc-900 border border-zinc-700 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="text-lg text-white font-semibold">
                  {match.name}
                </div>
                <div className="text-sm text-zinc-400">
                  {fmtDate(match.scheduledDate)} • Racers:{" "}
                  {match.athletes?.length ?? 0}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                  onClick={() => setAthleteModalOpen(true)}
                  disabled={match.isFinalized}
                >
                  Edit Racers
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    >
                      Edit Date
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-950 border-zinc-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Edit match</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Update the schedule.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label>Date</Label>
                        <Input
                          type="datetime-local"
                          onChange={(e) => setDate(e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-white/60"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          className="bg-white text-black hover:bg-zinc-200"
                          onClick={() => handleEditSchedule(date)}
                        >
                          Save
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {!match.isFinalized ? (
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600"
                    onClick={handleFinalize}
                  >
                    Finalize
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="bg-zinc-800"
                    onClick={handleUnfinalize}
                  >
                    Unfinalize
                  </Button>
                )}

                <AlertDialog>
                  <Button
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    Delete
                  </Button>
                  <AlertDialogContent className="bg-zinc-950 border-zinc-700 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this match?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        This will remove the match from the class.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600"
                        onClick={handleDelete}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-900 border border-zinc-700 p-6">
            <div className="text-sm text-zinc-300 mb-3">Motos & Results</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-zinc-400">
              Hook your Moto list/create modals here keyed by{" "}
              <span className="font-mono font-bold">{match.name}</span>.
            </div>
          </Card>
        </>
      )}

      {/* Athlete picker (single-pick, we add to list; can open repeatedly) */}
      <AthleteSearchModal
        open={athleteModalOpen}
        onClose={() => setAthleteModalOpen(false)}
        onPick={(a) => {
          console.log("Picked athlete", a);

          addAthleteObj({ id: a.id, name: a.name, location: a.location });

          if (match) {
            const serverIds = Array.from(
              new Set([
                ...(match.athletes?.map((x) => String(x.id)) || []),
                String(a.id),
              ])
            );
            console.log("Updating racers with athleteIds:", serverIds);
            handleEditRacers(serverIds);
          }
        }}
      />
    </div>
  );
}
