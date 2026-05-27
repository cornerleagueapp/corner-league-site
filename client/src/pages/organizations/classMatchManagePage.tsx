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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  CalendarDays,
  Flag,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trophy,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

const RACE_POINTS: Record<number, number> = {
  1: 60,
  2: 53,
  3: 48,
  4: 43,
  5: 39,
  6: 36,
  7: 33,
  8: 30,
  9: 27,
  10: 24,
  11: 21,
  12: 18,
  13: 16,
  14: 14,
  15: 12,
  16: 10,
  17: 8,
  18: 6,
  19: 4,
  20: 2,
};

const RESULT_STATUS_API = {
  DNF: "DID NOT FINISH",
  DNS: "DID NOT START",
} as const;

const RESULT_STATUS_LABEL = {
  "DID NOT FINISH": "DNF",
  "DID NOT START": "DNS",
} as const;

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

  athleteId?: string | null;
  motoId?: string | null;
  matchId?: string | null;
  teamId?: string | null;

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
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
        disabled
          ? "border-white/10 bg-white/5 text-white/60"
          : "border-cyan-300/15 bg-cyan-300/10 text-cyan-100"
      }`}
    >
      <span className="truncate">
        {athlete.name}
        {athlete.origin ? ` • ${athlete.origin}` : ""}
      </span>

      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${athlete.name}`}
          className="shrink-0 text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
      const parsed = Array.isArray(list)
        ? list.map((r: any) => ({
            ...r,
            athleteId: r?.athleteId ?? r?.athlete?.id ?? null,
            motoId: r?.motoId ?? r?.moto?.id ?? null,
            matchId: r?.matchId ?? r?.match?.id ?? null,
            teamId: r?.teamId ?? r?.team?.id ?? null,
          }))
        : [];

      setResults(parsed);

      const nextDrafts: Record<string, string> = {};
      parsed.forEach((r: ResultLite) => {
        const athleteId = r?.athleteId ?? r?.athlete?.id;
        const motoId = r?.motoId ?? r?.moto?.id;
        if (!athleteId || !motoId) return;

        if (r.status === "DID NOT FINISH" || r.status === "DID NOT START") {
          nextDrafts[`${athleteId}:${motoId}`] =
            RESULT_STATUS_LABEL[r.status as keyof typeof RESULT_STATUS_LABEL];
          return;
        }

        if (r.position != null) {
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

    const finalizeRes = await apiFetch(`/match/finalize/${match.id}`, {
      method: "POST",
    });
    const finalizeJson = await finalizeRes.json().catch(() => ({}));

    if (!finalizeRes.ok) {
      return toast({
        variant: "destructive",
        title: "Error",
        description: finalizeJson?.message || "Finalize failed",
      });
    }

    const aggregateRes = await apiFetch(
      `/results/final-aggregate-results/${match.id}`,
      {
        method: "GET",
      },
    );
    const aggregateJson = await aggregateRes.json().catch(() => ({}));

    if (!aggregateRes.ok) {
      return toast({
        variant: "destructive",
        title: "Finalized, but standings failed",
        description:
          aggregateJson?.message ||
          "Match was finalized, but final standings were not persisted.",
      });
    }

    toast({ title: "Match finalized" });
    await fetchByDivision();
    await fetchResults(match.id);
    await fetchFinalStandings(match.id);
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

  async function handleUpdateMotoSequence(motoId: string, sequence: number) {
    try {
      const res = await apiFetch(`/motos/${motoId}`, {
        method: "PUT",
        body: { sequence },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to update moto");

      toast({ title: "Moto updated" });
      if (match?.id) {
        await fetchMotos(match.id);
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Failed to update moto",
      });
    }
  }

  async function handleDeleteMoto(motoId: string) {
    if (!match?.id) return;

    try {
      const motoResults = results.filter(
        (r) => String(r.motoId ?? r.moto?.id ?? "") === String(motoId),
      );

      for (const result of motoResults) {
        const res = await apiFetch(`/results/${result.id}`, {
          method: "DELETE",
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(j?.message || "Failed to delete moto results");
        }
      }

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
    return results.find((r) => {
      const rAthleteId = String(r.athleteId ?? r.athlete?.id ?? "");
      const rMotoId = String(r.motoId ?? r.moto?.id ?? "");
      return rAthleteId === String(athleteId) && rMotoId === String(motoId);
    });
  }

  function getFinalForAthlete(athleteId: string) {
    return finalStandings.find(
      (f) => String(f.athlete?.id) === String(athleteId),
    );
  }

  async function saveAthleteMotoResult(args: {
    athleteId: string;
    motoId: string;
    position?: number | null;
    status?: "DNF" | "DNS" | null;
  }) {
    if (!match?.id) return;

    const key = `${args.athleteId}:${args.motoId}`;
    setScoreSavingKey(key);

    try {
      const existing = getResultForAthleteMoto(args.athleteId, args.motoId);

      const mappedStatus = args.status ? RESULT_STATUS_API[args.status] : null;

      const createPayload = {
        matchId: match.id,
        motoId: args.motoId,
        athleteId: args.athleteId,
        position: mappedStatus ? null : (args.position ?? null),
        status: mappedStatus,
      };

      const updatePayload = {
        athleteId: args.athleteId,
        position: mappedStatus ? null : (args.position ?? null),
        status: mappedStatus,
      };

      let res: Response;

      if (existing?.id) {
        res = await apiFetch(`/results/${existing.id}`, {
          method: "PUT",
          body: updatePayload,
        });
      } else {
        res = await apiFetch(`/results`, {
          method: "POST",
          body: createPayload,
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
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 pb-24 sm:px-6 sm:py-12 lg:px-8">
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
                onClick={() =>
                  navigate(`/organization/events/${eventId}/classes`)
                }
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Classes
              </button>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Admin Match
                </div>

                <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  {match?.isFinalized ? "Finalized" : "Editable"}
                </div>
              </div>

              <h1 className="max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Manage Class{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Match
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Create the class match, attach racers, schedule motos, and enter
                results.
              </p>
            </div>

            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.14)]">
              <Flag className="h-6 w-6" />
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-6 text-sm text-white/60">
            Loading match…
          </Card>
        ) : null}

        {!loading && !match && (
          <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <Plus className="h-5 w-5" />
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
                    Create Match
                  </div>
                  <p className="mt-1 text-sm text-white/55">
                    No match exists for this class yet.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                    Match name
                  </Label>
                  <Input
                    value={name}
                    disabled
                    className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white/90 disabled:opacity-100"
                    placeholder={divisionName || "Class name"}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                    Scheduled date
                  </Label>
                  <Input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                    placeholder="Select date/time"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                    Racers
                  </Label>
                  <span className="text-xs text-white/45">
                    {selectedAthletes.length} selected
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="h-12 rounded-full border-cyan-300/15 bg-cyan-300/10 px-5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 hover:bg-cyan-300/15 hover:text-white"
                  onClick={() => setAthleteModalOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Select racers ({selectedAthletes.length})
                </Button>

                {selectedAthletes.length > 0 ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3">
                    <div className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-white/45">
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
                  <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/50">
                    No racers selected yet.
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-white/10 pt-5">
                <Button
                  className="h-12 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200"
                  disabled={saving}
                  onClick={handleUpsert}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Creating…" : "Create Match"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!loading && match && (
          <>
            <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
              <div className="border-b border-white/10 p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                      {match.name}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/55">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-cyan-200" />
                        {fmtDate(match.scheduledDate)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#FFB199]" />
                        Racers: {racersCount}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    <Button
                      variant="outline"
                      className="h-11 rounded-full border-cyan-300/15 bg-cyan-300/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-cyan-100 hover:bg-cyan-300/15 hover:text-white"
                      onClick={() => setAthleteModalOpen(true)}
                      disabled={match.isFinalized || racersSaving}
                    >
                      Edit Racers
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-11 rounded-full border-white/10 bg-white/[0.05] px-4 text-xs font-black uppercase tracking-[0.12em] text-white/75 hover:bg-white/10 hover:text-white"
                        >
                          Edit Date
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="rounded-[28px] border border-cyan-300/10 bg-[#07111F] text-white shadow-[0_30px_90px_rgba(0,0,0,0.52)]">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                            Edit Match
                          </DialogTitle>
                          <DialogDescription className="text-slate-300">
                            Update the schedule.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-3">
                          <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                              Date
                            </Label>
                            <Input
                              type="datetime-local"
                              defaultValue={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <DialogClose asChild>
                            <Button
                              className="h-11 rounded-full bg-cyan-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-[#06111d] hover:bg-cyan-200"
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
                        className="h-11 rounded-full bg-emerald-500 px-4 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-emerald-600"
                        onClick={handleFinalize}
                      >
                        Finalize
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-11 rounded-full border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-[#FFB199] hover:bg-[#FF6B35]/15"
                        onClick={handleUnfinalize}
                      >
                        Unfinalize
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-11 rounded-full border border-red-400/15 bg-red-500/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-red-200 hover:bg-red-500/20 hover:text-red-100"
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent className="rounded-[28px] border border-cyan-300/10 bg-[#07111F] text-white shadow-[0_30px_90px_rgba(0,0,0,0.52)]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-black uppercase tracking-[-0.02em] text-white">
                            Delete this match?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-300">
                            This will remove the match from the class.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full border border-white/10 bg-white/[0.05] px-5 text-white hover:bg-white/10">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="rounded-full bg-red-500 px-5 text-white hover:bg-red-600"
                            onClick={handleDelete}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      Attached Racers
                    </div>
                    <div className="text-xs text-white/45">
                      {racersSaving
                        ? "Updating…"
                        : `${selectedAthletes.length} racer${
                            selectedAthletes.length === 1 ? "" : "s"
                          }`}
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
                    <div className="rounded-[18px] border border-dashed border-white/10 bg-black/10 px-4 py-4 text-sm text-white/50">
                      No racers are attached to this class match yet.
                    </div>
                  )}

                  {match.isFinalized ? (
                    <div className="mt-3 text-xs text-white/45">
                      This match is finalized. Unfinalize it to edit racers.
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
              <div className="border-b border-white/10 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
                      Motos & Results
                    </div>
                    <div className="mt-1 text-sm text-white/55">
                      Add motos, enter racer finishes, and review overall
                      standings.
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
                        className="h-11 w-28 rounded-full border-white/10 bg-white/[0.055] text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                      />
                      <Button
                        onClick={handleCreateMoto}
                        className="h-11 rounded-full bg-cyan-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-[#06111d] hover:bg-cyan-200"
                      >
                        Add Moto
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {motosLoading || resultsLoading ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-6 text-sm text-white/55">
                    Loading motos and results…
                  </div>
                ) : motos.length === 0 ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-6 text-sm text-white/55">
                    No motos created yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {motos.map((moto) => (
                        <div
                          key={moto.id}
                          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100"
                        >
                          <span>Moto {moto.sequence}</span>

                          {!match?.isFinalized && (
                            <>
                              <button
                                type="button"
                                className="text-white/70 hover:text-white"
                                onClick={() => {
                                  const next = window.prompt(
                                    "Enter new moto number",
                                    String(moto.sequence),
                                  );
                                  if (!next) return;
                                  const seq = Number(next);
                                  if (!Number.isFinite(seq) || seq < 1) return;
                                  handleUpdateMotoSequence(moto.id, seq);
                                }}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="text-red-300 hover:text-red-200"
                                onClick={() => handleDeleteMoto(moto.id)}
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="overflow-x-auto rounded-[22px] border border-white/10 bg-white/[0.04]">
                      <table className="w-full min-w-[980px] text-sm">
                        <thead className="bg-white/[0.05]">
                          <tr className="text-left text-white/65">
                            <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.14em]">
                              Racer
                            </th>
                            {motos.map((moto) => (
                              <React.Fragment key={moto.id}>
                                <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.14em]">
                                  Moto {moto.sequence} Finish
                                </th>
                                <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.14em]">
                                  Moto {moto.sequence} Points
                                </th>
                              </React.Fragment>
                            ))}
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
                                <td className="px-3 py-3 font-semibold">
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
                                        <div className="flex items-center gap-2">
                                          <Input
                                            value={
                                              draftPositions[cellKey] ??
                                              (r?.status === "DID NOT FINISH" ||
                                              r?.status === "DID NOT START"
                                                ? RESULT_STATUS_LABEL[
                                                    r.status as keyof typeof RESULT_STATUS_LABEL
                                                  ]
                                                : r?.position != null
                                                  ? String(r.position)
                                                  : "")
                                            }
                                            disabled={!!match?.isFinalized}
                                            className="h-10 w-24 rounded-[12px] border-white/10 bg-[#030913] text-white focus-visible:ring-cyan-300/30"
                                            placeholder="1 / DNF / DNS"
                                            onChange={(e) =>
                                              setDraftPositions((prev) => ({
                                                ...prev,
                                                [cellKey]:
                                                  e.target.value.toUpperCase(),
                                              }))
                                            }
                                            onBlur={(e) => {
                                              const raw = e.target.value
                                                .trim()
                                                .toUpperCase();
                                              if (!raw) return;

                                              if (
                                                raw === "DNF" ||
                                                raw === "DNS"
                                              ) {
                                                saveAthleteMotoResult({
                                                  athleteId: athlete.id,
                                                  motoId: moto.id,
                                                  status: raw,
                                                  position: null,
                                                });
                                                return;
                                              }

                                              const pos = Number(raw);
                                              if (
                                                !Number.isFinite(pos) ||
                                                pos < 1
                                              )
                                                return;

                                              saveAthleteMotoResult({
                                                athleteId: athlete.id,
                                                motoId: moto.id,
                                                position: pos,
                                                status: null,
                                              });
                                            }}
                                          />

                                          {!match?.isFinalized && (
                                            <select
                                              className="h-10 rounded-[12px] border border-white/10 bg-[#030913] px-2 text-sm text-white outline-none"
                                              value=""
                                              onChange={(e) => {
                                                const value = e.target.value as
                                                  | "DNF"
                                                  | "DNS"
                                                  | "";
                                                if (!value) return;

                                                setDraftPositions((prev) => ({
                                                  ...prev,
                                                  [cellKey]: value,
                                                }));

                                                saveAthleteMotoResult({
                                                  athleteId: athlete.id,
                                                  motoId: moto.id,
                                                  status: value,
                                                  position: null,
                                                });
                                              }}
                                            >
                                              <option
                                                className="bg-[#030913]"
                                                value=""
                                              >
                                                Status
                                              </option>
                                              <option
                                                className="bg-[#030913]"
                                                value="DNF"
                                              >
                                                DNF
                                              </option>
                                              <option
                                                className="bg-[#030913]"
                                                value="DNS"
                                              >
                                                DNS
                                              </option>
                                            </select>
                                          )}
                                        </div>
                                      </td>

                                      <td className="px-3 py-3 text-white/70">
                                        {scoreSavingKey === cellKey
                                          ? "Saving..."
                                          : r?.status === "DID NOT FINISH" ||
                                              r?.status === "DID NOT START"
                                            ? `0 (${
                                                RESULT_STATUS_LABEL[
                                                  r.status as keyof typeof RESULT_STATUS_LABEL
                                                ]
                                              })`
                                            : (r?.score ??
                                              (typeof r?.position === "number"
                                                ? (RACE_POINTS[r.position] ??
                                                  "—")
                                                : "—"))}
                                      </td>
                                    </React.Fragment>
                                  );
                                })}

                                {/* <td className="px-3 py-3 font-semibold">
                                  {final?.overallPosition ?? "—"}
                                </td>
                                <td className="px-3 py-3 font-semibold">
                                  {final?.totalPoints ?? "—"}
                                </td> */}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-[18px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-4 py-3 text-xs leading-6 text-[#FFB199]/80">
                      Enter finish positions per moto. Points and overall
                      standings refresh automatically after save.
                    </div>
                  </div>
                )}
              </div>
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
      </main>
    </div>
  );
}
