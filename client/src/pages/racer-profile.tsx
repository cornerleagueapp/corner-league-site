// src/pages/racer-profile.tsx
import React, { useEffect, useState } from "react";
import { PageSEO } from "@/seo/usePageSEO";
import { apiRequest } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";
import { X as XIcon, Search as SearchIcon, PencilLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import RacerSearchModal from "@/components/RacerSearchModal";

type Racer = {
  id: string | number;
  athleteId?: string;
  racerName: string;
  racerAge?: number;
  bio?: string | null;
  racerImage?: string | null;
  location?: string | null;
  boatManufacturers?: string | null;
  careerWins?: number;
  seasonWins?: number;
  seasonPodiums?: number;
  careerWorldFinalsWins?: number;
  height?: number | null;
  weight?: number | null;
};

function inchesToMeters(inches: number) {
  return inches * 0.0254;
}
function metersToFeetInches(m?: number | null) {
  if (!m && m !== 0) return null;
  const totalIn = Math.round(m / 0.0254);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;
  return `${ft}′${inch}″`;
}

function logRequestError(ctx: string, err: any, endpoint?: string, body?: any) {
  try {
    console.groupCollapsed(`%c${ctx} failed`, "color:#f7768e;font-weight:bold");
    console.log("endpoint:", endpoint);
    console.log("sent body:", body);
    console.log("err.status:", err?.status);
    console.log("err.message:", err?.message);
    console.log("err.data (raw):", err?.data);
    if (err?.data && typeof err.data === "object") {
      console.log("err.data (json):", JSON.stringify(err.data, null, 2));
    }
    console.groupEnd();
  } catch {}
}

function humanizeValidationError(err: any): string | undefined {
  const d = err?.data;
  if (typeof d === "string" && d.trim()) return d;
  if (d && Array.isArray(d.message)) {
    const lines: string[] = [];
    for (const m of d.message) {
      if (typeof m === "string") lines.push(m);
      else if (m && typeof m === "object") {
        const prop = m.property ? `${m.property}: ` : "";
        const constraints = m.constraints
          ? Object.values(m.constraints).join("; ")
          : JSON.stringify(m);
        lines.push(`${prop}${constraints}`);
      }
    }
    if (lines.length) return lines.join(" • ");
  }
  if (d?.error && typeof d.error === "string") return d.error;
  if (d?.message && typeof d.message === "string") return d.message;
  return undefined;
}

function isProbablyId(s: string) {
  if (!s) return false;
  if (/^[0-9a-fA-F-]{32,}$/.test(s) && s.includes("-")) return true;
  if (/^[0-9A-Za-z]{20,}$/.test(s)) return true;
  return false;
}

async function uploadAthleteImage(athleteId: string, file: File) {
  const form = new FormData();
  form.append("media", file);

  const res = await apiRequest<any>(
    "POST",
    `/athletes/upload-image/${encodeURIComponent(athleteId)}`,
    form as any
  );

  const url = res?.mediaUrl ?? res?.data?.mediaUrl ?? res?.url ?? null;
  if (!url) throw new Error("Upload succeeded but no mediaUrl returned");
  return String(url);
}

async function pollUploadProgress(
  fileName: string,
  onTick: (pct: number) => void
) {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    try {
      const data = await apiRequest<{ progress: number }>(
        "GET",
        `/athletes/upload-progress/${encodeURIComponent(fileName)}`
      );
      const pct = Math.max(0, Math.min(100, Number(data?.progress ?? 0)));
      onTick(pct);
      if (pct >= 100) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 700));
  }
}

export default function RacerProfilePage({
  idOrSlugParam,
}: {
  idOrSlugParam?: string;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [racer, setRacer] = useState<Racer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchById(detailId: string) {
      const res = await apiRequest<any>(
        "GET",
        `/jet-ski-racer-details/${encodeURIComponent(detailId)}`
      );
      const rec =
        res?.racer ?? res?.data?.racer ?? res?.data ?? res?.item ?? res;
      if (!rec) throw new Error("not_found");

      const a = rec.athlete ?? {};
      const mapped: Racer = {
        id: rec?.id ?? a?.id,
        athleteId: a.id,
        racerName: a.name ?? rec.name ?? "",
        racerAge: a.age ?? rec.age ?? undefined,
        bio: a.bio ?? rec.bio ?? null,
        racerImage: a.image ?? rec.image ?? null,
        location: a.origin ?? rec.origin ?? null,
        boatManufacturers: rec.boatManufacturers ?? rec.team?.name ?? null,
        careerWins: rec.careerWins ?? 0,
        seasonWins: rec.seasonWins ?? 0,
        seasonPodiums: rec.seasonPodiums ?? 0,
        careerWorldFinalsWins:
          rec.careerWordFinalsWins ?? rec.careerWorldFinalsWins ?? 0,
        height: rec.height ?? a.height ?? null,
        weight: a.weight ?? rec.weight ?? null,
      };
      return mapped;
    }

    async function pageOnce(skip: number) {
      const p = new URLSearchParams();
      p.set("skip", String(skip));
      p.set("limit", String(50));
      p.set("order", "DESC");
      const res = await apiRequest<any>("GET", `/jet-ski-racer-details?${p}`);
      const buckets = [
        res?.racers,
        res?.data?.racers,
        res?.items,
        res?.data?.items,
        Array.isArray(res) ? res : null,
      ].filter(Boolean) as any[];
      return (buckets.find(Array.isArray) as any[]) ?? [];
    }

    async function findBySlug(slug: string) {
      const targetName = slug.replace(/-/g, " ").trim();
      const lc = targetName.toLowerCase();
      const MAX_PAGES = 10;
      for (let page = 0; page < MAX_PAGES; page++) {
        const raw = await pageOnce(page * 50);
        const hit =
          raw.find(
            (r: any) =>
              (r?.athlete?.name || r?.name || "")
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-") === slug
          ) ||
          raw.find(
            (r: any) =>
              (r?.athlete?.name || r?.name || "")
                .toString()
                .trim()
                .toLowerCase() === lc
          );
        if (hit) return hit;
        if (raw.length < 50) break;
      }
      return null;
    }

    function mapLiteToRacer(match: any): Racer {
      const a = match?.athlete ?? {};
      return {
        id: match?.id ?? a?.id,
        athleteId: a.id,
        racerName: a?.name ?? match?.name ?? "",
        racerAge: a?.age ?? match?.age ?? undefined,
        bio: a?.bio ?? match?.bio ?? null,
        racerImage: a?.image ?? match?.image ?? null,
        location: a?.origin ?? match?.origin ?? null,
        boatManufacturers:
          match?.boatManufacturers ?? match?.team?.name ?? null,
        careerWins: match?.careerWins ?? 0,
        seasonWins: match?.seasonWins ?? 0,
        seasonPodiums: match?.seasonPodiums ?? 0,
        careerWorldFinalsWins:
          match?.careerWordFinalsWins ?? match?.careerWF ?? 0,
        height: match?.height ?? a?.height ?? null,
        weight: a?.weight ?? match?.weight ?? null,
      };
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const token = decodeURIComponent(idOrSlugParam || "").trim();
        if (!token) throw new Error("Racer not found");

        if (isProbablyId(token)) {
          try {
            const mapped = await fetchById(token);
            if (!cancelled) {
              setRacer(mapped);
              setLoading(false);
              return;
            }
          } catch (e: any) {}
        }

        const asSlug = token
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const match = await findBySlug(asSlug);
        if (!match) throw new Error("Racer not found");

        const mapped = mapLiteToRacer(match);
        if (!cancelled) setRacer(mapped);
      } catch (e: any) {
        const msg =
          e?.message ||
          e?.data?.message ||
          e?.data?.error ||
          "Failed to load racer";
        setErr(/not found/i.test(msg) ? "Racer not found" : String(msg));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idOrSlugParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white grid place-items-center">
        <PageSEO title="Racer • Corner League" />
        <div className="animate-pulse text-white/70">Loading racer…</div>
      </div>
    );
  }

  if (err || !racer) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white grid place-items-center">
        <PageSEO title="Racer • Corner League" />
        <div className="text-center space-y-3">
          <div className="text-xl font-semibold">Couldn’t load this racer</div>
          <div className="text-white/70">{err || "Not found"}</div>
          <Button
            onClick={() => window.history.back()}
            className="bg-white text-black"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Career Wins", value: racer.careerWins ?? 0, trophy: true },
    { label: "Season Wins", value: racer.seasonWins ?? 0 },
    { label: "Season Podiums", value: racer.seasonPodiums ?? 0 },
  ];

  const title = racer.racerName || "Racer";
  const heightChip = metersToFeetInches(racer.height);

  const chips = [
    racer.location && { label: racer.location },
    typeof racer.racerAge === "number" && { label: `${racer.racerAge} yrs` },
    heightChip && { label: heightChip },
    racer.boatManufacturers && { label: racer.boatManufacturers },
  ].filter(Boolean) as { label: string }[];

  function buildUpdateBody(
    r: Racer,
    edited: {
      age?: number;
      bio?: string;
      heightMeters?: number;
      origin?: string;
      boatManufacturers?: string;
    }
  ) {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const body: Record<string, any> = {};
    if (r.racerName && r.racerName.trim()) body.name = r.racerName.trim();
    if (typeof edited.age === "number" && Number.isFinite(edited.age))
      body.age = edited.age;
    if (edited.bio && edited.bio.trim()) body.bio = edited.bio.trim();
    if (
      typeof edited.heightMeters === "number" &&
      Number.isFinite(edited.heightMeters) &&
      edited.heightMeters > 0
    )
      body.height = round2(edited.heightMeters);
    if (edited.origin && edited.origin.trim())
      body.origin = edited.origin.trim();
    if (edited.boatManufacturers && edited.boatManufacturers.trim())
      body.boatManufacturers = edited.boatManufacturers.trim();
    return body;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-white">
      <PageSEO title={`${title} • Corner League`} />

      {/* top-right search */}
      <div className="mx-auto max-w-5xl px-4 pt-4 flex justify-end">
        <button
          onClick={() => setSearchOpen(true)}
          className="h-9 w-9 grid place-items-center rounded-full bg-white/10 border border-white/10 hover:bg-white/15"
          aria-label="Search racers"
        >
          <SearchIcon size={18} />
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-4 mt-8">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-amber-400 inline-block self-center sm:self-auto">
            <img
              src={racer.racerImage || stockAvatar}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== stockAvatar) img.src = stockAvatar;
              }}
              className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover bg-black"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-center sm:text-left">
              {title}
            </h1>

            <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {chips.length === 0 ? (
                <p className="text-sm text-white/70">AQUA Racer</p>
              ) : (
                chips.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full border border-white/10 text-[11px] text-white/90"
                  >
                    {c.label}
                  </span>
                ))
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((s) => (
                <StatBox
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  trophy={s.trophy}
                />
              ))}
            </div>
          </div>

          <div className="flex w-full gap-2 self-center sm:self-end sm:w-auto justify-center sm:justify-end">
            <Button
              onClick={() => setEditOpen(true)}
              className="h-11 sm:h-9 sm:w-auto bg-white/10 text-white border border-white/20 hover:bg-white/15"
            >
              <PencilLine className="mr-2 h-4 w-4" /> Edit
            </Button>

            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Copied to clipboard" });
                } catch {}
              }}
              className="h-11 sm:h-9 sm:w-auto bg-white text-black hover:bg-white/90"
            >
              Share
            </Button>
          </div>
        </div>

        {/* layout content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="order-2 lg:order-1 lg:col-span-1 space-y-6">
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="text-sm text-white/80 mb-2">About</div>
              <p className="text-white/80 text-sm whitespace-pre-wrap">
                {racer.bio || "Bio coming soon."}
              </p>
            </Card>

            <Card className="bg-white/5 border-white/10 p-4">
              <div className="text-sm text-white/80 mb-3">World Finals</div>
              <div className="grid grid-cols-2 gap-3 text-white/80">
                <MiniStat
                  label="Career WF Wins"
                  value={racer.careerWorldFinalsWins ?? 0}
                />
              </div>
            </Card>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-2 space-y-3">
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="text-white/80 text-sm">
                Race media & posts coming soon.
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-white text-black"
            aria-label="Close image"
          >
            <XIcon size={18} />
          </button>
          <img
            src={lightboxUrl}
            className="max-h-[85vh] max-w-[92vw] rounded-xl border border-white/10 object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* EDIT MODAL */}
      {editOpen && racer && (
        <EditRacerModal
          initial={{
            age: racer.racerAge ?? "",
            bio: racer.bio ?? "",
            heightInches:
              typeof racer.height === "number"
                ? Math.round(racer.height / 0.0254)
                : "",
            origin: racer.location ?? "",
            boatManufacturers: racer.boatManufacturers ?? "",
          }}
          onClose={() => setEditOpen(false)}
          onSave={async (vals) => {
            if (!racer?.id) return;

            const ageNum = toNumOrUndefined(vals.age);
            const heightInchesNum = toNumOrUndefined(vals.heightInches);

            const edited: {
              age?: number;
              bio?: string;
              heightMeters?: number;
              origin?: string;
              boatManufacturers?: string;
            } = {};

            if (typeof ageNum === "number" && ageNum !== racer.racerAge) {
              if (ageNum < 9 || ageNum > 100) {
                toast({
                  title: "Please fix the form",
                  description: "Age must be at least 9.",
                });
                return;
              }
              edited.age = ageNum;
            }

            const newBio = (vals.bio ?? "").trim();
            if (newBio !== (racer.bio ?? "")) {
              if (newBio) edited.bio = newBio;
            }

            if (typeof heightInchesNum === "number") {
              if (heightInchesNum < 36 || heightInchesNum > 96) {
                toast({
                  title: "Please fix the form",
                  description:
                    "Height must be between 36 and 96 inches (3′0″–8′0″).",
                });
                return;
              }
              const newMeters = parseFloat(
                inchesToMeters(heightInchesNum).toFixed(2)
              );
              const currentMeters =
                typeof racer.height === "number"
                  ? parseFloat(racer.height.toFixed(2))
                  : undefined;
              if (newMeters !== currentMeters) edited.heightMeters = newMeters;
            }

            const newOrigin = (vals.origin ?? "").trim();
            if (newOrigin !== (racer.location ?? "")) {
              if (newOrigin) edited.origin = newOrigin;
            }

            const newBoat = (vals.boatManufacturers ?? "").trim();
            if (newBoat !== (racer.boatManufacturers ?? "")) {
              if (newBoat) edited.boatManufacturers = newBoat;
            }

            const hasEdits = Object.keys(edited).length > 0;
            const hasImage = !!vals.imageFile && !!racer.athleteId;

            if (!hasEdits && !hasImage) {
              setEditOpen(false);
              return;
            }

            const endpoint = `/jet-ski-racer-details/${encodeURIComponent(
              String(racer.id)
            )}`;

            try {
              if (hasImage) {
                setUploadPct(0);
                void pollUploadProgress(vals.imageFile!.name, (p) =>
                  setUploadPct(p)
                );
                const mediaUrl = await uploadAthleteImage(
                  racer.athleteId!,
                  vals.imageFile!
                );
                setRacer((prev) =>
                  prev ? { ...prev, racerImage: mediaUrl } : prev
                );
                setUploadPct(100);
                toast({ title: "Photo uploaded" });
              }

              if (hasEdits) {
                const body = buildUpdateBody(racer, edited);
                const onlyName =
                  Object.keys(body).length === 1 && "name" in body;
                if (!onlyName) {
                  await apiRequest("PUT", endpoint, body);
                }

                setRacer((prev) =>
                  prev
                    ? {
                        ...prev,
                        racerAge:
                          typeof edited.age === "number"
                            ? edited.age
                            : prev.racerAge,
                        bio: edited.bio ?? prev.bio,
                        location: edited.origin ?? prev.location,
                        boatManufacturers:
                          edited.boatManufacturers ?? prev.boatManufacturers,
                        height:
                          typeof edited.heightMeters === "number"
                            ? edited.heightMeters
                            : prev.height,
                      }
                    : prev
                );
              }

              setEditOpen(false);
              setUploadPct(null);
              toast({ title: "Profile updated" });
            } catch (err: any) {
              setUploadPct(null);
              logRequestError("[RacerProfile] save", err, endpoint, edited);
              const nice =
                humanizeValidationError(err) ||
                err?.data?.message ||
                err?.data?.error ||
                err?.message ||
                "Validation error";
              toast({ title: "Update failed", description: String(nice) });
            }
          }}
          uploadPct={uploadPct}
        />
      )}

      {/* racer search modal */}
      <RacerSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectRacer={(r) => {
          setSearchOpen(false);
          const idStr = encodeURIComponent(String(r.id));
          navigate(`/racer/${idStr}`);
        }}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  trophy,
}: {
  label: string;
  value: number;
  trophy?: boolean;
}) {
  return (
    <div className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3">
      <div className="text-2xl font-semibold flex items-center gap-2">
        {value}
        {trophy && <span>🏆</span>}
      </div>
      <div className="text-sm text-white/70">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}

/* ---------- Edit modal + helpers (inline) ---------- */
type EditValues = {
  age?: number | string;
  bio?: string;
  heightInches?: number | string;
  origin?: string;
  boatManufacturers?: string;
  imageFile?: File | null;
};

function toNumOrUndefined(v: any): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function EditRacerModal({
  initial,
  onClose,
  onSave,
  uploadPct,
}: {
  initial: EditValues;
  onClose: () => void;
  onSave: (v: EditValues) => Promise<void> | void;
  uploadPct?: number | null;
}) {
  const [vals, setVals] = useState<EditValues>(initial);
  const [saving, setSaving] = useState(false);
  const set =
    (k: keyof EditValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setVals((p) => ({ ...p, [k]: e.target.value }));

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full h-full md:h-auto md:max-w-xl md:rounded-xl bg-[#0b0f18] border border-white/10 p-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button
            aria-label="Close"
            className="h-9 w-9 grid place-items-center rounded-full bg-white/10 border border-white/10 hover:bg-white/15"
            onClick={onClose}
            disabled={saving}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Age">
            <input
              inputMode="numeric"
              value={vals.age ?? ""}
              onChange={set("age")}
              className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40"
              placeholder="e.g., 25"
            />
          </Field>

          <Field label="Bio">
            <textarea
              value={vals.bio ?? ""}
              onChange={set("bio")}
              rows={4}
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
              placeholder="Tell people about you…"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Height (inches)">
              <input
                type="number"
                inputMode="numeric"
                min={36}
                max={96}
                step={1}
                value={vals.heightInches ?? ""}
                onChange={set("heightInches")}
                className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40"
                placeholder="e.g., 70"
              />
            </Field>

            <Field label="Origin">
              <input
                value={vals.origin ?? ""}
                onChange={set("origin")}
                className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40"
                placeholder="e.g., USA"
              />
            </Field>
          </div>

          <Field label="Boat Manufacturer">
            <input
              value={vals.boatManufacturers ?? ""}
              onChange={set("boatManufacturers")}
              className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40"
              placeholder="e.g., Yamaha"
            />
          </Field>

          <Field label="Profile Photo">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0] || null;
                setVals((p) => ({ ...p, imageFile: file }));
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(file ? URL.createObjectURL(file) : null);
              }}
              className="w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 py-1 text-sm text-white outline-none"
            />
          </Field>

          {vals.imageFile && previewUrl && (
            <img
              src={previewUrl}
              alt="Selected profile preview"
              className="h-28 w-28 rounded-full object-cover border border-white/10"
            />
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border border-white/10 bg-transparent text-white hover:bg-white/10"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                setSaving(true);
                await onSave(vals);
              } finally {
                setSaving(false);
              }
            }}
            className="bg-white text-black hover:bg-white/90"
            disabled={saving}
          >
            {saving
              ? uploadPct != null
                ? `Uploading… ${uploadPct}%`
                : "Saving…"
              : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs text-white/60 mb-1">{label}</div>
      {children}
    </label>
  );
}
