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

  const set =
    (k: keyof typeof vals) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setVals((p) => ({ ...p, [k]: e.target.value }));

  const canSubmit = useMemo(() => vals.name.trim().length > 0, [vals.name]);

  //   const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

  function apiUrl(path: string) {
    const base = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
    const baseHasApi = /\/api$/.test(base);
    const needsApi = !/^\/?api\//i.test(path);
    const prefix = baseHasApi || !needsApi ? "" : "/api";
    return `${base}${prefix}${path.startsWith("/") ? path : `/${path}`}`;
  }

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
    setSubmitting(true);
    try {
      // Basic validation
      const ageNum = Number(vals.age);
      if (!Number.isFinite(ageNum)) {
        toast({
          title: "Please fix the form",
          description: "Age must be a number.",
        });
        setSubmitting(false);
        return;
      }
      const bioStr = vals.bio.trim();
      if (!bioStr) {
        toast({
          title: "Please fix the form",
          description: "Bio is required.",
        });
        setSubmitting(false);
        return;
      }
      const boatStr = vals.boatManufacturers.trim();
      if (!boatStr) {
        toast({
          title: "Please fix the form",
          description: "Boat manufacturer is required.",
        });
        setSubmitting(false);
        return;
      }
      const toNum = (v: string) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };
      const heightInches = toNum(vals.heightInches);
      if (
        heightInches !== undefined &&
        (heightInches < 36 || heightInches > 96)
      ) {
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

      // 1) Ensure there is an athlete row. Since your API surface for athletes is limited,
      //    we use the existing GET /athletes?search= to find the row by name.
      const athletesUrl = apiUrl(
        `/athletes?${new URLSearchParams({
          search: vals.name.trim(),
          limit: "5",
          order: "DESC",
        }).toString()}`
      );
      const findRes = await fetch(athletesUrl, {
        headers: { Authorization: `Bearer ${at}` },
      });

      let athleteId: string | undefined;
      if (findRes.ok) {
        const aj = await findRes.json();
        const list: any[] =
          aj?.athletes ||
          aj?.data?.athletes ||
          aj?.items ||
          (Array.isArray(aj) ? aj : []) ||
          [];
        const lower = vals.name.trim().toLowerCase();
        const cand =
          list.find(
            (a) =>
              String(a?.name || "")
                .trim()
                .toLowerCase() === lower
          ) || list[0];
        athleteId = cand?.id ?? cand?._id ?? cand?.uuid;
      }

      // If we STILL don’t have an athleteId here, it likely means the server will create one
      // when we call the detail endpoint with athlete props — but your controller crashes after.
      // To avoid the crash loop, we only send detail-table fields now. If athleteId is missing,
      // we stop and ask the user to try again after the athlete exists.
      if (!athleteId) {
        toast({
          title: "Athlete not found",
          description:
            "Create or sync the athlete first, then attach racer details.",
        });
        setSubmitting(false);
        return;
      }

      // 2) Create jet_ski_racer_details with ONLY columns that exist + athleteId
      const detailBody = {
        careerWins: 0,
        seasonWins: 0,
        seasonPodiums: 0,
        careerWordFinalsWins: 0, // <-- correct spelling for your DB
        boatManufacturers: boatStr,
        athleteId, // <-- attaches to the athlete
      };

      const postUrl = apiUrl("/jet-ski-racer-details");
      logBodyWithTypes("[AdminCreateRacer] POST details", detailBody);

      const createRes = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${at}`,
        },
        body: JSON.stringify(detailBody),
      });

      const rawText = await createRes.text();

      if (!createRes.ok) {
        console.groupCollapsed(
          "%c[AdminCreateRacer] details POST failed",
          "color:#f7768e;font-weight:bold"
        );
        console.log("status:", createRes.status);
        console.log("response (raw):", rawText);
        console.groupEnd();

        let msg = rawText;
        try {
          const j = JSON.parse(rawText);
          msg =
            j?.result?.response?.message ||
            j?.message ||
            j?.error ||
            rawText ||
            "Error";
        } catch {}
        toast({ title: "Create failed", description: String(msg) });
        setSubmitting(false);
        return;
      }

      // 3) Navigate to the new profile (use the returned id if possible, otherwise athleteId)
      let created: any;
      try {
        created = JSON.parse(rawText);
      } catch {
        created = rawText;
      }
      const unpack =
        created?.racer ??
        created?.data?.racer ??
        created?.data ??
        created?.item ??
        created;
      const detailId: string | undefined =
        unpack?.id ?? unpack?._id ?? unpack?.uuid;

      const idForNav = detailId || athleteId;
      const slug = slugify(vals.name.trim());
      toast({ title: "Racer created" });
      if (idForNav) {
        navigate(
          `/racer/${encodeURIComponent(slug)}?id=${encodeURIComponent(
            String(idForNav)
          )}`
        );
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
            <input className="fld" value={vals.name} onChange={set("name")} />
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
