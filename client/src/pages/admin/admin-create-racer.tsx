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

/* ---------------- utils ---------------- */

function logRequestError(ctx: string, err: any, endpoint?: string, body?: any) {
  try {
    console.error(`[${ctx}] failed`);
    if (endpoint) console.error("endpoint:", endpoint);
    if (body) console.error("request body (sent):", body);
    console.error("err.status:", err?.status);
    console.error("err.message:", err?.message);
    console.error("err.data (raw):", err?.data);
    if (err?.data && typeof err.data === "object") {
      console.error("err.data (json):", JSON.stringify(err.data, null, 2));
    }
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

/* ---- auth helpers ---- */

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

  if (!at || Date.now() >= expMs - 5000) {
    const rt = getRefreshToken();
    if (!rt) return null;

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

/* ---------------- types ---------------- */
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

/* ---------------- CreateRacerForm ---------------- */

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
        if (cancel) return;

        const LIMIT = 50; // backend validation cap
        const MAX_PAGES = 20; // safety: don't hammer forever
        const MAX_TOTAL = 1000; // safety: we don't need EVERYONE in memory

        // fetch ONE page from backend using real pagination
        async function fetchPage(pageNum: number) {
          const params = new URLSearchParams();
          params.set("page", String(pageNum));
          params.set("limit", String(LIMIT));
          params.set("order", "DESC");
          params.set("sortBy", "createdAt");

          const resp = await apiFetch(
            `/jet-ski-racer-details?${params.toString()}`
          );

          if (!resp.ok) {
            console.warn(
              "[CreateRacer] suggestion page fetch failed",
              resp.status,
              "page=" + pageNum,
              "limit=" + LIMIT
            );
            return { normalized: [], hasNextPage: false };
          }

          const j = await resp.json();

          // pull the raw racers array out of whatever shape we got
          const buckets = [
            j?.racers,
            j?.data?.racers,
            j?.items,
            j?.data?.items,
            Array.isArray(j) ? j : null,
          ].filter(Boolean) as any[];

          const rawList = (buckets.find(Array.isArray) as any[]) ?? [];

          // normalize -> { id, name }
          const normalized = rawList.map((rec: any) => ({
            id: String(
              rec?.id ??
                rec?._id ??
                rec?.uuid ??
                rec?.racerId ??
                rec?.athlete?.id ??
                ""
            ),
            name: String(
              rec?.athlete?.name ?? rec?.name ?? rec?.racerName ?? ""
            ).trim(),
          }));

          const meta = j?.meta ??
            j?.data?.meta ?? {
              hasNextPage: rawList.length === LIMIT,
            };

          const hasNextPage =
            typeof meta?.hasNextPage === "boolean"
              ? meta.hasNextPage
              : rawList.length === LIMIT;

          return { normalized, hasNextPage };
        }

        const collected: Array<{ id: string; name: string }> = [];
        let pageNum = 1;
        let more = true;

        while (more && pageNum <= MAX_PAGES && collected.length < MAX_TOTAL) {
          const { normalized, hasNextPage } = await fetchPage(pageNum);
          if (cancel) return;

          for (const r of normalized) {
            if (r && r.name) {
              collected.push(r);
              if (collected.length >= MAX_TOTAL) break;
            }
          }

          more = hasNextPage;
          pageNum += 1;
        }

        // dedupe by lowercase name
        const seen = new Set<string>();
        const deduped: Array<{ id: string; name: string }> = [];
        for (const x of collected) {
          const key = x.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(x);
          }
        }

        const qlc = q.toLowerCase();

        // partial match list for dropdown
        const filtered = deduped
          .filter((x) => x.name.toLowerCase().includes(qlc))
          .slice(0, 8);

        // true if there's an exact (case-insensitive) name match
        const exact = deduped.some((x) => x.name.toLowerCase() === qlc);

        if (!cancel) {
          setSuggestions(filtered);
          setExactExists(exact);
          setShowSuggest(true);
        }
      } catch (err) {
        console.error("[CreateRacer] suggestion load error", err);
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
      // basic validation
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

      // keep access token fresh
      const at = await getValidAccessToken();
      if (!at) {
        toast({
          title: "Sign in required",
          description: "Your session expired. Please sign in again.",
        });
        setSubmitting(false);
        return;
      }

      const body: CreateBody = {
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

      const res = await apiFetch("/jet-ski-racer-details", {
        method: "POST",
        body,
      });

      const rawText = await res.text();

      if (!res.ok) {
        let msg = rawText;
        try {
          const j = JSON.parse(rawText);
          msg = j?.message || j?.error || rawText;
        } catch (err) {
          console.warn("[CreateRacer] could not parse error JSON", err);
        }

        toast({ title: "Create failed", description: String(msg) });
        setSubmitting(false);
        return;
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        console.warn("[CreateRacer] response was not valid JSON", err);
        parsed = {};
      }

      const racerObj =
        parsed?.data?.data?.racer ??
        parsed?.data?.racer ??
        parsed?.racer ??
        null;

      const detailId = racerObj?.id;
      const athleteId = racerObj?.athlete?.id;

      if (detailId) {
        toast({ title: "Racer created" });
        navigate(`/racer/${encodeURIComponent(String(detailId))}`);
        setSubmitting(false);
        return;
      }

      if (athleteId) {
        toast({ title: "Racer created" });
        navigate(
          `/racer/${encodeURIComponent(String(athleteId))}?kind=athlete`
        );
        setSubmitting(false);
        return;
      }

      // fallback
      toast({
        title: "Racer created",
        description:
          "We saved the racer but couldn't open their profile yet. Try searching for them.",
      });
      setSubmitting(false);
    } catch (e: any) {
      console.error("[CreateRacer] catch block error:", e);

      logRequestError(
        "AdminCreateRacer POST /jet-ski-racer-details",
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

              {exactExists && vals.name.trim() && (
                <div className="mt-1 text-xs text-amber-300">
                  An athlete named “{vals.name.trim()}” already exists. Please
                  change the name or pick the existing athlete.
                </div>
              )}

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
                        className="w-full text-left px-3 py-2 text-white text-sm hover:bg-white/10"
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
