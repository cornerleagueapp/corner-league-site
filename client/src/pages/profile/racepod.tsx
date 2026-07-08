import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Battery,
  CheckCircle2,
  Cpu,
  Database,
  MapPinned,
  Pencil,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Route,
  Share2,
  Square,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type RacePodDevice = {
  id: string;
  nickname?: string | null;
  displayName?: string | null;
  externalDeviceId?: string | null;
  lastSeenAt?: string | null;
  athleteId?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RacePodOverview = {
  userId: string;
  hasDevice: boolean;
  primaryDevice?: RacePodDevice | null;
  primaryDeviceStatus?: RacePodDeviceStatus | null;
  deviceStatuses?: Record<string, RacePodDeviceStatus | null>;
  devices: RacePodDevice[];
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

type RacePodDeviceStatus = {
  status?: "started" | "stopped" | "no_location" | "unknown" | string;
  sessionId?: string | null;
  message?: string | null;
  severity?: "ready" | "recording" | "warning" | "error" | "idle" | string;
  receivedAt?: string | null;
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

function getDeviceName(device?: RacePodDevice | null) {
  if (!device) return "RacePod";
  return device.nickname || device.displayName || "RacePod";
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

function RacePodStatusAlert({
  status,
}: {
  status?: RacePodDeviceStatus | null;
}) {
  if (!status?.message) return null;

  const severity = String(status.severity || "").toLowerCase();

  const styles =
    severity === "recording"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      : severity === "warning"
        ? "border-amber-300/20 bg-amber-400/10 text-amber-100"
        : severity === "error"
          ? "border-red-300/20 bg-red-500/10 text-red-100"
          : "border-cyan-300/15 bg-cyan-300/10 text-cyan-100";

  const label =
    status.status === "no_location"
      ? "Waiting for GPS"
      : status.status === "started"
        ? "RacePod Recording"
        : status.status === "stopped"
          ? "RacePod Stopped"
          : "RacePod Status";

  return (
    <div className={cn("mt-4 rounded-2xl border p-4", styles)}>
      <div className="text-[10px] font-black uppercase tracking-[0.18em]">
        {label}
      </div>

      <p className="mt-2 text-sm leading-6 text-white/75">{status.message}</p>

      {status.receivedAt ? (
        <div className="mt-2 text-xs text-white/45">
          Last status: {formatDate(status.receivedAt)}
        </div>
      ) : null}
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

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [showActivationPanel, setShowActivationPanel] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState("");

  const devices = useMemo(() => overview?.devices ?? [], [overview]);
  const primaryDevice = overview?.primaryDevice;
  const selectedDevice =
    devices.find((device) => device.id === selectedDeviceId) ||
    primaryDevice ||
    devices[0] ||
    null;

  const selectedDeviceStatus = selectedDevice?.id
    ? overview?.deviceStatuses?.[selectedDevice.id] ||
      overview?.primaryDeviceStatus ||
      null
    : overview?.primaryDeviceStatus || null;

  const latest = overview?.latestLivePosition;
  const activeSession = overview?.activeSession;

  const connected = devices.length > 0 || !!overview?.hasDevice;

  const recentSessions = useMemo(
    () => overview?.sessions?.recent ?? [],
    [overview],
  );

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
      setShowActivationPanel(true);
    }
  }, []);

  useEffect(() => {
    if (selectedDeviceId) return;

    const firstDeviceId = primaryDevice?.id || devices[0]?.id;

    if (firstDeviceId) {
      setSelectedDeviceId(firstDeviceId);
    }
  }, [devices, primaryDevice?.id, selectedDeviceId]);

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
        body: JSON.stringify({
          userId,
          activationCode: activationCode.trim(),
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Could not activate RacePod.");
      }

      const json = await res.json().catch(() => ({}));
      const data = json?.data ?? json;
      const activatedDevice = data?.device ?? data?.racePod ?? data;

      toast({
        title: "RacePod activated",
        description: "Your RacePod is now linked to your account.",
      });

      setActivationCode("");
      setShowActivationPanel(false);

      if (activatedDevice?.id) {
        setSelectedDeviceId(activatedDevice.id);
      }

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

  const startEditingDevice = (device: RacePodDevice) => {
    setEditingDeviceId(device.id);
    setEditingDeviceName(getDeviceName(device));
  };

  const cancelEditingDevice = () => {
    setEditingDeviceId(null);
    setEditingDeviceName("");
  };

  const handleRenameDevice = async (device: RacePodDevice) => {
    const nickname = editingDeviceName.trim();

    if (!nickname) {
      toast({
        title: "Device name required",
        description: "Enter a name for this RacePod.",
      });
      return;
    }

    try {
      setActionLoading(true);

      const res = await apiFetch(`/telemetry/my/devices/${device.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          userId,
          nickname,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Could not rename RacePod.");
      }

      toast({
        title: "RacePod renamed",
        description: "Your device name has been updated.",
      });

      cancelEditingDevice();
      await loadOverview(true);
    } catch (e: any) {
      toast({
        title: "Rename failed",
        description: e?.message || "Could not rename RacePod.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDevice = async (device: RacePodDevice) => {
    const confirmed = window.confirm(
      `Remove ${getDeviceName(
        device,
      )} from your account? You can activate it again later with an activation code.`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const res = await apiFetch(`/telemetry/my/devices/${device.id}/unlink`, {
        method: "POST",
        body: JSON.stringify({
          userId,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Could not remove RacePod.");
      }

      toast({
        title: "RacePod removed",
        description: "The device has been removed from your account.",
      });

      if (selectedDeviceId === device.id) {
        setSelectedDeviceId("");
      }

      await loadOverview(true);
    } catch (e: any) {
      toast({
        title: "Remove failed",
        description: e?.message || "Could not remove RacePod.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!userId) {
      toast({
        title: "Please log in again",
        description: "We could not find your user ID for RacePod recording.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDevice?.id) {
      toast({
        title: "Select a RacePod",
        description: "Choose which device should record this session.",
      });
      return;
    }

    try {
      console.log("[RacePod start payload]", {
        userId,
        deviceId: selectedDevice.id,
        externalDeviceId: selectedDevice.externalDeviceId,
        sessionName,
        user,
      });

      setActionLoading(true);

      const res = await apiFetch("/telemetry/my/sessions/start", {
        method: "POST",
        body: JSON.stringify({
          userId,
          deviceId: selectedDevice.id,
          name: sessionName || "RacePod Practice Session",
          type: "practice",
          athleteId: selectedDevice.athleteId || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      const data = json?.data ?? json;

      if (!res.ok) {
        console.error("[RacePod start failed]", json);

        const particleMessage =
          data?.particleResponse?.error ||
          data?.particleResponse?.message ||
          data?.result?.particleResponse?.error ||
          data?.result?.particleResponse?.message ||
          data?.result?.message ||
          data?.message ||
          json?.message;

        throw new Error(
          particleMessage ||
            "Could not start RacePod session. Check the RacePod signal, light, and battery, then try again.",
        );
      }

      const sessionId = data?.session?.id || data?.sessionId;

      if (data?.pendingStart) {
        toast({
          title: "RacePod is waking up",
          description:
            "The command timed out, but your session was created. Keep the RacePod powered on and wait for telemetry.",
        });
      } else {
        toast({
          title: "RacePod session started",
          description: `${getDeviceName(
            selectedDevice,
          )} is recording live telemetry.`,
        });
      }

      await loadOverview();

      if (sessionId) {
        navigate(`/racepod/sessions/${encodeURIComponent(String(sessionId))}`);
      }
    } catch (e: any) {
      toast({
        title: "RacePod could not start",
        description:
          e?.message ||
          "Could not start RacePod session. Check signal, battery, and device light, then try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };
  const handleEmergencyStopDevice = async () => {
    if (!selectedDevice?.id) return;

    try {
      setActionLoading(true);

      const res = await apiFetch(
        `/telemetry/my/devices/${selectedDevice.id}/stop-race-mode`,
        {
          method: "POST",
          body: JSON.stringify({ userId }),
        },
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Could not stop RacePod.");
      }

      toast({
        title: "RacePod stopped",
        description: `${getDeviceName(
          selectedDevice,
        )} was told to stop recording.`,
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
                  Devices:{" "}
                  <span className="font-bold text-white">{devices.length}</span>
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

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => setShowActivationPanel((value) => !value)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#FFB199] transition hover:bg-[#FF6B35] hover:text-white"
              >
                {showActivationPanel ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {showActivationPanel ? "Close Add Device" : "Add RacePod"}
              </button>

              <button
                type="button"
                onClick={() => loadOverview()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {showActivationPanel || !connected ? (
          <section className="mt-6 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Activate Device
                </div>

                <h2 className="mt-3 text-3xl font-black text-white">
                  {connected ? "Add another RacePod" : "Connect your RacePod"}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  Enter the activation code from your RacePod package. You can
                  add multiple devices, rename them, and choose which RacePod
                  records each session.
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
        ) : null}

        {connected ? (
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

            <section className="mt-6 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">
                    My Devices
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    RacePod Garage
                  </h2>
                  <p className="mt-2 text-sm text-white/45">
                    Select the device you want to use, rename it, or remove old
                    RacePods from your account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowActivationPanel(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
                >
                  <Plus className="h-4 w-4" />
                  Add Device
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {devices.map((device) => {
                  const isSelected = selectedDevice?.id === device.id;
                  const isEditing = editingDeviceId === device.id;

                  return (
                    <div
                      key={device.id}
                      className={cn(
                        "rounded-[24px] border p-4 transition",
                        isSelected
                          ? "border-cyan-300/35 bg-cyan-300/10"
                          : "border-white/10 bg-white/[0.035] hover:border-cyan-300/20",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              value={editingDeviceName}
                              onChange={(e) =>
                                setEditingDeviceName(e.target.value)
                              }
                              className="h-11 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30"
                              placeholder="RacePod name"
                              autoFocus
                            />
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-lg font-black text-white">
                                  {getDeviceName(device)}
                                </h3>

                                {isSelected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Selected
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-1 font-mono text-[11px] text-white/35">
                                {device.id}
                              </div>
                            </>
                          )}
                        </div>

                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => setSelectedDeviceId(device.id)}
                            className={cn(
                              "shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition",
                              isSelected
                                ? "border border-cyan-300/20 bg-cyan-300 text-[#06111d]"
                                : "border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300 hover:text-[#06111d]",
                            )}
                          >
                            {isSelected ? "Active" : "Use"}
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-white/55">
                        <div className="flex items-center gap-2">
                          <Radio className="h-4 w-4 text-cyan-200" />
                          External: {device.externalDeviceId || "—"}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPinned className="h-4 w-4 text-cyan-200" />
                          Last seen: {formatDate(device.lastSeenAt)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRenameDevice(device)}
                              disabled={actionLoading}
                              className="inline-flex h-10 items-center justify-center rounded-2xl bg-cyan-300 px-4 text-xs font-black uppercase tracking-[0.12em] text-[#06111d] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Save Name
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditingDevice}
                              disabled={actionLoading}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditingDevice(device)}
                              disabled={actionLoading}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Pencil className="h-4 w-4" />
                              Rename
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDevice(device)}
                              disabled={actionLoading || activeSession?.id}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </>
                        )}
                      </div>

                      {activeSession?.id ? (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/40">
                          Device removal is disabled while a RacePod session is
                          active.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

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

                <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">
                    Selected RacePod
                  </div>
                  <div className="mt-2 text-lg font-black text-white">
                    {selectedDevice ? getDeviceName(selectedDevice) : "—"}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-white/35">
                    {selectedDevice?.id || "No device selected"}
                  </div>
                </div>

                <RacePodStatusAlert status={selectedDeviceStatus} />

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
                      disabled={actionLoading || !selectedDevice?.id}
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
                  {getDeviceName(selectedDevice)}
                </h2>

                <div className="mt-4 space-y-3 text-sm text-white/55">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-cyan-200" />
                    Device ID: {selectedDevice?.id || "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyan-200" />
                    External: {selectedDevice?.externalDeviceId || "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-cyan-200" />
                    Last seen: {formatDate(selectedDevice?.lastSeenAt)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEmergencyStopDevice}
                  disabled={actionLoading || !selectedDevice?.id}
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
        ) : null}
      </div>
    </div>
  );
}
