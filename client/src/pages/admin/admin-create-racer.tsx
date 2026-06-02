// pages/admin-create-racer.tsx
import React, { useEffect, useMemo, useState } from "react";
import { PageSEO } from "@/seo/usePageSEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getAccessToken, getRefreshToken, setTokens } from "@/lib/token";
import { apiFetch } from "@/lib/apiClient";
import {
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import {
  LocationAutocomplete,
  type LocationSelection,
} from "@/components/LocationAutocomplete";

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
      if (typeof m === "string") {
        lines.push(m);
      } else if (m && typeof m === "object") {
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

function cleanNullable(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
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
  origin?: string | null;
  height?: number;

  formattedAddress?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  placeId?: string | null;
  locationProvider?: string | null;
  city?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;

  careerWins: number;
  seasonWins: number;
  careerWordFinalsWins: number;
  seasonPodiums: number;
};

/* ---------------- PIN gate ---------------- */

function PinGate({ onUnlock }: { onUnlock: (ok: boolean) => void }) {
  const [pin, setPin] = useState("");

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <Card className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>

        <div className="relative border-b border-white/10 p-5 sm:p-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.14)]">
            <LockKeyhole className="h-5 w-5" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB199]">
            Admin Gate
          </div>

          <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.03em] text-white">
            Admin Access
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/60">
            Enter the 4-digit PIN to create a new racer profile.
          </p>
        </div>

        <div className="relative space-y-4 p-5 sm:p-6">
          <input
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            className="h-14 w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-3 text-center text-xl tracking-[0.45em] text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
            placeholder="••••"
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              className="h-12 rounded-full bg-cyan-300 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 disabled:opacity-50"
              onClick={() => onUnlock(pin === ADMIN_PIN)}
              disabled={pin.length !== 4}
            >
              Unlock
            </Button>

            <Button
              variant="ghost"
              className="h-12 rounded-full border border-white/10 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setPin("")}
            >
              Clear
            </Button>
          </div>

          <p className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-xs leading-5 text-white/45">
            Dev note: PIN is hard-coded client-side for now.
          </p>
        </div>
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
    formattedAddress: "",
    latitude: "",
    longitude: "",
    placeId: "",
    locationProvider: "",
    city: "",
    stateCode: "",
    countryCode: "",
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

  const canSubmit = useMemo(() => {
    return (
      vals.name.trim().length > 0 &&
      vals.age.trim().length > 0 &&
      vals.bio.trim().length > 0 &&
      vals.boatManufacturers.trim().length > 0 &&
      !exactExists &&
      !submitting
    );
  }, [
    vals.name,
    vals.age,
    vals.bio,
    vals.boatManufacturers,
    exactExists,
    submitting,
  ]);

  function handleOriginSelect(location: LocationSelection) {
    setVals((p) => ({
      ...p,
      origin: location.location || location.formattedAddress || "",
      formattedAddress: location.formattedAddress || location.location || "",
      latitude: location.latitude || "",
      longitude: location.longitude || "",
      placeId: location.placeId || "",
      locationProvider: location.locationProvider || "mapbox",
      city: location.city || "",
      stateCode: location.stateCode || "",
      countryCode: location.countryCode || "",
    }));
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
        if (cancel) return;

        const LIMIT = 50;
        const MAX_PAGES = 20;
        const MAX_TOTAL = 1000;

        async function fetchPage(pageNum: number) {
          const params = new URLSearchParams();
          params.set("page", String(pageNum));
          params.set("limit", String(LIMIT));
          params.set("order", "DESC");
          params.set("sortBy", "createdAt");

          const resp = await apiFetch(
            `/jet-ski-racer-details?${params.toString()}`,
          );

          if (!resp.ok) {
            console.warn(
              "[CreateRacer] suggestion page fetch failed",
              resp.status,
              "page=" + pageNum,
              "limit=" + LIMIT,
            );
            return { normalized: [], hasNextPage: false };
          }

          const j = await resp.json();

          const buckets = [
            j?.racers,
            j?.data?.racers,
            j?.items,
            j?.data?.items,
            Array.isArray(j) ? j : null,
          ].filter(Boolean) as any[];

          const rawList = (buckets.find(Array.isArray) as any[]) ?? [];

          const normalized = rawList.map((rec: any) => ({
            id: String(
              rec?.id ??
                rec?._id ??
                rec?.uuid ??
                rec?.racerId ??
                rec?.athlete?.id ??
                "",
            ),
            name: String(
              rec?.athlete?.name ?? rec?.name ?? rec?.racerName ?? "",
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

        const filtered = deduped
          .filter((x) => x.name.toLowerCase().includes(qlc))
          .slice(0, 8);

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
      const ageTrimmed = vals.age.trim();
      const ageNum = Number(ageTrimmed);

      if (!ageTrimmed || Number.isNaN(ageNum) || ageNum <= 0) {
        toast({
          title: "Please fix the form",
          description: "Age is required and must be a valid number.",
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

      const heightNum = vals.heightInches.trim()
        ? Number(vals.heightInches)
        : undefined;

      if (
        heightNum !== undefined &&
        (Number.isNaN(heightNum) || heightNum < 36 || heightNum > 96)
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

      const body: CreateBody = {
        name: vals.name.trim(),
        age: ageNum,
        bio: vals.bio.trim(),
        origin: cleanNullable(vals.origin),
        formattedAddress: cleanNullable(vals.formattedAddress),
        latitude: cleanNullable(vals.latitude),
        longitude: cleanNullable(vals.longitude),
        placeId: cleanNullable(vals.placeId),
        locationProvider: cleanNullable(vals.locationProvider) || "mapbox",
        city: cleanNullable(vals.city),
        stateCode: cleanNullable(vals.stateCode),
        countryCode: cleanNullable(vals.countryCode),
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
          `/racer/${encodeURIComponent(String(athleteId))}?kind=athlete`,
        );
        setSubmitting(false);
        return;
      }

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
        "/jet-ski-racer-details",
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
    <div className="mx-auto w-full max-w-5xl">
      <Card className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative border-b border-white/10 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Admin Tool
                </div>

                <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Racer Setup
                </div>
              </div>

              <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Create{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Racer
                </span>
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                Add a new athlete profile, baseline racing details, and ride
                data to the Corner League database.
              </p>
            </div>

            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.14)]">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="mb-5 rounded-[20px] border border-cyan-300/10 bg-cyan-300/[0.04] px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" />

              <div>
                <div className="text-sm font-semibold text-white">
                  Duplicate protection is active
                </div>

                <p className="mt-1 text-xs leading-5 text-white/55">
                  Start typing a racer name and existing athletes will be
                  checked before creation.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <div className="mt-2 rounded-[14px] border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-xs leading-5 text-[#FFB199]">
                    An athlete named “{vals.name.trim()}” already exists. Please
                    change the name or pick the existing athlete.
                  </div>
                )}

                {showSuggest && suggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[18px] border border-cyan-300/10 bg-[#07111F] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                    <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/45">
                      <Search className="h-3.5 w-3.5" />
                      Existing racers
                    </div>

                    {suggestions
                      .filter((s) =>
                        s.name
                          .toLowerCase()
                          .includes(vals.name.trim().toLowerCase()),
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
                          className="w-full px-3 py-3 text-left text-sm text-white transition hover:bg-cyan-300/10"
                        >
                          {s.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Age *">
              <input
                className="fld"
                inputMode="numeric"
                value={vals.age}
                onChange={set("age")}
                placeholder="e.g., 28"
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

            <div className="md:col-span-2">
              <LocationAutocomplete
                label="Origin / Hometown"
                value={vals.origin}
                placeholder="Search city, state, country, venue, or full address..."
                onTextChange={(value) =>
                  setVals((p) => ({
                    ...p,
                    origin: value,
                    formattedAddress: "",
                    latitude: "",
                    longitude: "",
                    placeId: "",
                    locationProvider: "",
                    city: "",
                    stateCode: "",
                    countryCode: "",
                  }))
                }
                onSelect={handleOriginSelect}
              />

              {vals.latitude && vals.longitude ? (
                <div className="mt-2 rounded-[14px] border border-cyan-300/10 bg-cyan-300/[0.04] px-3 py-2 text-xs leading-5 text-cyan-100/70">
                  Coordinates attached: {Number(vals.latitude).toFixed(5)},{" "}
                  {Number(vals.longitude).toFixed(5)}
                </div>
              ) : vals.origin.trim() ? (
                <div className="mt-2 rounded-[14px] border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-xs leading-5 text-[#FFB199]">
                  Select a location from the dropdown to attach map coordinates.
                  Typed text alone will not attach latitude/longitude.
                </div>
              ) : (
                <div className="mt-2 text-xs leading-5 text-white/40">
                  Select a location from the dropdown to attach map coordinates.
                </div>
              )}
            </div>

            <Field label="Boat Manufacturer *">
              <input
                className="fld"
                value={vals.boatManufacturers}
                onChange={set("boatManufacturers")}
                placeholder="e.g., Yamaha GP1800R SVHO"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Bio *">
                <textarea
                  className="fld h-32"
                  value={vals.bio}
                  onChange={set("bio")}
                  placeholder="Add a short racer bio…"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs leading-6 text-white/45">
              Required: name, age, bio, and boat manufacturer.
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-12 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create Racer"}
            </Button>
          </div>
        </div>
      </Card>

      <style>{`
        .fld {
          width: 100%;
          min-height: 48px;
          border-radius: 14px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.10);
          padding: 0 14px;
          color: white;
          outline: none;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .fld::placeholder {
          color: rgba(255,255,255,0.34);
        }

        .fld:focus {
          border-color: rgba(103,232,249,0.34);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.10);
          background: rgba(255,255,255,0.075);
        }

        textarea.fld {
          height: auto;
          padding: 12px 14px;
          resize: vertical;
        }
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
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60">
        {label}
      </div>
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
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] px-4 py-8 pb-24 text-white sm:px-6 sm:py-12">
      <PageSEO title="Admin • Create Racer" />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="mx-auto mb-6 flex w-full max-w-5xl items-center justify-between gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200 sm:inline-flex">
          <Sparkles className="h-3.5 w-3.5" />
          Corner League Admin
        </div>
      </div>

      {authed ? <CreateRacerForm /> : <PinGate onUnlock={handleUnlock} />}
    </div>
  );
}
