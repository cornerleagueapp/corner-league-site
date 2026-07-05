import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Battery,
  Cpu,
  Database,
  MapPinned,
  Play,
  Radio,
  RefreshCw,
  Route,
  Share2,
  Square,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type RacePodOverview = {
  userId: string;
  hasDevice: boolean;
  primaryDevice?: any | null;
  devices: any[];
  latestLivePosition?: any | null;
  activeSession?: any | null;
  sessions: {
    total: number;
    active: number;
    completed: number;
    recent: any[];
  };
  points: {
    total: number;
  };
  generatedAt: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function valueOrDash(value: any, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-cyan-300/10 bg-[#07111F]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black text-white">{value}</div>
          {helper ? (
            <div className="mt-1 text-sm text-white/45">{helper}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function RacePodPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const userId = String(
    (user as any)?.id ||
      (user as any)?.userId ||
      (user as any)?.uid ||
      (user as any)?.firebaseUid ||
      "",
  );

  const [overview, setOverview] = useState<RacePodOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [sessionName, setSessionName] = useState("RacePod Practice Session");
  const [error, setError] = useState<string | null>(null);

  const primaryDevice = overview?.primaryDevice;
  const latest = overview?.latestLivePosition;
  const activeSession = overview?.activeSession;

  const loadOverview = async (silent = false) => {
    if (!userId) return;

    try {
      if (!silent) {
        setLoading(true);
      }

      setError(null);

      const res = await apiFetch(
        `/telemetry/my/overview?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          noRefresh: true,
        },
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Failed to load RacePod overview.");
      }

      const json = await res.json().catch(() => ({}));
      setOverview(json?.data ?? json);
    } catch (e: any) {
      setError(e?.message || "Failed to load RacePod overview.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && userId) {
      loadOverview();
    }
  }, [authLoading, isAuthenticated, userId]);

  useEffect(() => {
    if (!activeSession?.id) return;

    const interval = window.setInterval(() => {
      loadOverview(true);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [activeSession?.id, userId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setActivationCode(code);
    }
  }, []);

  const handleActivate = async () => {
    if (!activationCode.trim()) {
      toast({
        title: "Activation code required",
        description: "Enter the activation code from your RacePod.",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Please log in again",
        description: "We could not find your user ID for RacePod activation.",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(true);

      const res = await apiFetch("/telemetry/devices/activate", {
        method: "POST",
        noRefresh: true,
        body: JSON.stringify({
          userId,
          activationCode: activationCode.trim(),
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Could not activate RacePod.");
      }

      toast({
        title: "RacePod activated",
        description: "Your RacePod is now linked to your account.",
      });

      setActivationCode("");
      await loadOverview();
    } catch (e: any) {
      toast({
        title: "Activation failed",
        description: e?.message || "Could not activate RacePod.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!primaryDevice?.id) return;

    try {
      console.log("[RacePod start payload]", {
        userId,
        deviceId: primaryDevice?.id,
        sessionName,
        user,
      });

      setActionLoading(true);

      const res = await apiFetch("/telemetry/my/sessions/start", {
        method: "POST",
        noRefresh: true,
        body: JSON.stringify({
          userId,
          deviceId: primaryDevice.id,
          name: sessionName || "RacePod Practice Session",
          type: "practice",
          athleteId: primaryDevice.athleteId || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));

        console.error("[RacePod start failed]", json);

        const particleMessage =
          json?.result?.particleResponse?.error ||
          json?.result?.particleResponse?.message ||
          json?.result?.message ||
          json?.message;

        throw new Error(particleMessage || "Could not start RacePod session.");
      }

      const json = await res.json().catch(() => ({}));
      const data = json?.data ?? json;

      if (data?.pendingStart) {
        toast({
          title: "RacePod is waking up",
          description:
            "The start command timed out, but your session was created. Waiting for telemetry.",
        });
      } else {
        toast({
          title: "RacePod session started",
          description: "Your RacePod is recording live telemetry.",
        });
      }

      await loadOverview();
    } catch (e: any) {
      toast({
        title: "Start failed",
        description: e?.message || "Could not start RacePod session.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmergencyStopDevice = async () => {
    if (!primaryDevice?.id) return;

    try {
      setActionLoading(true);

      const res = await apiFetch(
        `/telemetry/my/devices/${primaryDevice.id}/stop-race-mode`,
        {
          method: "POST",
          noRefresh: true,
          body: JSON.stringify({ userId }),
        },
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Could not stop RacePod.");
      }

      toast({
        title: "RacePod stopped",
        description: "The physical RacePod was told to stop recording.",
      });

      await loadOverview(true);
    } catch (e: any) {
      toast({
        title: "Emergency stop failed",
        description: e?.message || "Could not stop RacePod.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!activeSession?.id) return;

    try {
      setActionLoading(true);

      const res = await apiFetch(
        `/telemetry/sessions/${activeSession.id}/stop`,
        {
          method: "POST",
          noRefresh: true,
        },
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Could not stop RacePod session.");
      }

      const json = await res.json().catch(() => ({}));
      const data = json?.data ?? json;

      toast({
        title: "RacePod session stopped",
        description: data?.stopWarning
          ? "Session completed. RacePod command timed out, but the app state was synced."
          : "Your replay and analytics are ready.",
      });

      await loadOverview(true);
    } catch (e: any) {
      toast({
        title: "Stop failed",
        description: e?.message || "Could not stop RacePod session.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const connected = !!overview?.hasDevice;

  const recentSessions = useMemo(
    () => overview?.sessions?.recent ?? [],
    [overview],
  );

  if (authLoading || loading) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#030913] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_28%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="relative rounded-[28px] border border-cyan-300/10 bg-[#07111F]/80 px-8 py-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full border border-cyan-300/25 bg-cyan-300/10" />
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
            Loading RacePod
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Checking device status and telemetry…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#030913]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_28%),radial-gradient(circle_at_50%_55%,rgba(7,17,31,0.82),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,19,0.25)_0%,rgba(3,9,19,0.72)_52%,rgba(3,9,19,0.95)_100%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.10)_0%,rgba(7,17,31,0.92)_48%,rgba(255,107,53,0.08)_100%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
            Corner League RacePod
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <h1 className="max-w-3xl bg-[linear-gradient(90deg,#FFFFFF_0%,#7CF4FF_50%,#FF7849_100%)] bg-clip-text text-4xl font-black uppercase italic tracking-[0.04em] text-transparent sm:text-6xl">
                Your Data
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Sync your RacePod, record GPS sessions, review speed and route
                analytics, and publish premium replay highlights to your racer
                profile.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/55">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Status:{" "}
                  <span className="font-bold text-white">
                    {connected ? "Connected" : "Not activated"}
                  </span>
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Sessions:{" "}
                  <span className="font-bold text-white">
                    {overview?.sessions?.total ?? 0}
                  </span>
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Points:{" "}
                  <span className="font-bold text-white">
                    {overview?.points?.total ?? 0}
                  </span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadOverview()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!connected ? (
          <section className="mt-6 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Activate Device
                </div>

                <h2 className="mt-3 text-3xl font-black text-white">
                  Connect your RacePod
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  Enter the activation code from your RacePod package. Once
                  linked, this tracker can record sessions to your account and,
                  later, publish selected sessions to your verified athlete
                  profile.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">
                  Activation Code
                </label>

                <input
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="Example: CL-RP-ABC123"
                  className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30"
                />

                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={actionLoading}
                  className="mt-4 h-12 w-full rounded-2xl bg-cyan-300 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? "Activating..." : "Activate RacePod"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Battery"
                value={valueOrDash(latest?.batteryPercent, "%")}
                helper="Latest device reading"
                icon={<Battery className="h-5 w-5" />}
              />

              <StatCard
                label="Latest Speed"
                value={valueOrDash(latest?.speedMph, " mph")}
                helper="Most recent live position"
                icon={<Zap className="h-5 w-5" />}
              />

              <StatCard
                label="Sessions"
                value={overview?.sessions?.total ?? 0}
                helper={`${overview?.sessions?.completed ?? 0} completed`}
                icon={<Activity className="h-5 w-5" />}
              />

              <StatCard
                label="Data Points"
                value={(overview?.points?.total ?? 0).toLocaleString()}
                helper="Total RacePod points"
                icon={<Database className="h-5 w-5" />}
              />
            </div>

            <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
              <div className="rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
                      Session Control
                    </div>
                    <h2 className="mt-2 text-2xl font-black text-white">
                      {activeSession ? "Recording Live" : "Start a Session"}
                    </h2>
                  </div>

                  {activeSession ? (
                    <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-300">
                      Live
                    </span>
                  ) : null}
                </div>

                {!activeSession ? (
                  <>
                    <input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30"
                      placeholder="Session name"
                    />

                    <button
                      type="button"
                      onClick={handleStartSession}
                      disabled={actionLoading}
                      className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#06111d] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Play className="h-5 w-5" />
                      {actionLoading
                        ? "Contacting RacePod..."
                        : "Start RacePod"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-sm font-bold text-white">
                        {activeSession.name || "RacePod Session"}
                      </div>
                      <div className="mt-1 font-mono text-xs text-white/35">
                        {activeSession.id}
                      </div>
                      <div className="mt-3 text-sm text-white/45">
                        Started {formatDate(activeSession.startedAt)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleStopSession}
                      disabled={actionLoading}
                      className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#FFB199] transition hover:bg-[#FF6B35] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Square className="h-5 w-5" />
                      {actionLoading ? "Stopping..." : "Stop Session"}
                    </button>
                  </>
                )}
              </div>

              <div className="rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
                  Device
                </div>

                <h2 className="mt-2 text-2xl font-black text-white">
                  {primaryDevice?.nickname ||
                    primaryDevice?.displayName ||
                    "RacePod"}
                </h2>

                <div className="mt-4 space-y-3 text-sm text-white/55">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-cyan-200" />
                    Device ID: {primaryDevice?.id}
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyan-200" />
                    External: {primaryDevice?.externalDeviceId}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-cyan-200" />
                    Last seen: {formatDate(primaryDevice?.lastSeenAt)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEmergencyStopDevice}
                  disabled={actionLoading}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-[#FFB199] transition hover:bg-[#FF6B35] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Emergency Stop RacePod
                </button>
              </div>
            </section>

            <section className="mt-6 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
                    Recent Sessions
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    RacePod History
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {recentSessions.length ? (
                  recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[1fr_auto_auto]"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {session.name || "Untitled Session"}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-white/35">
                          {session.id}
                        </div>
                        <div className="mt-2 text-sm text-white/45">
                          {formatDate(session.startedAt)}
                        </div>
                      </div>

                      <div className="text-sm text-white/60">
                        Points:{" "}
                        <span className="font-bold text-white">
                          {session.pointCount ?? 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/racepod/sessions/${session.id}`)
                          }
                          className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
                        >
                          View
                        </button>
                        <button className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/65">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/45">
                    No RacePod sessions yet.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
