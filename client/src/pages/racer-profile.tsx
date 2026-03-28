import React, { useEffect, useState } from "react";
import { PageSEO } from "@/seo/usePageSEO";
import { apiRequest } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";
import {
  X as XIcon,
  Search as SearchIcon,
  PencilLine,
  Trophy,
  MapPin,
  Waves,
  Sparkles,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import RacerSearchModal from "@/components/RacerSearchModal";
import { generateRacerAnalysis } from "@/lib/geminiRacerAnalysis";

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
  claimedByUserId?: string | null;
  claimedByUsername?: string | null;
  isClaimed?: boolean;
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
    if (endpoint) console.log("endpoint:", endpoint);
    if (body) console.log("request body (sent):", body);
    console.log("err.status:", err?.status);
    console.log("err.message:", err?.message);
    console.log("err.body (raw):", err?.body);
    if (err?.body && typeof err.body === "object") {
      console.log("err.body (json):", JSON.stringify(err.body, null, 2));
    }
    console.groupEnd();
  } catch {}
}
function humanizeValidationError(err: any): string | undefined {
  const d = err?.body ?? err?.data;
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
function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapDetail(rec: any): Racer {
  const a = rec?.athlete ?? {};
  const claimedByUser = a?.claimedByUser ?? rec?.claimedByUser ?? null;

  return {
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
      rec.careerWorldFinalsWins ?? rec.careerWordFinalsWins ?? 0,
    height: rec.height ?? a.height ?? null,
    weight: a.weight ?? rec.weight ?? null,
    claimedByUserId: claimedByUser?.id ?? null,
    claimedByUsername: claimedByUser?.username ?? null,
    isClaimed: !!claimedByUser?.id,
  };
}

function mapAthlete(a: any): Racer {
  return {
    id: a?.id ?? a?._id ?? a?.uuid ?? "",
    athleteId: a?.id ?? a?._id ?? a?.uuid ?? "",
    racerName: a?.name ?? a?.fullName ?? a?.displayName ?? "",
    racerAge: a?.age ?? undefined,
    bio: a?.bio ?? null,
    racerImage: a?.image ?? a?.avatar ?? a?.photo ?? null,
    location: a?.origin ?? a?.country ?? a?.city ?? null,
    boatManufacturers: null,
    careerWins: 0,
    seasonWins: 0,
    seasonPodiums: 0,
    careerWorldFinalsWins: 0,
    height: a?.height ?? null,
    weight: a?.weight ?? null,
    claimedByUserId: a?.claimedByUser?.id ?? null,
    claimedByUsername: a?.claimedByUser?.username ?? null,
    isClaimed: !!a?.claimedByUser?.id,
  };
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
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="flex items-center gap-2 text-2xl font-semibold text-white">
        {value}
        {trophy ? <Trophy className="h-5 w-5 text-amber-400" /> : null}
      </div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/50">
        {label}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/50">
        {label}
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
      <div className="mb-1 text-xs text-white/60">{label}</div>
      {children}
    </label>
  );
}

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

async function uploadAthleteImage(
  athleteId: string,
  userId: string,
  file: File,
) {
  const form = new FormData();
  form.append("userId", userId);
  form.append("media", file);

  const res = await apiRequest<any>(
    "PATCH",
    `/athletes/${encodeURIComponent(athleteId)}/profile-image`,
    form as any,
  );

  const url = res?.mediaUrl ?? res?.data?.mediaUrl ?? res?.url ?? null;
  if (!url) throw new Error("Upload succeeded but no mediaUrl returned");
  return String(url);
}

async function pollUploadProgress(
  fileName: string,
  onTick: (pct: number) => void,
) {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    try {
      const data = await apiRequest<{ progress: number }>(
        "GET",
        `/athletes/upload-progress/${encodeURIComponent(fileName)}`,
      );
      const pct = Math.max(0, Math.min(100, Number(data?.progress ?? 0)));
      onTick(pct);
      if (pct >= 100) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 700));
  }
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto border border-white/10 bg-[#0b0f18] p-4 md:h-auto md:max-w-xl md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 hover:bg-white/15"
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
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/40"
              placeholder="e.g., 25"
            />
          </Field>

          <Field label="Bio">
            <textarea
              value={vals.bio ?? ""}
              onChange={set("bio")}
              rows={4}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
              placeholder="Tell people about you…"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Height (inches)">
              <input
                type="number"
                inputMode="numeric"
                min={36}
                max={96}
                step={1}
                value={vals.heightInches ?? ""}
                onChange={set("heightInches")}
                className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/40"
                placeholder="e.g., 70"
              />
            </Field>

            <Field label="Origin">
              <input
                value={vals.origin ?? ""}
                onChange={set("origin")}
                className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/40"
                placeholder="e.g., USA"
              />
            </Field>
          </div>

          <Field label="Boat Manufacturer">
            <input
              value={vals.boatManufacturers ?? ""}
              onChange={set("boatManufacturers")}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/40"
              placeholder="e.g., Yamaha"
            />
          </Field>

          <Field label="Racer Photo (Please use clear headshot)">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0] || null;
                if (file && !/^image\/(jpeg|png|webp)$/.test(file.type)) {
                  alert(
                    "Please upload a JPG, PNG, or WEBP image (no RAW / DNG).",
                  );
                  return;
                }
                setVals((p) => ({ ...p, imageFile: file }));
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(file ? URL.createObjectURL(file) : null);
              }}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-white outline-none"
            />
          </Field>

          {vals.imageFile && previewUrl && (
            <img
              src={previewUrl}
              alt="Selected profile preview"
              className="h-28 w-28 rounded-full border border-white/10 object-cover"
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

function ClaimAthleteModal({
  racerName,
  onClose,
  onSubmit,
  loading,
}: {
  racerName: string;
  onClose: () => void;
  onSubmit: (v: {
    additionalInfo?: string;
    idCardImage: File;
  }) => Promise<void> | void;
  loading?: boolean;
}) {
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [idCardImage, setIdCardImage] = useState<File | null>(null);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto border border-white/10 bg-[#0b0f18] p-4 md:h-auto md:max-w-xl md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Claim Athlete Profile
          </h2>
          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 hover:bg-white/15"
            onClick={onClose}
            disabled={loading}
          >
            <XIcon size={16} />
          </button>
        </div>

        <p className="mb-4 text-sm text-white/70">
          Submit a claim for{" "}
          <span className="font-medium text-white">{racerName}</span>. Upload a
          clear ID image so an admin can verify ownership.
        </p>

        <div className="space-y-3">
          <Field label="Additional Info (optional)">
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
              placeholder="Add any details that help verify this athlete profile..."
            />
          </Field>

          <Field label="ID Card Image">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0] || null;
                if (!file) {
                  setIdCardImage(null);
                  return;
                }
                if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
                  alert("Please upload a JPG, PNG, or WEBP image.");
                  return;
                }
                setIdCardImage(file);
              }}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-white outline-none"
            />
          </Field>

          {!idCardImage && (
            <p className="text-xs text-red-300">
              An ID card image is required to submit a claim.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border border-white/10 bg-transparent text-white hover:bg-white/10"
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={async () => {
              if (!idCardImage) return;
              await onSubmit({ additionalInfo, idCardImage });
            }}
            className="bg-white text-black hover:bg-white/90"
            disabled={loading || !idCardImage}
          >
            {loading ? "Submitting..." : "Submit Claim"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RacerProfilePage({
  idOrSlugParam,
}: {
  idOrSlugParam?: string;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  const currentUserId = user?.id ? String(user.id) : null;

  const [racer, setRacer] = useState<Racer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const [claimStatus, setClaimStatus] = useState<{
    hasClaim: boolean;
    status?: "pending" | "approved" | "rejected";
    claimId?: string;
  } | null>(null);

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisErr, setAnalysisErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function getJSON<T = any>(
      method: "GET" | "PUT",
      path: string,
      body?: any,
    ): Promise<T> {
      return apiRequest<T>(method, path, body);
    }

    async function fetchDetailById(id: string) {
      const res = await getJSON<any>(
        "GET",
        `/jet-ski-racer-details/${encodeURIComponent(id)}`,
      );
      const rec =
        res?.racer ?? res?.data?.racer ?? res?.data ?? res?.item ?? res;
      if (!rec) throw new Error("not_found");
      return mapDetail(rec);
    }

    async function searchDetailsByName(name: string) {
      try {
        const q = new URLSearchParams();
        q.set("search", name);
        q.set("limit", "25");
        q.set("order", "DESC");
        const res = await getJSON<any>(
          "GET",
          `/jet-ski-racer-details?${q.toString()}`,
        );
        const arr =
          res?.racers ??
          res?.data?.racers ??
          res?.items ??
          res?.data?.items ??
          (Array.isArray(res) ? res : []);
        const lc = name.toLowerCase();
        const slug = slugify(name);
        const best =
          arr.find(
            (r: any) =>
              String(r?.athlete?.name ?? r?.name ?? "")
                .trim()
                .toLowerCase() === lc,
          ) ||
          arr.find(
            (r: any) =>
              slugify(String(r?.athlete?.name ?? r?.name ?? "")) === slug,
          ) ||
          arr[0];
        if (best) return mapDetail(best);
      } catch {}
      return null;
    }

    async function scanDetailsBySlug(slug: string) {
      const LIMIT = 50;
      const MAX_PAGES = 10;
      for (let page = 0; page < MAX_PAGES; page++) {
        const p = new URLSearchParams();
        p.set("skip", String(page * LIMIT));
        p.set("limit", String(LIMIT));
        p.set("order", "DESC");
        const res = await getJSON<any>("GET", `/jet-ski-racer-details?${p}`);
        const arr =
          res?.racers ??
          res?.data?.racers ??
          res?.items ??
          res?.data?.items ??
          (Array.isArray(res) ? res : []);
        const hit =
          arr.find(
            (r: any) =>
              slugify(String(r?.athlete?.name ?? r?.name ?? "")) === slug,
          ) ||
          arr.find(
            (r: any) =>
              String(r?.athlete?.name ?? r?.name ?? "")
                .trim()
                .toLowerCase() === slug.replace(/-/g, " "),
          );
        if (hit) return mapDetail(hit);
        if (arr.length < LIMIT) break;
      }
      return null;
    }

    async function fetchAthleteById(aid: string) {
      const res = await getJSON<any>(
        "GET",
        `/athletes/${encodeURIComponent(aid)}`,
      );
      const a =
        res?.athlete ?? res?.data?.athlete ?? res?.data ?? res?.item ?? res;
      if (!a) throw new Error("not_found");
      return mapAthlete(a);
    }

    async function searchAthletesByName(name: string) {
      try {
        const q = new URLSearchParams();
        q.set("search", name);
        q.set("limit", "10");
        q.set("order", "DESC");
        const res = await getJSON<any>("GET", `/athletes?${q.toString()}`);
        const arr =
          res?.athletes ??
          res?.data?.athletes ??
          res?.items ??
          (Array.isArray(res) ? res : []);
        if (!Array.isArray(arr) || !arr.length) return null;
        const lc = name.toLowerCase();
        const best =
          arr.find(
            (a: any) =>
              String(a?.name ?? "")
                .trim()
                .toLowerCase() === lc,
          ) ?? arr[0];
        return mapAthlete(best);
      } catch {
        return null;
      }
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const token = decodeURIComponent(idOrSlugParam || "").trim();
        if (!token) throw new Error("Racer not found");

        const url = new URL(window.location.href);
        const kind = url.searchParams.get("kind");

        if (kind === "athlete" && isProbablyId(token)) {
          try {
            const athlete = await fetchAthleteById(token);
            if (!cancelled) {
              setRacer(athlete);
              return;
            }
          } catch {}
        }

        if (isProbablyId(token)) {
          try {
            const detail = await fetchDetailById(token);
            if (!cancelled) {
              setRacer(detail);
              return;
            }
          } catch {}
        }

        const nameSlug = slugify(token);
        let bySearch = await searchDetailsByName(token);
        if (!bySearch) bySearch = await scanDetailsBySlug(nameSlug);

        if (bySearch) {
          if (!cancelled) setRacer(bySearch);
          return;
        }

        const athleteFallback = await searchAthletesByName(token);
        if (athleteFallback) {
          if (!cancelled) setRacer(athleteFallback);
          return;
        }

        throw new Error("Racer not found");
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

  useEffect(() => {
    if (!currentUserId || !racer?.athleteId) {
      setClaimStatus(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await apiRequest<any>(
          "GET",
          `/athlete-claims/status?userId=${encodeURIComponent(
            currentUserId,
          )}&athleteId=${encodeURIComponent(String(racer.athleteId))}`,
        );

        if (!cancelled) {
          setClaimStatus({
            hasClaim: !!res?.hasClaim,
            status: res?.status,
            claimId: res?.claimId,
          });
        }
      } catch {
        if (!cancelled) {
          setClaimStatus({ hasClaim: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, racer?.athleteId]);

  useEffect(() => {
    if (!racer) return;

    let cancelled = false;

    (async () => {
      try {
        setAnalysisLoading(true);
        setAnalysisErr(null);
        const text = await generateRacerAnalysis(racer);
        if (!cancelled) setAnalysis(text);
      } catch (e: any) {
        console.error("[RacerProfile] AI analysis error", e);
        if (!cancelled) {
          setAnalysisErr("Could not generate AI analysis for this racer.");
        }
      } finally {
        if (!cancelled) setAnalysisLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [racer?.id]);

  if (loading || authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#03101b] text-white">
        <PageSEO title="Racer • Corner League" />
        <div className="text-white/70">Loading racer…</div>
      </div>
    );
  }

  if (err || !racer) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#03101b] text-white">
        <PageSEO title="Racer • Corner League" />
        <div className="space-y-3 text-center">
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
    racer.location && {
      label: racer.location,
      icon: <MapPin className="h-3.5 w-3.5" />,
    },
    typeof racer.racerAge === "number" && { label: `${racer.racerAge} yrs` },
    heightChip && { label: heightChip },
    racer.boatManufacturers && {
      label: racer.boatManufacturers,
      icon: <Waves className="h-3.5 w-3.5" />,
    },
  ].filter(Boolean) as { label: string; icon?: React.ReactNode }[];

  const isOwner =
    !!currentUserId &&
    !!racer?.claimedByUserId &&
    String(racer.claimedByUserId) === String(currentUserId);

  const hasPendingClaim =
    claimStatus?.hasClaim && claimStatus?.status === "pending";

  const hasApprovedClaim =
    claimStatus?.hasClaim && claimStatus?.status === "approved";

  const hasRejectedClaim =
    claimStatus?.hasClaim && claimStatus?.status === "rejected";

  const canClaim =
    !!currentUserId &&
    !!racer?.athleteId &&
    !racer?.isClaimed &&
    (!claimStatus?.hasClaim || hasRejectedClaim);

  const canEdit = isOwner || hasApprovedClaim;

  function buildUpdateBody(
    r: Racer,
    userId: string,
    edited: {
      age?: number;
      bio?: string;
      heightMeters?: number;
      origin?: string;
      boatManufacturers?: string;
    },
  ) {
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const body: Record<string, any> = {
      userId,
    };

    if (r.racerName && r.racerName.trim()) {
      body.name = r.racerName.trim();
    }

    if (typeof edited.age === "number" && Number.isFinite(edited.age)) {
      body.age = edited.age;
    }

    if (edited.bio && edited.bio.trim()) {
      body.bio = edited.bio.trim();
    }

    if (
      typeof edited.heightMeters === "number" &&
      Number.isFinite(edited.heightMeters) &&
      edited.heightMeters > 0
    ) {
      body.height = round2(edited.heightMeters);
    }

    if (edited.origin && edited.origin.trim()) {
      body.origin = edited.origin.trim();
    }

    return body;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03101b] text-white">
      <PageSEO title={`${title} • Corner League`} />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_30%),radial-gradient(circle_at_82%_20%,_rgba(59,130,246,0.06),_transparent_24%),linear-gradient(to_bottom,_#04111d_0%,_#03101b_48%,_#020b14_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-4">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setSearchOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
            aria-label="Search racers"
          >
            <SearchIcon size={18} />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.94)_0%,rgba(4,17,29,0.98)_100%)] shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.05),_transparent_24%)]" />

          <div className="relative p-5 sm:p-7 lg:p-10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center xl:flex-1">
                <div
                  className="mx-auto cursor-pointer self-start rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-amber-400 p-[2px] sm:mx-0"
                  onClick={() =>
                    setLightboxUrl(racer.racerImage || stockAvatar)
                  }
                >
                  <img
                    src={racer.racerImage || stockAvatar}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src !== stockAvatar) img.src = stockAvatar;
                    }}
                    className="h-28 w-28 rounded-full bg-black object-cover sm:h-36 sm:w-36 lg:h-40 lg:w-40"
                  />
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    Athlete profile
                  </div>

                  <h1 className="mt-4 break-words text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                    {title}
                  </h1>

                  {racer?.isClaimed && (
                    <div className="mt-3 flex justify-center sm:justify-start">
                      {racer.claimedByUsername ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/profile/${racer.claimedByUsername}`)
                          }
                          title={`Verified and claimed by @${racer.claimedByUsername}`}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Verified Athlete
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200">
                          <ShieldCheck className="h-4 w-4" />
                          Verified Athlete
                        </span>
                      )}
                    </div>
                  )}

                  {racer?.isClaimed && racer?.claimedByUsername && (
                    <div className="mt-2 flex justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/profile/${racer.claimedByUsername}`)
                        }
                        className="text-[11px] text-white/50 underline underline-offset-2 hover:text-white/80"
                      >
                        Claimed by @{racer.claimedByUsername}
                      </button>
                    </div>
                  )}

                  {hasPendingClaim && (
                    <div className="mt-3 flex justify-center sm:justify-start">
                      <span className="rounded-full border border-yellow-400/20 bg-yellow-500/15 px-3 py-1.5 text-xs text-yellow-200">
                        Claim Pending
                      </span>
                    </div>
                  )}

                  {hasRejectedClaim && (
                    <div className="mt-3 flex justify-center sm:justify-start">
                      <span className="rounded-full border border-red-400/20 bg-red-500/15 px-3 py-1.5 text-xs text-red-200">
                        Previous Claim Rejected
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {chips.length === 0 ? (
                      <p className="text-sm text-white/70">AQUA Racer</p>
                    ) : (
                      chips.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/90"
                        >
                          {c.icon ? c.icon : null}
                          {c.label}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 xl:justify-end">
                {canEdit ? (
                  <Button
                    onClick={() => setEditOpen(true)}
                    className="h-11 bg-white/10 text-white border border-white/20 hover:bg-white/15"
                  >
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : hasPendingClaim ? (
                  <Button
                    disabled
                    className="h-11 border border-yellow-400/20 bg-yellow-500/20 text-yellow-200"
                  >
                    Claim Pending
                  </Button>
                ) : canClaim ? (
                  <Button
                    onClick={() => setClaimOpen(true)}
                    className="h-11 bg-violet-500 text-white hover:bg-violet-600"
                  >
                    {hasRejectedClaim ? "Submit New Claim" : "Claim Profile"}
                  </Button>
                ) : null}

                <Button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast({ title: "Copied to clipboard" });
                    } catch {}
                  }}
                  className="h-11 bg-white text-black hover:bg-white/90"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-1">
            <Card className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.82)_0%,rgba(4,17,29,0.92)_100%)] p-5">
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
                About
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-white/80">
                {racer.bio || "Bio coming soon."}
              </p>
            </Card>

            <Card className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.82)_0%,rgba(4,17,29,0.92)_100%)] p-5">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
                World Finals
              </div>
              <div className="grid grid-cols-2 gap-3 text-white/80">
                <MiniStat
                  label="Career WF Wins"
                  value={racer.careerWorldFinalsWins ?? 0}
                />
              </div>
            </Card>

            <Card className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.82)_0%,rgba(4,17,29,0.92)_100%)] p-5">
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
                <Sparkles className="h-4 w-4" />
                AI Racer Analysis
              </div>
              {analysisLoading ? (
                <p className="text-sm text-white/60">Analyzing this racer…</p>
              ) : analysisErr ? (
                <p className="text-sm text-red-300">{analysisErr}</p>
              ) : analysis ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-white/80">
                  {analysis}
                </p>
              ) : (
                <p className="text-sm text-white/60">
                  Analysis will appear here once available.
                </p>
              )}
            </Card>
          </div>

          <div className="order-1 space-y-4 lg:order-2 lg:col-span-2">
            <Card className="rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(8,24,39,0.92)_0%,rgba(4,17,29,0.98)_100%)] p-6">
              <div className="mb-2 text-lg font-semibold text-white">
                Race Media & Highlights
              </div>
              <p className="text-sm leading-7 text-slate-300">
                Racer highlights, posts, media drops, reels, race recaps, and
                sponsor content to come.
              </p>
            </Card>

            <Card className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-2 text-lg font-semibold text-white">
                Performance Timeline
              </div>
              <p className="text-sm leading-7 text-slate-300">
                Racer season history, podium trends, class progression, and
                race-by-race results to come.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-black"
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

            if (!canEdit) {
              toast({
                title: "Not allowed",
                description:
                  "Only the verified athlete owner can edit this profile.",
              });
              return;
            }

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
                inchesToMeters(heightInchesNum).toFixed(2),
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

            const endpoint = `/athletes/${encodeURIComponent(
              String(racer.athleteId),
            )}/profile`;

            try {
              if (!currentUserId) {
                toast({
                  title: "Not allowed",
                  description: "You must be signed in to edit this profile.",
                });
                return;
              }

              if (hasImage) {
                setUploadPct(0);
                void pollUploadProgress(vals.imageFile!.name, (p) =>
                  setUploadPct(p),
                );

                const mediaUrl = await uploadAthleteImage(
                  racer.athleteId!,
                  currentUserId,
                  vals.imageFile!,
                );

                setRacer((prev) =>
                  prev ? { ...prev, racerImage: mediaUrl } : prev,
                );
                setUploadPct(100);
                toast({ title: "Photo uploaded" });
              }

              if (hasEdits) {
                const body = buildUpdateBody(racer, currentUserId, edited);
                const onlyUserAndName =
                  Object.keys(body).length === 2 &&
                  "userId" in body &&
                  "name" in body;

                if (!onlyUserAndName) {
                  await apiRequest("PATCH", endpoint, body);
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
                    : prev,
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

      {claimOpen && racer?.athleteId && currentUserId && (
        <ClaimAthleteModal
          racerName={racer.racerName}
          onClose={() => setClaimOpen(false)}
          onSubmit={async ({ additionalInfo, idCardImage }) => {
            try {
              setClaimLoading(true);

              const form = new FormData();
              form.append("userId", String(currentUserId));
              form.append("athleteId", String(racer.athleteId));
              if (additionalInfo?.trim()) {
                form.append("additionalInfo", additionalInfo.trim());
              }
              form.append("idCardImage", idCardImage);

              const res = await apiRequest<any>(
                "POST",
                "/athlete-claims",
                form as any,
              );

              setClaimStatus({
                hasClaim: true,
                status: "pending",
                claimId: res?.claimId,
              });

              setClaimOpen(false);
              toast({
                title: "Claim submitted",
                description:
                  "Your athlete claim has been sent for admin review.",
              });
            } catch (err: any) {
              logRequestError("[AthleteClaim] submit", err, "/athlete-claims");
              const nice =
                humanizeValidationError(err) ||
                err?.data?.message ||
                err?.data?.error ||
                err?.message ||
                "Could not submit claim";

              toast({
                title: "Claim failed",
                description: String(nice),
              });
            } finally {
              setClaimLoading(false);
            }
          }}
          loading={claimLoading}
        />
      )}

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
