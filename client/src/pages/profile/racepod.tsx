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

function formatElapsedTime(startedAt?: string | null) {
  if (!startedAt) return "00:00";

  const start = new Date(startedAt).getTime();

  if (Number.isNaN(start)) return "00:00";

  const totalSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
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
    <div className="relative overflow-hidden rounded-[24px] border border-cl-accent/10 bg-cl-surface p-5 shadow-cl-panel">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cl-accent/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
            {label}
          </div>
          <div className="mt-2 text-3xl font-black text-cl-ink">{value}</div>
          {helper ? (
            <div className="mt-1 text-sm text-cl-muted">{helper}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cl-accent/15 bg-cl-accent/10 text-cl-accent">
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
          : "border-cl-accent/15 bg-cl-accent/10 text-cl-accent";

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

      <p className="mt-2 text-sm leading-6 text-cl-muted">{status.message}</p>

      {status.receivedAt ? (
        <div className="mt-2 text-xs text-cl-muted">
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
  const [timerTick, setTimerTick] = useState(0);
  const [lastCompletedSessionId, setLastCompletedSessionId] = useState<
    string | null
  >(null);

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

  const activeElapsedTime = activeSession?.startedAt
    ? formatElapsedTime(activeSession.startedAt)
    : "00:00";

  void timerTick;

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

  useEffect(() => {
    if (!activeSession?.id) return;

    const interval = window.setInterval(() => {
      setTimerTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeSession?.id]);

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

    if (activeSession?.id) {
      toast({
        title: "Session already recording",
        description:
          "Stop the current RacePod session before starting another one.",
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

      const cleanSessionName = sessionName.trim() || "RacePod Practice Session";

      const res = await apiFetch("/telemetry/my/sessions/start", {
        method: "POST",
        body: JSON.stringify({
          userId,
          deviceId: selectedDevice.id,
          name: cleanSessionName,
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

      if (data?.alreadyActive) {
        toast({
          title: "RacePod already recording",
          description:
            "This RacePod already has an active session. Stop it before starting another one.",
        });

        await loadOverview(true);
        return;
      }

      if (data?.pendingStart) {
        toast({
          title: "RacePod is waking up",
          description:
            "The command timed out, but your session was created. Stay on this page and stop it when you are done.",
        });
      } else {
        toast({
          title: "RacePod session started",
          description: `${getDeviceName(
            selectedDevice,
          )} is recording. Stay on this page to stop when finished.`,
        });
      }

      await loadOverview(true);
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

      if (activeSession?.id) {
        toast({
          title: "Replay ready",
          description:
            "You can now view, publish, or share this RacePod replay.",
        });
      }

      setLastCompletedSessionId(activeSession.id);
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
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-cl-canvas text-cl-ink">
        <div className="pointer-events-none absolute inset-0 cl-panel-wash" />
        <div className="relative rounded-[28px] border border-cl-accent/10 bg-cl-surface px-8 py-7 text-center shadow-cl-panel">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full border border-cl-accent/25 bg-cl-accent/10" />
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cl-accent">
            Loading RacePod
          </div>
          <div className="mt-2 text-sm text-cl-muted">
            Checking device status and telemetry…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cl-canvas text-cl-ink">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cl-canvas" />
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-cl-accent/10 cl-panel-wash p-6 shadow-cl-panel sm:p-8">
          <div className="inline-flex items-center rounded-full border border-cl-accent/25 bg-cl-accent/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
            Corner League RacePod
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <h1 className="max-w-3xl cl-title-accent  text-4xl font-black uppercase italic tracking-[0.04em]  sm:text-6xl">
                Your Data
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-cl-muted">
                Sync your RacePod, record GPS sessions, review speed and route
                analytics, and publish premium replay highlights to your racer
                profile.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-cl-muted">
                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Status:{" "}
                  <span className="font-bold text-cl-ink">
                    {connected ? "Connected" : "Not activated"}
                  </span>
                </span>

                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Devices:{" "}
                  <span className="font-bold text-cl-ink">
                    {devices.length}
                  </span>
                </span>

                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Sessions:{" "}
                  <span className="font-bold text-cl-ink">
                    {overview?.sessions?.total ?? 0}
                  </span>
                </span>

                <span className="rounded-full border border-cl-border bg-cl-subtle px-3 py-1.5">
                  Points:{" "}
                  <span className="font-bold text-cl-ink">
                    {overview?.points?.total ?? 0}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => setShowActivationPanel((value) => !value)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cl-accent/25 bg-cl-accent/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
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
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cl-accent/20 bg-cl-accent/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
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
          <section className="mt-6 rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel">
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                  Activate Device
                </div>

                <h2 className="mt-3 text-3xl font-black text-cl-ink">
                  {connected ? "Add another RacePod" : "Connect your RacePod"}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-cl-muted">
                  Enter the activation code from your RacePod package. You can
                  add multiple devices, rename them, and choose which RacePod
                  records each session.
                </p>
              </div>

              <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
                  Activation Code
                </label>

                <input
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="Example: CL-RP-ABC123"
                  className="mt-3 h-12 w-full rounded-2xl border border-cl-border bg-cl-subtle px-4 text-sm text-cl-ink outline-none placeholder:text-cl-muted focus:border-cl-accent/30"
                />

                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={actionLoading}
                  className="mt-4 h-12 w-full rounded-2xl bg-cl-accent px-5 text-sm font-black uppercase tracking-[0.14em] text-cl-contrast transition hover:bg-cl-accent disabled:cursor-not-allowed disabled:opacity-60"
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

            <section className="mt-6 rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                    My Devices
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-cl-ink">
                    RacePod Garage
                  </h2>
                  <p className="mt-2 text-sm text-cl-muted">
                    Select the device you want to use, rename it, or remove old
                    RacePods from your account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowActivationPanel(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-cl-accent/20 bg-cl-accent/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
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
                          ? "border-cl-accent/35 bg-cl-accent/10"
                          : "border-cl-border bg-cl-subtle hover:border-cl-accent/20",
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
                              className="h-11 w-full rounded-2xl border border-cl-border bg-cl-subtle px-4 text-sm font-bold text-cl-ink outline-none placeholder:text-cl-muted focus:border-cl-accent/30"
                              placeholder="RacePod name"
                              autoFocus
                            />
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-lg font-black text-cl-ink">
                                  {getDeviceName(device)}
                                </h3>

                                {isSelected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cl-accent">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Selected
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-1 font-mono text-[11px] text-cl-muted">
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
                                ? "border border-cl-accent/20 bg-cl-accent text-cl-contrast"
                                : "border border-cl-accent/20 bg-cl-accent/10 text-cl-accent hover:bg-cl-accent hover:text-cl-contrast",
                            )}
                          >
                            {isSelected ? "Active" : "Use"}
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-cl-muted">
                        <div className="flex items-center gap-2">
                          <Radio className="h-4 w-4 text-cl-accent" />
                          External: {device.externalDeviceId || "—"}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPinned className="h-4 w-4 text-cl-accent" />
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
                              className="inline-flex h-10 items-center justify-center rounded-2xl bg-cl-accent px-4 text-xs font-black uppercase tracking-[0.12em] text-cl-contrast transition hover:bg-cl-accent disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Save Name
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditingDevice}
                              disabled={actionLoading}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-cl-border bg-cl-subtle px-4 text-xs font-black uppercase tracking-[0.12em] text-cl-muted transition hover:bg-cl-subtle disabled:cursor-not-allowed disabled:opacity-60"
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
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-cl-border bg-cl-subtle px-4 text-xs font-black uppercase tracking-[0.12em] text-cl-muted transition hover:bg-cl-subtle disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Pencil className="h-4 w-4" />
                              Rename
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDevice(device)}
                              disabled={actionLoading || activeSession?.id}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-500 hover:text-cl-ink disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </>
                        )}
                      </div>

                      {activeSession?.id ? (
                        <div className="mt-3 rounded-2xl border border-cl-border bg-cl-subtle px-3 py-2 text-xs text-cl-muted">
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
              <div className="rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                      Session Control
                    </div>
                    <h2 className="mt-2 text-2xl font-black text-cl-ink">
                      {activeSession ? "Recording Live" : "Start a Session"}
                    </h2>
                  </div>

                  {activeSession ? (
                    <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-300">
                      Live
                    </span>
                  ) : null}
                </div>

                <div className="mb-4 rounded-2xl border border-cl-border bg-cl-subtle p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-accent">
                    Selected RacePod
                  </div>
                  <div className="mt-2 text-lg font-black text-cl-ink">
                    {selectedDevice ? getDeviceName(selectedDevice) : "—"}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-cl-muted">
                    {selectedDevice?.id || "No device selected"}
                  </div>
                </div>

                <RacePodStatusAlert status={selectedDeviceStatus} />

                {!activeSession ? (
                  <>
                    <input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-cl-border bg-cl-subtle px-4 text-sm text-cl-ink outline-none placeholder:text-cl-muted focus:border-cl-accent/30"
                      placeholder="Session name"
                    />

                    <button
                      type="button"
                      onClick={handleStartSession}
                      disabled={actionLoading || !selectedDevice?.id}
                      className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cl-accent px-5 text-sm font-black uppercase tracking-[0.14em] text-cl-contrast transition hover:bg-cl-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Play className="h-5 w-5" />
                      {actionLoading
                        ? "Contacting RacePod..."
                        : "Start RacePod"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/70">
                            Active Recording
                          </div>

                          <div className="mt-2 text-lg font-black text-cl-ink">
                            {activeSession.name ||
                              activeSession.title ||
                              "RacePod Session"}
                          </div>

                          <div className="mt-1 break-all font-mono text-xs text-cl-muted">
                            {activeSession.id}
                          </div>

                          <div className="mt-3 text-sm text-cl-muted">
                            Started {formatDate(activeSession.startedAt)}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-2xl border border-emerald-300/20 bg-cl-subtle px-4 py-3 text-left sm:text-right">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/70">
                            Timer
                          </div>
                          <div className="mt-1 font-mono text-3xl font-black text-emerald-100">
                            {activeElapsedTime}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cl-muted">
                            Points Collected
                          </div>
                          <div className="mt-1 text-xl font-black text-cl-ink">
                            {activeSession.pointCount ??
                              latest?.pointCount ??
                              0}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-cl-border bg-cl-subtle p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cl-muted">
                            Latest Speed
                          </div>
                          <div className="mt-1 text-xl font-black text-cl-ink">
                            {valueOrDash(latest?.speedMph, " mph")}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-cl-border bg-cl-subtle p-3 text-xs leading-6 text-cl-muted">
                        Keep this page open while recording. Stop the session
                        here when you are finished so the replay can be
                        finalized.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleStopSession}
                      disabled={actionLoading}
                      className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-cl-accent/25 bg-cl-accent/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Square className="h-5 w-5" />
                      {actionLoading ? "Stopping..." : "Stop Session"}
                    </button>
                  </>
                )}
              </div>

              <div className="rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                  Device
                </div>

                <h2 className="mt-2 text-2xl font-black text-cl-ink">
                  {getDeviceName(selectedDevice)}
                </h2>

                <div className="mt-4 space-y-3 text-sm text-cl-muted">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-cl-accent" />
                    Device ID: {selectedDevice?.id || "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cl-accent" />
                    External: {selectedDevice?.externalDeviceId || "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-cl-accent" />
                    Last seen: {formatDate(selectedDevice?.lastSeenAt)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEmergencyStopDevice}
                  disabled={actionLoading || !selectedDevice?.id}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-cl-accent/25 bg-cl-accent/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Emergency Stop RacePod
                </button>
              </div>
            </section>

            {lastCompletedSessionId ? (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/racepod/sessions/${encodeURIComponent(lastCompletedSessionId)}`,
                  )
                }
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-cl-accent/20 bg-cl-accent/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
              >
                View Completed Replay
              </button>
            ) : null}

            <section className="mt-6 rounded-[30px] border border-cl-accent/10 bg-cl-surface p-6 shadow-cl-panel">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                    Recent Sessions
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-cl-ink">
                    RacePod History
                  </h2>
                </div>
              </div>

              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
                {recentSessions.length ? (
                  recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="grid gap-4 rounded-2xl border border-cl-border bg-cl-subtle p-4 sm:grid-cols-[1fr_auto_auto]"
                    >
                      <div>
                        <div className="font-bold text-cl-ink">
                          {session.name || "Untitled Session"}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-cl-muted">
                          {session.id}
                        </div>
                        <div className="mt-2 text-sm text-cl-muted">
                          {formatDate(session.startedAt)}
                        </div>
                      </div>

                      <div className="text-sm text-cl-muted">
                        Points:{" "}
                        <span className="font-bold text-cl-ink">
                          {session.pointCount ?? 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/racepod/sessions/${session.id}`)
                          }
                          className="rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-cl-accent transition hover:bg-cl-accent hover:text-cl-contrast"
                        >
                          View
                        </button>
                        <button className="rounded-full border border-cl-border bg-cl-subtle px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-cl-muted">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-cl-border bg-cl-subtle p-8 text-center text-cl-muted">
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
