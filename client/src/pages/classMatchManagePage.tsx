import React, { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";
import AthleteSearchModal from "@/components/AthleteSearchModal";
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

type SelectedAthlete = {
  id: string;
  name: string;
  origin?: string | null;
};

type MotoLite = {
  id: string;
  sequence: number;
};

type ResultLite = {
  id: string;
  position?: number | null;
  raceTime?: number | null;
  score?: number | null;
  status?: string | null;
  athlete?: {
    id: string;
    name: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
  moto?: {
    id: string;
    sequence: number;
  } | null;
};

type FinalStanding = {
  participantId: string;
  athlete?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
  totalPoints: number;
  sumPositions: number;
  overallPosition: number;
};

function toDatetimeLocalString(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
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

function RacerChip({
  athlete,
  onRemove,
  disabled,
}: {
  athlete: SelectedAthlete;
  onRemove?: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
        disabled
          ? "border-white/10 bg-white/5 text-white/60"
          : "border-white/15 bg-white/10 text-white/90"
      }`}
    >
      <span>
        {athlete.name}
        {athlete.origin ? ` • ${athlete.origin}` : ""}
      </span>

      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${athlete.name}`}
          className="text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onRemove(athlete.id)}
          disabled={disabled}
        >
          ✕
        </button>
      ) : null}
    </span>
  );
}

export default function ClassMatchManagePage() {
  const [, params] = useRoute(
    "/organization/events/:eventId/classes/:divisionId/manage",
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
  const [racersSaving, setRacersSaving] = useState(false);

  const [selectedAthletes, setSelectedAthletes] = useState<SelectedAthlete[]>(
    [],
  );
  const [athleteModalOpen, setAthleteModalOpen] = useState(false);

  const [motos, setMotos] = useState<MotoLite[]>([]);
  const [results, setResults] = useState<ResultLite[]>([]);
  const [finalStandings, setFinalStandings] = useState<FinalStanding[]>([]);
  const [motosLoading, setMotosLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [scoreSavingKey, setScoreSavingKey] = useState<string | null>(null);
  const [newMotoSequence, setNewMotoSequence] = useState("");
  const [draftPositions, setDraftPositions] = useState<Record<string, string>>(
    {},
  );

  const athleteIds = useMemo(
    () => selectedAthletes.map((a) => String(a.id)),
    [selectedAthletes],
  );

  const racersCount = selectedAthletes.length;

  useEffect(() => {
    if (!match?.athletes) return;
    setSelectedAthletes(
      match.athletes.map((a) => ({
        id: String(a.id),
        name: a.name ?? `#${a.id}`,
        origin: null,
      })),
    );
  }, [match?.id, match?.athletes]);

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
        {
          method: "GET",
        },
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
          })),
        );
      } else {
        setSelectedAthletes([]);
        setMotos([]);
        setResults([]);
        setFinalStandings([]);
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

  async function fetchMotos(matchId: string) {
    setMotosLoading(true);
    try {
      const res = await apiFetch(
        `/motos/match/${matchId}?page=1&limit=50&sortBy=sequence&order=ASC`,
        { method: "GET" },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to load motos");

      const list = j?.motos ?? j?.data?.motos ?? [];
      const parsed = Array.isArray(list) ? list : [];
      parsed.sort((a: MotoLite, b: MotoLite) => a.sequence - b.sequence);
      setMotos(parsed);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to load motos",
      });
    } finally {
      setMotosLoading(false);
    }
  }

  async function fetchResults(matchId: string) {
    setResultsLoading(true);
    try {
      const res = await apiFetch(
        `/results/match/${matchId}?page=1&limit=500&sortBy=createdAt&order=ASC`,
        { method: "GET" },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to load results");

      const list = j?.results ?? j?.data?.results ?? [];
      const parsed = Array.isArray(list) ? list : [];
      setResults(parsed);

      const nextDrafts: Record<string, string> = {};
      parsed.forEach((r: ResultLite) => {
        const athleteId = r?.athlete?.id;
        const motoId = r?.moto?.id;
        if (athleteId && motoId && r.position != null) {
          nextDrafts[`${athleteId}:${motoId}`] = String(r.position);
        }
      });
      setDraftPositions(nextDrafts);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to load results",
      });
    } finally {
      setResultsLoading(false);
    }
  }

  async function fetchFinalStandings(matchId: string) {
    try {
      const res = await apiFetch(`/results/compute-final-results/${matchId}`, {
        method: "GET",
      });
      const j = await res.json().catch(() => []);
      if (!res.ok) throw new Error(j?.message || "Failed to compute standings");
      setFinalStandings(Array.isArray(j) ? j : []);
    } catch {
      setFinalStandings([]);
    }
  }

  useEffect(() => {
    fetchDivision();
    fetchByDivision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisionId]);

  useEffect(() => {
    if (!match?.id) {
      setMotos([]);
      setResults([]);
      setFinalStandings([]);
      return;
    }
    fetchMotos(match.id);
    fetchResults(match.id);
    fetchFinalStandings(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id]);

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
        const res = await apiFetch(`/match/${match.id}`, {
          method: "PUT",
          body: payload,
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(j?.message || `Update failed (HTTP ${res.status})`);
        toast({ title: "Match updated" });
      } else {
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

  async function updateMatch(
    input: Partial<Pick<MatchLite, "name" | "scheduledDate">> & {
      athleteIds?: string[];
    },
  ) {
    if (!match) return;
    const res = await apiFetch(`/match/${match.id}`, {
      method: "PUT",
      body: input,
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message || "Update failed");
  }

  async function handleEditRacers(newIds: string[]) {
    try {
      setRacersSaving(true);
      await updateMatch({ athleteIds: newIds });
      toast({ title: "Racers updated" });
      await fetchByDivision();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message,
      });
    } finally {
      setRacersSaving(false);
    }
  }

  async function handleRemoveRacer(id: string) {
    const next = selectedAthletes.filter((a) => a.id !== id);

    if (!match) {
      setSelectedAthletes(next);
      return;
    }

    if (match.isFinalized) return;

    if (next.length === 0) {
      toast({
        variant: "destructive",
        title: "At least one racer required",
        description: "A class match must keep at least one racer attached.",
      });
      return;
    }

    setSelectedAthletes(next);

    try {
      setRacersSaving(true);
      await handleEditRacers(next.map((a) => String(a.id)));
    } catch {
      await fetchByDivision();
    } finally {
      setRacersSaving(false);
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
    const j = await res.json().catch(() => ({}));
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
    const j = await res.json().catch(() => ({}));
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
    setSelectedAthletes([]);
    setMotos([]);
    setResults([]);
    setFinalStandings([]);
  }

  async function handleCreateMoto() {
    if (!match?.id) return;
    const sequence = Number(newMotoSequence);
    if (!Number.isFinite(sequence) || sequence < 1) {
      toast({
        variant: "destructive",
        title: "Invalid moto number",
      });
      return;
    }

    try {
      const res = await apiFetch(`/motos`, {
        method: "POST",
        body: {
          matchId: match.id,
          sequence,
        },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to create moto");

      toast({ title: "Moto created" });
      setNewMotoSequence("");
      await fetchMotos(match.id);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to create moto",
      });
    }
  }

  async function handleDeleteMoto(motoId: string) {
    if (!match?.id) return;
    try {
      const res = await apiFetch(`/motos/${motoId}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to delete moto");

      toast({ title: "Moto deleted" });
      await fetchMotos(match.id);
      await fetchResults(match.id);
      await fetchFinalStandings(match.id);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to delete moto",
      });
    }
  }

  function getResultForAthleteMoto(athleteId: string, motoId: string) {
    return results.find(
      (r) =>
        String(r.athlete?.id) === String(athleteId) &&
        String(r.moto?.id) === String(motoId),
    );
  }

  function getFinalForAthlete(athleteId: string) {
    return finalStandings.find(
      (f) => String(f.athlete?.id) === String(athleteId),
    );
  }

  async function saveAthleteMotoResult(args: {
    athleteId: string;
    motoId: string;
    position?: number;
  }) {
    if (!match?.id) return;

    const key = `${args.athleteId}:${args.motoId}`;
    setScoreSavingKey(key);

    try {
      const existing = getResultForAthleteMoto(args.athleteId, args.motoId);

      let res: Response;

      if (existing?.id) {
        res = await apiFetch(`/results/${existing.id}`, {
          method: "PUT",
          body: {
            athleteId: args.athleteId,
            position: args.position,
          },
        });
      } else {
        res = await apiFetch(`/results`, {
          method: "POST",
          body: {
            matchId: match.id,
            motoId: args.motoId,
            athleteId: args.athleteId,
            position: args.position,
          },
        });
      }

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(j?.message)
          ? j.message.join(" • ")
          : j?.message || "Failed to save result";
        throw new Error(msg);
      }

      await fetchResults(match.id);
      await fetchFinalStandings(match.id);
    } catch (e: any) {
      console.error("saveAthleteMotoResult error:", e);
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to save result",
      });
    } finally {
      setScoreSavingKey(null);
    }
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

  const chipsDisabled = !!match?.isFinalized || racersSaving;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage Class Match</h1>
          <p className="text-sm text-zinc-400">
            Create the class match, attach racers, schedule, build motos, and
            enter results.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
          onClick={() => navigate(`/organization/events/${eventId}/classes`)}
        >
          Back to Classes
        </Button>
      </div>

      {!loading && !match && (
        <Card className="space-y-4 border border-zinc-700 bg-zinc-900 p-6">
          <div className="mb-2 text-sm text-zinc-300">
            No match exists for this class. Create one to add racers and motos.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-zinc-300">Match name</Label>
              <Input
                value={name}
                disabled
                className="border-zinc-700 bg-zinc-900 text-white/90 disabled:opacity-100"
                placeholder={divisionName || "Class name"}
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-zinc-300">Scheduled date</Label>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-zinc-700 bg-zinc-900 text-white placeholder:text-white/60"
                placeholder="Select date/time"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-zinc-300">Racers</Label>
              <span className="text-xs text-zinc-500">
                {selectedAthletes.length} selected
              </span>
            </div>

            <Button
              variant="outline"
              className="border-zinc-700 bg-zinc-800 text-white/90 hover:bg-zinc-700"
              onClick={() => setAthleteModalOpen(true)}
            >
              Select racers ({selectedAthletes.length})
            </Button>

            {selectedAthletes.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-400">
                  Attached racers
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAthletes.map((a) => (
                    <RacerChip
                      key={a.id}
                      athlete={a}
                      onRemove={handleRemoveRacer}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-zinc-400">
                No racers selected yet.
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

      {!loading && match && (
        <>
          <Card className="border border-zinc-700 bg-zinc-900 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-lg font-semibold text-white">
                  {match.name}
                </div>
                <div className="text-sm text-zinc-400">
                  {fmtDate(match.scheduledDate)} • Racers: {racersCount}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                  onClick={() => setAthleteModalOpen(true)}
                  disabled={match.isFinalized || racersSaving}
                >
                  Edit Racers
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                    >
                      Edit Date
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-zinc-700 bg-zinc-950 text-white">
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
                          defaultValue={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="border-zinc-700 bg-zinc-900 text-white placeholder:text-white/60"
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
                    className="text-red-400 hover:bg-red-950/30 hover:text-red-300"
                  >
                    Delete
                  </Button>
                  <AlertDialogContent className="border-zinc-700 bg-zinc-950 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this match?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        This will remove the match from the class.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700">
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

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm text-zinc-300">Attached Racers</div>
                <div className="text-xs text-zinc-500">
                  {racersSaving
                    ? "Updating…"
                    : `${selectedAthletes.length} racer${selectedAthletes.length === 1 ? "" : "s"}`}
                </div>
              </div>

              {selectedAthletes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedAthletes.map((a) => (
                    <RacerChip
                      key={a.id}
                      athlete={a}
                      onRemove={handleRemoveRacer}
                      disabled={chipsDisabled}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-black/10 px-4 py-4 text-sm text-zinc-400">
                  No racers are attached to this class match yet.
                </div>
              )}

              {match.isFinalized ? (
                <div className="mt-3 text-xs text-zinc-500">
                  This match is finalized. Unfinalize it to edit racers.
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="border border-zinc-700 bg-zinc-900 p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-zinc-300">Motos & Results</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Add motos, enter racer finishes, and review overall standings.
                </div>
              </div>

              {!match?.isFinalized && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={newMotoSequence}
                    onChange={(e) => setNewMotoSequence(e.target.value)}
                    placeholder="Moto #"
                    className="w-28 border-zinc-700 bg-zinc-900 text-white"
                  />
                  <Button
                    onClick={handleCreateMoto}
                    className="bg-white text-black hover:bg-zinc-200"
                  >
                    Add Moto
                  </Button>
                </div>
              )}
            </div>

            {motosLoading || resultsLoading ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-zinc-400">
                Loading motos and results…
              </div>
            ) : motos.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-zinc-400">
                No motos created yet.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {motos.map((moto) => (
                    <div
                      key={moto.id}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      <span>Moto {moto.sequence}</span>
                      {!match?.isFinalized && (
                        <button
                          type="button"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteMoto(moto.id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                  <table className="min-w-[980px] w-full text-sm">
                    <thead className="bg-white/5">
                      <tr className="text-left text-zinc-300">
                        <th className="px-3 py-3 font-medium">Racer</th>
                        {motos.map((moto) => (
                          <React.Fragment key={moto.id}>
                            <th className="px-3 py-3 font-medium">
                              Moto {moto.sequence} Finish
                            </th>
                            <th className="px-3 py-3 font-medium">
                              Moto {moto.sequence} Points
                            </th>
                          </React.Fragment>
                        ))}
                        <th className="px-3 py-3 font-medium">Final Finish</th>
                        <th className="px-3 py-3 font-medium">
                          Overall Points
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedAthletes.map((athlete) => {
                        const final = getFinalForAthlete(athlete.id);

                        return (
                          <tr
                            key={athlete.id}
                            className="border-t border-white/10 text-white"
                          >
                            <td className="px-3 py-3 font-medium">
                              {athlete.name}
                            </td>

                            {motos.map((moto) => {
                              const r = getResultForAthleteMoto(
                                athlete.id,
                                moto.id,
                              );
                              const cellKey = `${athlete.id}:${moto.id}`;

                              return (
                                <React.Fragment key={moto.id}>
                                  <td className="px-3 py-3">
                                    <Input
                                      type="number"
                                      min={1}
                                      value={draftPositions[cellKey] ?? ""}
                                      disabled={!!match?.isFinalized}
                                      className="w-24 border-zinc-700 bg-zinc-900 text-white"
                                      onChange={(e) =>
                                        setDraftPositions((prev) => ({
                                          ...prev,
                                          [cellKey]: e.target.value,
                                        }))
                                      }
                                      onBlur={(e) => {
                                        const raw = e.target.value.trim();
                                        if (!raw) return;
                                        const pos = Number(raw);
                                        if (!Number.isFinite(pos) || pos < 1)
                                          return;

                                        saveAthleteMotoResult({
                                          athleteId: athlete.id,
                                          motoId: moto.id,
                                          position: pos,
                                        });
                                      }}
                                    />
                                  </td>

                                  <td className="px-3 py-3 text-zinc-300">
                                    {scoreSavingKey === cellKey
                                      ? "Saving..."
                                      : (r?.score ?? "—")}
                                  </td>
                                </React.Fragment>
                              );
                            })}

                            <td className="px-3 py-3 font-semibold">
                              {final?.overallPosition ?? "—"}
                            </td>
                            <td className="px-3 py-3 font-semibold">
                              {final?.totalPoints ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs text-zinc-500">
                  Enter finish positions per moto. Points and overall standings
                  refresh automatically after save.
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      <AthleteSearchModal
        open={athleteModalOpen}
        onClose={() => setAthleteModalOpen(false)}
        onPick={(a) => {
          addAthleteObj({ id: a.id, name: a.name, location: a.location });

          if (match) {
            const nextIds = Array.from(
              new Set([
                ...selectedAthletes.map((x) => String(x.id)),
                String(a.id),
              ]),
            );

            handleEditRacers(nextIds);
          }
        }}
      />
    </div>
  );
}
