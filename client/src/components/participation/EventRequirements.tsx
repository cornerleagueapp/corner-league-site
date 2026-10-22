import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { publicSportData, unwrapSportData } from "@/lib/sportRegistration";
import { useSandbox } from "@/pages/organizations/SandboxContext";
type Policy = {
  version: number;
  waiverText: string;
  guardianUnderAge: number;
  manualReview: boolean;
  documentLabel: string;
  documentRequired: boolean;
  questions: {
    id: string;
    label: string;
    kind: string;
    required: boolean;
    options: string[];
  }[];
};
type Attachment = { name: string; mime: string; base64: string };
type Profile = {
  id: string;
  source: "athlete" | "sport";
  name: string;
  birth: string;
  submission: {
    id: string;
    status: string;
    version: number;
    current: boolean;
    reviewReason: string;
    createdAt: string;
  } | null;
};
type Copy = {
  evidence: {
    acceptedAt: string;
    policy: Policy;
    submission: {
      signerName: string;
      signerRole: string;
      answers: { questionId: string; value: string }[];
      attachment: { name: string; mime: string } | null;
    };
  };
};
const input =
  "mt-2 block min-h-11 w-full rounded-xl border border-cl-border bg-cl-surface p-3";
const button =
  "min-h-11 rounded-xl border border-cl-border px-4 py-2 disabled:opacity-50";
const download = (body: Blob, name: string) => {
  const url = URL.createObjectURL(body),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
export default function EventRequirements({
  eventId,
  organizationId,
  sportKey,
}: {
  eventId: string;
  organizationId?: string;
  sportKey: string;
}) {
  const sandbox = useSandbox();
  const auth = useAuth();
  if (sandbox) return null;
  return (
    <Requirements
      key={`${eventId}:${organizationId ?? ""}:${auth.user?.id ?? "public"}`}
      eventId={eventId}
      org={organizationId}
      sportKey={sportKey}
    />
  );
}
function Requirements({
  eventId,
  org,
  sportKey,
}: {
  eventId: string;
  org?: string;
  sportKey: string;
}) {
  const auth = useAuth(),
    cache = useQueryClient(),
    alive = useRef(true),
    serial = useRef(0),
    writing = useRef(false);
  const policy = useQuery({
    queryKey: ["participation-public", eventId, org],
    queryFn: async () => {
      const v = await publicSportData<{
        eventId: string;
        organizationId?: string;
        policy: Policy | null;
      }>(`/participation/events/${eventId}`);
      if (v.eventId !== eventId || (org && v.organizationId !== org))
        throw new Error("Requirements do not match this event.");
      return v.policy;
    },
    staleTime: 15000,
    retry: false,
  });
  const me = useQuery({
    queryKey: ["participation-me", eventId, org, auth.user?.id],
    queryFn: async () => {
      const v = unwrapSportData<{
        eventId: string;
        organizationId?: string;
        profiles: Profile[];
      }>(
        await apiRequest(
          "GET",
          `/participation/events/${eventId}/me`,
          undefined,
          { refreshOn401: true },
        ),
      );
      if (v.eventId !== eventId || (org && v.organizationId !== org))
        throw new Error("Participant requirements do not match this event.");
      return v.profiles;
    },
    enabled: auth.isAuthenticated && !!policy.data,
    staleTime: 10000,
    retry: false,
  });
  const [profileId, setProfileId] = useState(""),
    [signerName, setSignerName] = useState(""),
    [role, setRole] = useState("self"),
    [accepted, setAccepted] = useState(false),
    [authority, setAuthority] = useState(false),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [attachment, setAttachment] = useState<Attachment>(),
    [fileKey, setFileKey] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reading, setReading] = useState(false),
    [copy, setCopy] = useState<Copy>();
  const retry = useRef<{ body: string; requestId: string }>();
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      serial.current++;
    };
  }, []);
  useEffect(() => {
    setAccepted(false);
    setAuthority(false);
    setAnswers({});
    setAttachment(undefined);
    setFileKey((k) => k + 1);
    setCopy(undefined);
    setReading(false);
    retry.current = undefined;
    serial.current++;
  }, [policy.data?.version, profileId]);
  useEffect(() => {
    if (!profileId && me.data?.length) setProfileId(me.data[0].id);
  }, [me.data, profileId]);
  const profile = me.data?.find((p) => p.id === profileId),
    status = profile?.submission;
  async function perform(fn: () => Promise<void>) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      writing.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function submit() {
    await perform(async () => {
      if (reading)
        throw new Error("Wait for the selected document to finish loading.");
      if (!profile || !policy.data)
        throw new Error("Choose your participant profile.");
      if (!accepted || !authority || !signerName.trim())
        throw new Error("Add your name and accept both attestations.");
      const payload = {
        policyVersion: policy.data.version,
        profileId: profile.id,
        source: profile.source,
        signerName: signerName.trim(),
        signerRole: role,
        authorityAccepted: authority,
        waiverAccepted: accepted,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
        ...(attachment ? { attachment } : {}),
      };
      const body = JSON.stringify(payload);
      if (retry.current?.body !== body)
        retry.current = { body, requestId: crypto.randomUUID() };
      await apiRequest(
        "POST",
        `/participation/events/${eventId}/submissions`,
        { ...payload, requestId: retry.current.requestId },
        { refreshOn401: true },
      );
      if (alive.current) {
        setAttachment(undefined);
        setFileKey((k) => k + 1);
        await cache.invalidateQueries({
          queryKey: ["participation-me", eventId, org, auth.user?.id],
        });
      }
    });
  }
  async function file(value: File | undefined) {
    const ticket = ++serial.current;
    setAttachment(undefined);
    setReading(false);
    if (!value) return;
    if (
      value.size > 1048576 ||
      !["application/pdf", "image/png", "image/jpeg"].includes(value.type)
    ) {
      setError("Choose a PDF, PNG or JPEG of at most 1 MiB.");
      return;
    }
    setReading(true);
    try {
      const bytes = new Uint8Array(await value.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      if (!alive.current || ticket !== serial.current) return;
      setAttachment({
        name:
          value.name.replace(/[^A-Za-z0-9_. -]/g, "_").slice(0, 120) ||
          "document",
        mime: value.type,
        base64: btoa(binary),
      });
      setError("");
    } catch {
      if (alive.current && ticket === serial.current)
        setError("Could not read this file.");
    } finally {
      if (alive.current && ticket === serial.current) setReading(false);
    }
  }
  const viewCopy = () =>
    void perform(async () => {
      if (!status) return;
      const value = unwrapSportData<Copy>(
        await apiRequest(
          "GET",
          `/participation/submissions/${status.id}`,
          undefined,
          { refreshOn401: true },
        ),
      );
      if (alive.current) setCopy(value);
    });
  const getDocument = () =>
    void perform(async () => {
      if (!status) return;
      const file = unwrapSportData<Attachment>(
        await apiRequest(
          "GET",
          `/participation/submissions/${status.id}/document`,
          undefined,
          { refreshOn401: true },
        ),
      );
      if (!alive.current) return;
      const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0));
      download(
        new Blob([bytes], { type: "application/octet-stream" }),
        file.name,
      );
    });
  const calendar = () =>
    void perform(async () => {
      const v = await publicSportData<{ filename: string; calendar: string }>(
        `/participation/events/${eventId}/calendar`,
      );
      if (alive.current)
        download(
          new Blob([v.calendar], { type: "text/calendar;charset=utf-8" }),
          v.filename,
        );
    });
  return (
    <section
      aria-label="Event requirements"
      className="space-y-4 rounded-3xl border border-cl-border bg-cl-surface p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">Event requirements</h2>
        <button
          className={button}
          disabled={busy}
          onClick={() => void calendar()}
        >
          Download calendar
        </button>
      </div>
      {!!error && <p role="alert">{error}</p>}
      {policy.isLoading ? (
        <p role="status">Loading requirements…</p>
      ) : policy.isError ? (
        <>
          <p role="alert">
            Requirements are temporarily unavailable. Registration may require
            clearance.
          </p>
          <button className={button} onClick={() => void policy.refetch()}>
            Retry
          </button>
        </>
      ) : !policy.data ? (
        <p className="text-cl-muted">
          No additional participation forms are currently required.
        </p>
      ) : (
        <>
          <p className="text-cl-muted">
            Complete these requirements before registering.{" "}
            {policy.data.manualReview
              ? "The organizer must review your submission."
              : ""}{" "}
            Supporting documents and guardian signatures always require review.
            Clearance does not confirm registration or payment.
          </p>
          <div
            className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-cl-border p-4"
            tabIndex={0}
            aria-label="Waiver wording"
          >
            {policy.data.waiverText}
          </div>
          {!auth.isAuthenticated ? (
            <p>
              <Link className="text-cl-accent underline" href="/auth">
                Sign in to complete requirements
              </Link>
            </p>
          ) : me.isLoading ? (
            <p role="status">Loading your participant profiles…</p>
          ) : me.isError ? (
            <>
              <p role="alert">Could not load your requirements status.</p>
              <button className={button} onClick={() => void me.refetch()}>
                Retry
              </button>
            </>
          ) : !me.data?.length ? (
            <p>
              Create or claim your participant profile for{" "}
              {sportKey.replace(/-/g, " ")} first.{" "}
              <Link
                className="text-cl-accent underline"
                href={
                  sportKey === "jet-ski"
                    ? "/create-racer-profile"
                    : `/create-racer-profile?athletes=1&sport=${encodeURIComponent(sportKey)}`
                }
              >
                Open participant profiles
              </Link>
            </p>
          ) : (
            <>
              <label className="block">
                Participant
                <select
                  className={input}
                  disabled={busy}
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                >
                  {me.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {status && (
                <div className="space-y-2 rounded-xl border border-cl-border p-4">
                  <p className="font-bold">
                    {status.current
                      ? status.status === "approved"
                        ? "Requirements cleared"
                        : status.status === "pending"
                          ? "Awaiting organizer review"
                          : "Correction required"
                      : "Requirements or participant details changed — submit again"}
                  </p>
                  {status.reviewReason && <p>{status.reviewReason}</p>}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={button}
                      disabled={busy}
                      onClick={viewCopy}
                    >
                      View submitted copy
                    </button>
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() => void me.refetch()}
                    >
                      Refresh status
                    </button>
                  </div>
                </div>
              )}
              {(!status || !status.current || status.status === "rejected") && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                >
                  {policy.data.questions.map((q) => (
                    <label key={q.id} className="block">
                      {q.label}
                      {q.required ? " *" : ""}
                      {q.kind === "text" ? (
                        <textarea
                          className={input}
                          maxLength={2000}
                          required={q.required}
                          disabled={busy}
                          value={answers[q.id] ?? ""}
                          onChange={(e) =>
                            setAnswers((a) => ({
                              ...a,
                              [q.id]: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <select
                          className={input}
                          required={q.required}
                          disabled={busy}
                          value={answers[q.id] ?? ""}
                          onChange={(e) =>
                            setAnswers((a) => ({
                              ...a,
                              [q.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Choose an answer</option>
                          {(q.kind === "choice"
                            ? q.options
                            : ["yes", "no"]
                          ).map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      )}
                    </label>
                  ))}
                  {!!policy.data.documentLabel && (
                    <label className="block">
                      {policy.data.documentLabel}
                      {policy.data.documentRequired ? " *" : ""}
                      <input
                        key={fileKey}
                        className={input}
                        disabled={busy}
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        required={policy.data.documentRequired && !attachment}
                        onChange={(e) => void file(e.target.files?.[0])}
                      />
                      <span className="text-sm text-cl-muted">
                        Private PDF, PNG or JPEG, maximum 1 MiB.{" "}
                        {attachment?.name}
                      </span>
                    </label>
                  )}
                  <label className="block">
                    Signer name
                    <input
                      className={input}
                      maxLength={120}
                      required
                      disabled={busy}
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    Signing as
                    <select
                      className={input}
                      disabled={busy}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="self">Participant</option>
                      <option value="guardian">Parent or legal guardian</option>
                    </select>
                  </label>
                  <p className="text-sm text-cl-muted">
                    A parent or legal guardian must sign when the participant is
                    under {policy.data.guardianUnderAge} on the event start date
                    {policy.data.guardianUnderAge === 0
                      ? " (age requirement disabled)"
                      : ""}
                    .
                  </p>
                  <label className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      required
                      disabled={busy}
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                    />
                    I have read and accept the published waiver wording.
                  </label>
                  <label className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      required
                      disabled={busy}
                      checked={authority}
                      onChange={(e) => setAuthority(e.target.checked)}
                    />
                    I confirm that I am the participant or their parent/legal
                    guardian and have authority to sign.
                  </label>
                  <button
                    className={button}
                    disabled={
                      busy ||
                      reading ||
                      !accepted ||
                      !authority ||
                      (policy.data.documentRequired && !attachment)
                    }
                    type="submit"
                  >
                    {busy ? "Submitting…" : "Submit requirements"}
                  </button>
                </form>
              )}
              {copy && (
                <details
                  open
                  className="space-y-3 rounded-xl border border-cl-border p-4"
                >
                  <summary className="min-h-11 cursor-pointer font-bold">
                    Submitted copy
                  </summary>
                  <p>
                    Accepted{" "}
                    {new Date(copy.evidence.acceptedAt).toLocaleString()} ·{" "}
                    {copy.evidence.submission.signerName} ·{" "}
                    {copy.evidence.submission.signerRole}
                  </p>
                  <p className="whitespace-pre-wrap">
                    {copy.evidence.policy.waiverText}
                  </p>
                  {copy.evidence.policy.questions.map((q) => (
                    <p key={q.id}>
                      {q.label}:{" "}
                      {copy.evidence.submission.answers.find(
                        (a) => a.questionId === q.id,
                      )?.value || "No answer"}
                    </p>
                  ))}
                  {copy.evidence.submission.attachment && (
                    <button
                      className={button}
                      disabled={busy}
                      onClick={getDocument}
                    >
                      Download my attachment
                    </button>
                  )}
                </details>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
