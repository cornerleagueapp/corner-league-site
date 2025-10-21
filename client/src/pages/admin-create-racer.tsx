// pages/admin-create-racer.tsx
import React, { useEffect, useMemo, useState } from "react";
import { PageSEO } from "@/seo/usePageSEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getAccessToken, getRefreshToken, setTokens } from "@/lib/token";
import { apiFetch } from "@/lib/apiClient";

const ADMIN_PIN = "1234";
const AUTH_KEY = "__admin_authed_v1";

function logBodyWithTypes(label: string, body: Record<string, any>) {
  try {
    console.groupCollapsed(`%c${label}`, "color:#7aa2f7;font-weight:bold");
    console.log("body:", body);
    const types: Record<string, string> = {};
    for (const [k, v] of Object.entries(body || {})) {
      types[k] = Array.isArray(v) ? "array" : typeof v;
    }
    console.log("body types:", types);
    console.log("body (json):", JSON.stringify(body, null, 2));
    console.groupEnd();
  } catch {}
}
function logRequestError(ctx: string, err: any, endpoint?: string, body?: any) {
  try {
    console.groupCollapsed(`%c${ctx} failed`, "color:#f7768e;font-weight:bold");
    if (endpoint) console.log("endpoint:", endpoint);
    if (body) console.log("request body (sent):", body);
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

async function waitForRacerReadable(
  apiUrl: (p: string) => string,
  id: string,
  token: string,
  maxAttempts = 8
): Promise<boolean> {
  let delay = 150;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const r = await fetch(
        apiUrl(`/jet-ski-racer-details/${encodeURIComponent(id)}`),
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        const d = j?.racer ?? j?.data?.racer ?? j?.data ?? j?.item ?? j;
        if (d?.id || d?._id || d?.uuid || d?.athlete) return true;
      }
    } catch {}
    await new Promise((res) => setTimeout(res, delay));
    delay = Math.min(delay * 1.7, 1200);
  }
  return false;
}

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function inchesToMeters(inches: number) {
  return inches * 0.0254;
}

/* ---------------- PIN gate ---------------- */
function PinGate({ onUnlock }: { onUnlock: (ok: boolean) => void }) {
  const [pin, setPin] = useState("");
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <Card className="bg-white/5 border-white/10 p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold text-white mb-2">Admin Access</h2>
        <p className="text-sm text-white/70 mb-4">Enter 4-digit PIN</p>
        <input
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          inputMode="numeric"
          className="w-full h-11 rounded-md bg-white/5 border border-white/10 px-3 text-white tracking-[0.3em] text-center text-lg outline-none"
          placeholder="••••"
        />
        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1 bg-white text-black hover:bg-white/90"
            onClick={() => onUnlock(pin === ADMIN_PIN)}
            disabled={pin.length !== 4}
          >
            Unlock
          </Button>
          <Button
            variant="ghost"
            className="border border-white/10 text-white"
            onClick={() => setPin("")}
          >
            Clear
          </Button>
        </div>
        <p className="mt-3 text-xs text-white/50">
          (Dev note: PIN is hard-coded client-side for now.)
        </p>
      </Card>
    </div>
  );
}

function parseJwtExp(t: string | null) {
  if (!t) return 0;
  const [, payload] = t.split(".");
  try {
    const { exp } = JSON.parse(atob(payload));
    return (exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

async function getValidAccessToken(): Promise<string | null> {
  let at = getAccessToken();
  const expMs = parseJwtExp(at);

  // if missing or expiring in < 5s, try refresh
  if (!at || Date.now() >= expMs - 5000) {
    const rt = getRefreshToken();
    if (!rt) return null;

    // call refresh without Authorization header
    const resp = await apiFetch("/auth/refresh", {
      method: "POST",
      body: { refreshToken: rt },
      skipAuth: true,
    });
    if (!resp.ok) return null;

    const json = await resp.json();
    const newAT = json?.accessToken ?? json?.data?.accessToken;
    const newRT = json?.refreshToken ?? json?.data?.refreshToken;
    if (!newAT) return null;

    setTokens(newAT, newRT);
    at = newAT;
  }
  return at;
}

function CreateRacerForm() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [submitting, setSubmitting] = useState(false);
  const [vals, setVals] = useState({
    name: "",
    age: "",
    heightInches: "",
    origin: "",
    boatManufacturers: "",
    bio: "",
  });

  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [exactExists, setExactExists] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const set =
    (k: keyof typeof vals) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setVals((p) => ({ ...p, [k]: e.target.value }));

  const canSubmit = useMemo(
    () => vals.name.trim().length > 0 && !exactExists,
    [vals.name, exactExists]
  );

  function apiUrl(path: string) {
    const base = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
    const baseHasApi = /\/api$/.test(base);
    const needsApi = !/^\/?api\//i.test(path);
    const prefix = baseHasApi || !needsApi ? "" : "/api";
    return `${base}${prefix}${path.startsWith("/") ? path : `/${path}`}`;
  }

  useEffect(() => {
    let cancel = false;
    const q = vals.name.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setExactExists(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const at = getAccessToken();
        if (!at || cancel) return;

        const LIMIT = 50;
        const MAX_PAGES = 4;

        async function pageOnce(skip: number) {
          const params = new URLSearchParams();
          params.set("skip", String(skip));
          params.set("limit", String(LIMIT));
          params.set("order", "DESC");
          const url = apiUrl(`/jet-ski-racer-details?${params.toString()}`);
          const r = await fetch(url, {
            headers: { Authorization: `Bearer ${at}` },
          });
          if (!r.ok) return [];
          const j = await r.json();
          const buckets = [
            j?.racers,
            j?.data?.racers,
            j?.items,
            j?.data?.items,
            Array.isArray(j) ? j : null,
          ].filter(Boolean) as any[];
          return (buckets.find(Array.isArray) as any[]) ?? [];
        }

        const all: any[] = [];
        for (let page = 0; page < MAX_PAGES; page++) {
          const batch = await pageOnce(page * LIMIT);
          all.push(...batch);
          if (cancel || batch.length < LIMIT) break;
        }

        const allNames = all
          .map((rec: any) => ({
            id: String(rec?.id ?? rec?._id ?? rec?.uuid ?? ""),
            name: String(rec?.athlete?.name ?? rec?.name ?? "").trim(),
          }))
          .filter((x: any) => x.name);

        const seen = new Set<string>();
        const deduped: Array<{ id: string; name: string }> = [];
        for (const x of allNames) {
          const key = x.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(x);
          }
        }

        const qlc = q.toLowerCase();

        const filtered = deduped
          .filter((x) => x.name.toLowerCase().includes(qlc))
          .slice(0, 8);

        const exact = deduped.some((x) => x.name.toLowerCase() === qlc);

        if (!cancel) {
          setSuggestions(filtered);
          setExactExists(exact);
          setShowSuggest(true);
        }
      } catch {
        if (!cancel) {
          setSuggestions([]);
          setExactExists(false);
        }
      }
    }, 250);

    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [vals.name]);

  type CreateBody = {
    name: string;
    age: number;
    bio: string;
    boatManufacturers: string;
    origin?: string;
    height?: number;
    careerWins: number;
    seasonWins: number;
    careerWordFinalsWins: number;
    seasonPodiums: number;
  };

  async function fetchDetailAndAthlete(
    at: string,
    detailId?: string
  ): Promise<{ detailId?: string; athleteId?: string; name?: string }> {
    if (!detailId) return {};
    const getUrl = apiUrl(
      `/jet-ski-racer-details/${encodeURIComponent(detailId)}`
    );
    const r = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${at}` },
    });
    if (!r.ok) return {};
    const j = await r.json();
    const d = j?.racer ?? j?.data?.racer ?? j?.data ?? j?.item ?? j;
    return {
      detailId: d?.id ?? d?._id ?? d?.uuid,
      athleteId: d?.athlete?.id ?? d?.athleteId ?? d?.athlete_id,
      name: d?.athlete?.name ?? d?.name,
    };
  }

  async function fallbackCreateDetailForAthlete(
    at: string,
    name: string,
    body: CreateBody
  ): Promise<{ detailId?: string; athleteId?: string }> {
    const qs = new URLSearchParams();
    qs.set("limit", "5");
    qs.set("order", "DESC");
    qs.set("search", name.trim());
    const athletesUrl = apiUrl(`/athletes?${qs.toString()}`);
    const ar = await fetch(athletesUrl, {
      headers: { Authorization: `Bearer ${at}` },
    });
    if (!ar.ok) return {};

    const aj = await ar.json();
    const list: any[] =
      aj?.athletes ||
      aj?.data?.athletes ||
      aj?.items ||
      (Array.isArray(aj) ? aj : []) ||
      [];

    const lower = name.trim().toLowerCase();
    const cand =
      list.find(
        (a) =>
          String(a?.name || "")
            .trim()
            .toLowerCase() === lower
      ) || list[0];

    const athleteId: string | undefined = cand?.id ?? cand?._id ?? cand?.uuid;
    if (!athleteId) return {};

    const postUrl = apiUrl("/jet-ski-racer-details");
    const createDetailBody = { ...body, athleteId };
    logBodyWithTypes(
      "[AdminCreateRacer:FALLBACK] POST detail body",
      createDetailBody
    );

    const dr = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${at}`,
      },
      body: JSON.stringify(createDetailBody),
    });
    const raw = await dr.text();
    if (!dr.ok) {
      console.warn(
        "[AdminCreateRacer:FALLBACK] detail POST failed",
        dr.status,
        raw
      );
      return { athleteId };
    }

    let d: any;
    try {
      d = JSON.parse(raw);
    } catch {
      d = raw;
    }
    const detailId =
      d?.racer?.id ??
      d?.data?.racer?.id ??
      d?.data?.id ??
      d?.item?.id ??
      d?.id ??
      d?._id;

    return { detailId, athleteId };
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;

    if (exactExists) {
      toast({
        title: "Duplicate athlete",
        description: `“${vals.name.trim()}” already exists. Select it from the dropdown or change the name.`,
      });
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    try {
      const ageNum = Number(vals.age);
      if (Number.isNaN(ageNum)) {
        toast({
          title: "Please fix the form",
          description: "Age must be a number.",
        });
        setSubmitting(false);
        return;
      }
      if (!vals.bio.trim()) {
        toast({
          title: "Please fix the form",
          description: "Bio is required.",
        });
        setSubmitting(false);
        return;
      }
      if (!vals.boatManufacturers.trim()) {
        toast({
          title: "Please fix the form",
          description: "Boat manufacturer is required.",
        });
        setSubmitting(false);
        return;
      }
      const heightNum = vals.heightInches
        ? Number(vals.heightInches)
        : undefined;
      if (heightNum !== undefined && (heightNum < 36 || heightNum > 96)) {
        toast({
          title: "Please fix the form",
          description: "Height must be between 36 and 96 inches (3′0″–8′0″).",
        });
        setSubmitting(false);
        return;
      }

      const at = await getValidAccessToken();
      if (!at) {
        toast({
          title: "Sign in required",
          description: "Your session expired. Please sign in again.",
        });
        setSubmitting(false);
        return;
      }

      const body = {
        name: vals.name.trim(),
        age: ageNum,
        bio: vals.bio.trim(),
        origin: vals.origin.trim(),
        height: heightNum,

        boatManufacturers: vals.boatManufacturers.trim(),
        careerWins: 0,
        seasonWins: 0,
        seasonPodiums: 0,
        careerWordFinalsWins: 0,
      };

      logBodyWithTypes("[AdminCreateRacer] POST /jet-ski-racer-details", body);

      const postUrl = apiUrl("/jet-ski-racer-details");
      const res = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${at}`,
        },
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      if (!res.ok) {
        let msg = raw;
        try {
          const j = JSON.parse(raw);
          msg = j?.message || j?.error || raw;
        } catch {}
        toast({ title: "Create failed", description: String(msg) });
        setSubmitting(false);
        return;
      }

      let created: any;
      try {
        created = JSON.parse(raw);
      } catch {
        created = raw;
      }

      function extractIdFromLocationHeader(r: Response): string | undefined {
        const loc = r.headers.get("Location") || r.headers.get("location");
        if (!loc) return;
        const m = String(loc).match(/\/jet-ski-racer-details\/([^/?#]+)/i);
        return m?.[1];
      }

      const racer =
        created?.racer ?? created?.data?.racer ?? created?.data ?? created;

      let detailId: string | undefined =
        racer?.id ??
        racer?._id ??
        racer?.uuid ??
        created?.data?.id ??
        created?.racerId ??
        created?.data?.racerId ??
        extractIdFromLocationHeader(res);

      let athleteId: string | undefined =
        racer?.athlete?.id ??
        racer?.athlete?._id ??
        created?.data?.athleteId ??
        created?.athleteId;

      const nameForLookup = vals.name.trim();

      const scanForByName = async (
        atLocal: string,
        targetName: string,
        maxPages = 12,
        limit = 50
      ): Promise<{ detailId?: string; athleteId?: string }> => {
        const targetLc = targetName.toLowerCase();
        const targetSlug = targetLc
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        async function pageOnce(skip: number) {
          const params = new URLSearchParams();
          params.set("skip", String(skip));
          params.set("limit", String(limit));
          params.set("order", "DESC");
          const url = apiUrl(`/jet-ski-racer-details?${params.toString()}`);
          try {
            const r = await fetch(url, {
              headers: { Authorization: `Bearer ${atLocal}` },
            });
            if (!r.ok) return [];
            const j = await r.json();
            const buckets = [
              j?.racers,
              j?.data?.racers,
              j?.items,
              j?.data?.items,
              Array.isArray(j) ? j : null,
            ].filter(Boolean) as any[];
            return (buckets.find(Array.isArray) as any[]) ?? [];
          } catch {
            return [];
          }
        }

        for (let page = 0; page < maxPages; page++) {
          const raw = await pageOnce(page * limit);
          if (!raw.length) break;

          for (const rec of raw) {
            const nm = (rec?.athlete?.name || rec?.name || "")
              .toString()
              .trim();
            const lc = nm.toLowerCase();
            const slug = lc.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            if (lc === targetLc || slug === targetSlug) {
              return {
                detailId:
                  String(rec?.id ?? rec?._id ?? rec?.uuid ?? "") || undefined,
                athleteId:
                  String(
                    rec?.athlete?.id ?? rec?.athleteId ?? rec?.athlete_id ?? ""
                  ) || undefined,
              };
            }
          }

          if (raw.length < limit) break;
        }
        return {};
      };

      if (!detailId && !athleteId) {
        const deadline = Date.now() + 20000;
        let delay = 300;
        while (Date.now() < deadline && !detailId && !athleteId) {
          const found = await scanForByName(at, nameForLookup);
          if (found.detailId || found.athleteId) {
            detailId = found.detailId ?? detailId;
            athleteId = found.athleteId ?? athleteId;
            break;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(1200, Math.round(delay * 1.6));
        }
      }

      if (!detailId && athleteId) {
      } else if (!detailId && !athleteId) {
        try {
          const fb = await fallbackCreateDetailForAthlete(at, nameForLookup, {
            name: vals.name.trim(),
            age: ageNum,
            bio: vals.bio.trim(),
            origin: vals.origin.trim(),
            height: heightNum,
            boatManufacturers: vals.boatManufacturers.trim(),
            careerWins: 0,
            seasonWins: 0,
            seasonPodiums: 0,
            careerWordFinalsWins: 0,
          });
          if (fb.detailId || fb.athleteId) {
            detailId = fb.detailId ?? detailId;
            athleteId = fb.athleteId ?? athleteId;
          }
        } catch {}
      }

      const slug = slugify(vals.name.trim());

      if (!detailId && !athleteId) {
        console.warn("[CreateRacer] Missing IDs; falling back to slug nav.");
        toast({
          title: "Racer created",
          description:
            "The new profile is being indexed. We’ll open it by name for now.",
        });
        navigate(`/racer/${encodeURIComponent(slug)}`);
        setSubmitting(false);
        return;
      }

      toast({ title: "Racer created" });

      if (detailId) {
        const ok = await waitForRacerReadable(apiUrl, detailId, at);
        if (!ok) {
          toast({
            title: "Finishing up…",
            description: "New racer may take a moment to appear.",
          });
        }
      }

      if (detailId) {
        navigate(`/racer/${encodeURIComponent(detailId)}`);
      } else if (athleteId) {
        navigate(`/racer/${encodeURIComponent(athleteId)}?kind=athlete`);
      } else {
        navigate(`/racer/${encodeURIComponent(slug)}`);
      }
    } catch (e: any) {
      logRequestError(
        "[AdminCreateRacer] details POST",
        e,
        "/jet-ski-racer-details"
      );
      const nice =
        humanizeValidationError(e) ||
        e?.data?.message ||
        e?.data?.error ||
        e?.message ||
        "Validation error";
      toast({ title: "Error", description: String(nice) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="bg-white/5 border-white/10 p-5">
        <h2 className="text-xl font-semibold text-white mb-4">Create Racer</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Name *">
            <div className="relative">
              <input
                className="fld"
                value={vals.name}
                onChange={set("name")}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
                placeholder="Type a name…"
              />
              {/* inline warning when exact duplicate */}
              {exactExists && vals.name.trim() && (
                <div className="mt-1 text-xs text-amber-300">
                  An athlete named “{vals.name.trim()}” already exists. Please
                  change the name or pick new athlete.
                </div>
              )}
              {/* suggestions dropdown */}
              {showSuggest && suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-white/10 bg-[#0b0f18] shadow-lg">
                  {suggestions
                    .filter((s) =>
                      s.name
                        .toLowerCase()
                        .includes(vals.name.trim().toLowerCase())
                    )
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setVals((p) => ({ ...p, name: s.name }));
                          setExactExists(true);
                          setShowSuggest(false);
                        }}
                        className="w-full text-left px-3 py-2 text-white/100 text-sm hover:bg-white/10"
                      >
                        {s.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </Field>
          <Field label="Age">
            <input
              className="fld"
              inputMode="numeric"
              value={vals.age}
              onChange={set("age")}
            />
          </Field>

          <Field label="Height (inches)">
            <input
              className="fld"
              type="number"
              inputMode="numeric"
              min={36}
              max={96}
              step={1}
              placeholder="e.g., 70"
              value={vals.heightInches}
              onChange={set("heightInches")}
            />
          </Field>
          <Field label="Origin">
            <input
              className="fld"
              value={vals.origin}
              onChange={set("origin")}
            />
          </Field>

          <Field label="Boat Manufacturer">
            <input
              className="fld"
              value={vals.boatManufacturers}
              onChange={set("boatManufacturers")}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Bio">
              <textarea
                className="fld h-28"
                value={vals.bio}
                onChange={set("bio")}
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="bg-white text-black hover:bg-white/90"
          >
            {submitting ? "Creating…" : "Create Racer"}
          </Button>
        </div>
      </Card>

      <style>{`
        .fld {
          width: 100%;
          height: 42px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0 12px;
          color: white;
          outline: none;
        }
        textarea.fld { height: auto; padding: 10px 12px; }
      `}</style>
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

export default function AdminCreateRacerPage() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
  }, []);
  const handleUnlock = (ok: boolean) => {
    if (ok) {
      localStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
    } else {
      alert("Wrong PIN");
    }
  };
  return (
    <div className="min-h-screen bg-[#090D16] text-white py-8 px-4">
      <PageSEO title="Admin • Create Racer" />
      {authed ? <CreateRacerForm /> : <PinGate onUnlock={handleUnlock} />}
    </div>
  );
}
