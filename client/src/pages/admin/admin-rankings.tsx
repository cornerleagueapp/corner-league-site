import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/apiClient";

type ScopeType = "NATIONAL" | "ORGANIZATION";

type ClassOption = {
  code: string;
  displayName: string;
};

type OrgOption = {
  id: string;
  name: string;
  abbreviation?: string | null;
  logoUrl?: string | null;
};

type RankingRow = {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteImage?: string | null;
  stateCode?: string | null;
  classGroupCode: string;
  classGroupName: string;
  rankingPosition: number;
  rankingScore: number;
  racesCount: number;
  eligible: boolean | number;
  overallRating?: number | null;
  speedRating?: number | null;
  consistencyRating?: number | null;
  strengthRating?: number | null;
  momentumRating?: number | null;
  versatilityRating?: number | null;
  activityRating?: number | null;
  confidenceScore?: number | null;
  winsCount?: number | null;
  podiumsCount?: number | null;
  organizationId?: string;
  organizationName?: string;
  organizationAbbreviation?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-[#06101b]/90 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.03)]">
      <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-sm text-gray-400">{hint}</div> : null}
    </div>
  );
}

function RatingPill({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) {
  const safe = Math.max(0, Math.min(99, Number(value ?? 0)));
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/70">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-white">
        {safe.toFixed(1)}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

function OrgBadge({
  name,
  abbreviation,
}: {
  name?: string;
  abbreviation?: string | null;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
      <span className="font-medium">{abbreviation || "ORG"}</span>
      {name ? <span className="text-cyan-100/70">{name}</span> : null}
    </div>
  );
}

export default function AdminRankingsPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [scope, setScope] = useState<ScopeType>("NATIONAL");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [limit, setLimit] = useState(10);
  const [eligibleOnly, setEligibleOnly] = useState(false);

  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        setError(null);

        const [classesRes, orgsRes] = await Promise.all([
          apiFetch("/rankings/classes", {
            method: "GET",
            noRefresh: true,
          }),
          apiFetch("/organizations", {
            method: "GET",
            noRefresh: true,
          }),
        ]);

        if (!classesRes.ok) {
          const j = await classesRes.json().catch(() => ({}));
          throw new Error(j?.message || "Failed to load ranking classes.");
        }

        if (!orgsRes.ok) {
          const j = await orgsRes.json().catch(() => ({}));
          throw new Error(j?.message || "Failed to load organizations.");
        }

        const classesJson = await classesRes.json().catch(() => ({}));
        const orgsJson = await orgsRes.json().catch(() => ({}));

        const classList: ClassOption[] = Array.isArray(classesJson)
          ? classesJson
          : Array.isArray(classesJson?.data)
            ? classesJson.data
            : [];

        const orgList: OrgOption[] = Array.isArray(orgsJson)
          ? orgsJson
          : Array.isArray(orgsJson?.data)
            ? orgsJson.data
            : Array.isArray(orgsJson?.data?.organizations)
              ? orgsJson.data.organizations
              : Array.isArray(orgsJson?.organizations)
                ? orgsJson.organizations
                : Array.isArray(orgsJson?.items)
                  ? orgsJson.items
                  : Array.isArray(orgsJson?.data?.items)
                    ? orgsJson.data.items
                    : [];

        setClasses(classList);
        setOrgs(orgList);

        if (classList.length && !selectedClass) {
          setSelectedClass(classList[0].code);
        }
        if (orgList.length && !selectedOrg) {
          setSelectedOrg(orgList[0].id);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load rankings admin data");
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    if (scope === "ORGANIZATION" && !selectedOrg) return;

    const loadRankings = async () => {
      try {
        setLoading(true);
        setError(null);

        const path =
          scope === "NATIONAL"
            ? `/rankings/national/${encodeURIComponent(selectedClass)}?limit=${limit}`
            : `/rankings/organization/${encodeURIComponent(selectedOrg)}/${encodeURIComponent(selectedClass)}?limit=${limit}`;

        const res = await apiFetch(path, {
          method: "GET",
          noRefresh: true,
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.message || "Failed to load rankings.");
        }

        const json = await res.json().catch(() => ({}));
        const nextRows: RankingRow[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : [];

        setRows(nextRows);
      } catch (e: any) {
        setError(e?.message || "Failed to load rankings");
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, [scope, selectedClass, selectedOrg, limit]);

  const filteredRows = useMemo(() => {
    return eligibleOnly
      ? rows.filter((r) => Boolean(Number(r.eligible)))
      : rows;
  }, [rows, eligibleOnly]);

  const topRow = filteredRows[0];

  const averageOverall = useMemo(() => {
    if (!filteredRows.length) return 0;
    const vals = filteredRows.map((r) => Number(r.overallRating ?? 0));
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [filteredRows]);

  const averageRankingScore = useMemo(() => {
    if (!filteredRows.length) return 0;
    return (
      filteredRows.reduce((sum, r) => sum + Number(r.rankingScore ?? 0), 0) /
      filteredRows.length
    );
  }, [filteredRows]);

  const chartMax = useMemo(() => {
    return Math.max(1, ...filteredRows.map((r) => Number(r.rankingScore ?? 0)));
  }, [filteredRows]);

  const lastRecalculatedAt = useMemo(() => {
    const dates = filteredRows
      .map((r: any) => r?.computedAt || r?.computed_at)
      .filter(Boolean)
      .map((d: string) => new Date(d).getTime())
      .filter((n) => !Number.isNaN(n));

    if (!dates.length) return "";
    return new Date(Math.max(...dates)).toLocaleString();
  }, [filteredRows]);

  const selectedClassMeta = useMemo(
    () => classes.find((c) => c.code === selectedClass),
    [classes, selectedClass],
  );

  const selectedOrgMeta = useMemo(
    () => orgs.find((o) => o.id === selectedOrg),
    [orgs, selectedOrg],
  );

  const visibleClassChips = useMemo(() => classes.slice(0, 8), [classes]);

  const handleRecalculate = async () => {
    try {
      setRecalcLoading(true);
      setError(null);

      const res = await apiFetch("/ranking-calculator/recalculate", {
        method: "POST",
        noRefresh: true,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to recalculate rankings");
      }

      const refreshPath =
        scope === "NATIONAL"
          ? `/rankings/national/${encodeURIComponent(selectedClass)}?limit=${limit}`
          : `/rankings/organization/${encodeURIComponent(selectedOrg)}/${encodeURIComponent(selectedClass)}?limit=${limit}`;

      const refreshRes = await apiFetch(refreshPath, {
        method: "GET",
        noRefresh: true,
      });

      if (!refreshRes.ok) {
        const j = await refreshRes.json().catch(() => ({}));
        throw new Error(
          j?.message || "Failed to refresh rankings after recalculation",
        );
      }

      const refreshJson = await refreshRes.json().catch(() => ({}));
      setRows(
        Array.isArray(refreshJson) ? refreshJson : (refreshJson?.data ?? []),
      );
    } catch (e: any) {
      setError(e?.message || "Failed to recalculate");
    } finally {
      setRecalcLoading(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "rank",
      "athleteName",
      "classGroupCode",
      "classGroupName",
      "scope",
      "organizationName",
      "overallRating",
      "rankingScore",
      "racesCount",
      "winsCount",
      "podiumsCount",
      "eligible",
    ];

    const lines = filteredRows.map((row) =>
      [
        row.rankingPosition,
        row.athleteName,
        row.classGroupCode,
        row.classGroupName,
        scope,
        row.organizationName ?? "",
        Number(row.overallRating ?? 0).toFixed(1),
        Number(row.rankingScore ?? 0).toFixed(2),
        row.racesCount,
        row.winsCount ?? 0,
        row.podiumsCount ?? 0,
        Number(row.eligible) ? "Official" : "Provisional",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );

    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `corner-league-rankings-${scope.toLowerCase()}-${selectedClass.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-3 text-[11px] uppercase tracking-[0.35em] text-cyan-300/70">
            Super Admin · Stats & Rankings
          </div>

          <div className="overflow-hidden rounded-[28px] border border-cyan-400/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),linear-gradient(90deg,rgba(4,19,34,0.98),rgba(0,34,68,0.92),rgba(4,19,34,0.98))] p-6 shadow-[0_10px_50px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-200">
              Corner League Rankings Console
            </div>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Admin Rankings Dashboard
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
                  View national and organization leaderboards, inspect rating
                  outputs, export ranked data, and manually trigger
                  recalculation from one Corner League control panel.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Export CSV
                </button>

                <button
                  onClick={handleRecalculate}
                  disabled={recalcLoading}
                  className={cn(
                    "inline-flex items-center rounded-xl border border-cyan-400/20 px-4 py-3 text-sm font-medium transition",
                    recalcLoading
                      ? "cursor-not-allowed bg-cyan-400/10 text-cyan-200/60"
                      : "bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20",
                  )}
                >
                  {recalcLoading ? "Recalculating..." : "Recalculate Rankings"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-300">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                Scope:{" "}
                <span className="font-medium text-white">
                  {scope === "NATIONAL" ? "National" : "Organization"}
                </span>
              </div>

              {selectedClassMeta ? (
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Class:{" "}
                  <span className="font-medium text-white">
                    {selectedClassMeta.displayName}
                  </span>
                </div>
              ) : null}

              {scope === "ORGANIZATION" && selectedOrgMeta ? (
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Organization:{" "}
                  <span className="font-medium text-white">
                    {selectedOrgMeta.name}
                  </span>
                </div>
              ) : null}

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                Last recalculated:{" "}
                <span className="font-medium text-white">
                  {lastRecalculatedAt || "Not available yet"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {visibleClassChips.map((item) => (
            <button
              key={item.code}
              onClick={() => setSelectedClass(item.code)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm transition",
                selectedClass === item.code
                  ? "border-cyan-400/30 bg-cyan-400/10 text-white"
                  : "border-white/8 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]",
              )}
            >
              {item.displayName}
            </button>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white/5 bg-[#07111a] p-5">
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300/70">
              Filters
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-400">
                  Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["NATIONAL", "ORGANIZATION"] as ScopeType[]).map((item) => (
                    <button
                      key={item}
                      onClick={() => setScope(item)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm transition",
                        scope === item
                          ? "border-cyan-400/30 bg-cyan-400/10 text-white"
                          : "border-white/5 bg-white/[0.02] text-gray-300 hover:bg-white/[0.05]",
                      )}
                    >
                      {item === "NATIONAL" ? "National" : "Organization"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-400">
                  Class Group
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-black/40 px-3 py-3 text-sm text-white outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {scope === "ORGANIZATION" ? (
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-400">
                    Organization
                  </label>
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-black/40 px-3 py-3 text-sm text-white outline-none"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-400">
                  Top Limit
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/5 bg-black/40 px-3 py-3 text-sm text-white outline-none"
                >
                  {[5, 10, 15, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      Top {n}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-black"
                />
                Official only (3+ races)
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Rows Loaded"
                value={filteredRows.length}
                hint="Current filtered leaderboard rows"
              />
              <StatCard
                label="Average OVR"
                value={averageOverall.toFixed(1)}
                hint="Average overall rating in current view"
              />
              <StatCard
                label="Average Rank Score"
                value={averageRankingScore.toFixed(1)}
                hint="Average weighted ranking score"
              />
              <StatCard
                label="Top Athlete"
                value={topRow?.athleteName ?? "—"}
                hint={topRow?.classGroupName ?? "No current leader"}
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_420px]">
              <div className="rounded-2xl border border-white/5 bg-[#07111a] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
                      Leaderboard
                    </div>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      {scope === "NATIONAL"
                        ? "National Rankings"
                        : "Organization Rankings"}
                    </h2>
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedClassMeta?.displayName || selectedClass}
                  </div>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="py-16 text-center text-gray-400">
                      Loading rankings...
                    </div>
                  ) : filteredRows.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                      No ranking rows found for the selected filters.
                    </div>
                  ) : (
                    filteredRows.map((row) => {
                      const width =
                        (Number(row.rankingScore ?? 0) / chartMax) * 100;

                      return (
                        <div
                          key={row.id}
                          className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-base font-semibold text-white">
                                #{row.rankingPosition}
                              </div>

                              <div>
                                <Link
                                  href={`/racer/${encodeURIComponent(row.athleteId)}`}
                                >
                                  <button className="text-left text-lg font-medium text-white transition hover:text-cyan-300">
                                    {row.athleteName}
                                  </button>
                                </Link>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-400">
                                  <span>{row.classGroupName}</span>
                                  {scope === "ORGANIZATION" ? (
                                    <OrgBadge
                                      name={row.organizationName}
                                      abbreviation={
                                        row.organizationAbbreviation
                                      }
                                    />
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xl font-semibold text-white">
                                {Number(row.overallRating ?? 0).toFixed(1)}
                              </div>
                              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                                OVR
                              </div>
                            </div>
                          </div>

                          <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm text-gray-300 md:grid-cols-5">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                                Rank Score
                              </div>
                              <div className="mt-1 font-medium text-white">
                                {Number(row.rankingScore ?? 0).toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                                Races
                              </div>
                              <div className="mt-1 font-medium text-white">
                                {row.racesCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                                Wins
                              </div>
                              <div className="mt-1 font-medium text-white">
                                {row.winsCount ?? 0}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                                Podiums
                              </div>
                              <div className="mt-1 font-medium text-white">
                                {row.podiumsCount ?? 0}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                                Status
                              </div>
                              <div
                                className={cn(
                                  "mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium",
                                  Number(row.eligible)
                                    ? "bg-emerald-400/10 text-emerald-300"
                                    : "bg-amber-400/10 text-amber-300",
                                )}
                              >
                                {Number(row.eligible)
                                  ? "Official"
                                  : "Provisional"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#07111a] p-5">
                <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
                  Leader Snapshot
                </div>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Rating Breakdown
                </h2>

                {topRow ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                      <div className="text-sm text-gray-400">
                        Current leader
                      </div>
                      <Link
                        href={`/racer/${encodeURIComponent(topRow.athleteId)}`}
                      >
                        <button className="mt-1 text-left text-2xl font-semibold text-white transition hover:text-cyan-300">
                          {topRow.athleteName}
                        </button>
                      </Link>
                      <div className="mt-1 text-sm text-gray-400">
                        #{topRow.rankingPosition} · {topRow.classGroupName}
                      </div>
                      {scope === "ORGANIZATION" ? (
                        <div className="mt-3">
                          <OrgBadge
                            name={topRow.organizationName}
                            abbreviation={topRow.organizationAbbreviation}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <RatingPill
                        label="Overall"
                        value={topRow.overallRating}
                      />
                      <RatingPill label="Speed" value={topRow.speedRating} />
                      <RatingPill
                        label="Consistency"
                        value={topRow.consistencyRating}
                      />
                      <RatingPill
                        label="Strength"
                        value={topRow.strengthRating}
                      />
                      <RatingPill
                        label="Momentum"
                        value={topRow.momentumRating}
                      />
                      <RatingPill
                        label="Versatility"
                        value={topRow.versatilityRating}
                      />
                      <RatingPill
                        label="Activity"
                        value={topRow.activityRating}
                      />
                      <RatingPill
                        label="Confidence"
                        value={topRow.confidenceScore}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-gray-500">
                    No leader to display yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#07111a] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
                    Data Table
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    Rankings Grid
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-gray-500">
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">Athlete</th>
                      <th className="px-3 py-2">Class</th>
                      <th className="px-3 py-2">OVR</th>
                      <th className="px-3 py-2">Score</th>
                      <th className="px-3 py-2">Races</th>
                      <th className="px-3 py-2">Wins</th>
                      <th className="px-3 py-2">Podiums</th>
                      <th className="px-3 py-2">Eligible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className="rounded-2xl bg-white/[0.02] text-sm text-gray-200"
                      >
                        <td className="rounded-l-xl px-3 py-3 font-semibold text-white">
                          #{row.rankingPosition}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/racer/${encodeURIComponent(row.athleteId)}`}
                          >
                            <button className="text-left transition hover:text-cyan-300">
                              {row.athleteName}
                            </button>
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <span>{row.classGroupCode}</span>
                            {scope === "ORGANIZATION" ? (
                              <div>
                                <OrgBadge
                                  name={row.organizationName}
                                  abbreviation={row.organizationAbbreviation}
                                />
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {Number(row.overallRating ?? 0).toFixed(1)}
                        </td>
                        <td className="px-3 py-3">
                          {Number(row.rankingScore ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3">{row.racesCount}</td>
                        <td className="px-3 py-3">{row.winsCount ?? 0}</td>
                        <td className="px-3 py-3">{row.podiumsCount ?? 0}</td>
                        <td className="rounded-r-xl px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                              Number(row.eligible)
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-amber-400/10 text-amber-300",
                            )}
                          >
                            {Number(row.eligible) ? "Official" : "Provisional"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
