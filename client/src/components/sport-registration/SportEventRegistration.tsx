import { useSandbox } from "@/pages/organizations/SandboxContext";
import {
  sandboxSportData,
  sportEquipmentLabels,
  registrationReturnPath,
} from "@/lib/sportRegistration";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  estimateSportTotal,
  getSportConfig,
  mySportAthletes,
  publicSportData,
  RacingRegistration,
  SportEntry,
  submitSportRegistration,
  sportLabels,
} from "@/lib/sportRegistration";
const inputClass =
  "mt-2 w-full rounded-xl border border-white/20 bg-[#07111f] p-3 text-white";
export default function SportEventRegistration({
  eventId,
  sportKey,
  organizationId,
}: {
  eventId: string;
  sportKey: string;
  organizationId?: string;
}) {
  return (
    <RegistrationContent
      key={`${sportKey}:${eventId}`}
      eventId={eventId}
      sportKey={sportKey}
      organizationId={organizationId}
    />
  );
}
function RegistrationContent({
  eventId,
  sportKey,
  organizationId,
}: {
  eventId: string;
  sportKey: string;
  organizationId?: string;
}) {
  const sandbox = useSandbox();
  const returnTo = organizationId
    ? registrationReturnPath(
        `/sports/${sportKey}/organizations/${organizationId}?event=${eventId}`,
      )
    : undefined;
  const profileEditor = `/create-racer-profile?athletes=1&sport=${sportKey}${returnTo ? `&next=${encodeURIComponent(returnTo)}` : ""}`;
  const auth = useAuth(),
    cache = useQueryClient();
  const config = useQuery({
    queryKey: [
      "sport-registration",
      eventId,
      sportKey,
      sandbox?.id,
      sandbox?.account,
    ],
    queryFn: () =>
      sandbox
        ? sandboxSportData<Awaited<ReturnType<typeof getSportConfig>>>(
            sandbox.id,
            `/sport-registration/events/${eventId}`,
          )
        : getSportConfig(eventId, sportKey),
    staleTime: 30_000,
    retry: false,
  });
  const profiles = useQuery({
    queryKey: ["sport-athletes", auth.user?.id, sandbox?.id],
    queryFn: () =>
      sandbox
        ? sandboxSportData<Awaited<ReturnType<typeof mySportAthletes>>>(
            sandbox.id,
            "/sport-registration/profiles/me",
          )
        : mySportAthletes(),
    enabled: auth.isAuthenticated,
    staleTime: 60_000,
  });
  const [entries, setEntries] = useState<SportEntry[]>([]),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState(""),
    [accepted, setAccepted] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<RacingRegistration>();
  const [testName, setTestName] = useState("Test athlete"),
    [testBirth, setTestBirth] = useState("2000-01-01"),
    [testSkill, setTestSkill] = useState("amateur"),
    [testEquipment, setTestEquipment] = useState("");
  const request = useRef<{ body: string; id: string }>();
  const accountRef = useRef(auth.user?.id);
  accountRef.current = auth.user?.id;
  const profile = profiles.data?.find((p) => p.sportKey === sportKey);
  const data = config.data;
  useEffect(() => {
    setAccepted(false);
  }, [data?.settings?.version]);
  useEffect(() => {
    setResult(undefined);
    setBusy(false);
    setAccepted(false);
    setEmail("");
    setPhone("");
    request.current = undefined;
  }, [auth.user?.id]);
  const [rosterPage, setRosterPage] = useState(1);
  const roster = useQuery({
    queryKey: [
      "sport-roster",
      eventId,
      sandbox?.id,
      sandbox?.account,
      rosterPage,
    ],
    queryFn: () => {
      type Roster = {
        items: {
          id: string;
          name: string;
          competitorNumber: string;
          classes: { name: string; dates: string[] }[];
        }[];
        total: number;
      };
      const path = `/sport-registration/events/${eventId}/roster?page=${rosterPage}&limit=20`;
      return sandbox
        ? sandboxSportData<Roster>(sandbox.id, path)
        : publicSportData<Roster>(path);
    },
    enabled: !!data?.settings?.publicRoster,
    staleTime: 30_000,
  });
  async function saveTestAthlete() {
    setBusy(true);
    setError("");
    try {
      await sandboxSportData(
        sandbox!.id,
        "/sport-registration/profiles/me",
        "POST",
        {
          sportKey,
          name: testName,
          nickname: "",
          dateOfBirth: testBirth,
          skillLevel: testSkill,
          bio: "Private test athlete",
          location: "",
          competitorNumber: "",
          equipmentDescription: testEquipment,
        },
      );
      await profiles.refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function toggleClass(id: string) {
    setAccepted(false);
    setEntries((rows) =>
      rows.some((e) => e.classId === id)
        ? rows.filter((e) => e.classId !== id)
        : [
            ...rows,
            {
              classId: id,
              dates:
                data?.classes.find((c) => c.id === id)?.dates.slice(0, 1) ?? [],
            },
          ],
    );
  }
  function toggleDate(id: string, date: string) {
    setEntries((rows) =>
      rows.map((e) =>
        e.classId !== id
          ? e
          : {
              ...e,
              dates: e.dates.includes(date)
                ? e.dates.filter((d) => d !== date)
                : [...e.dates, date],
            },
      ),
    );
  }
  let total = 0;
  try {
    total = estimateSportTotal(data?.classes ?? [], entries);
  } catch {
    /* Submit validation reports incomplete choices. */
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !data?.settings || !entries.length) return;
    const account = auth.user?.id;
    setBusy(true);
    setError("");
    try {
      estimateSportTotal(data.classes, entries);
      const body = {
        quotedTotalCents: estimateSportTotal(data.classes, entries),
        profileId: profile.id,
        contactEmail: email,
        contactPhone: phone,
        termsAccepted: accepted,
        termsVersion: data.settings.version,
        entries,
      };
      const signature = JSON.stringify(body);
      if (request.current?.body !== signature)
        request.current = { body: signature, id: crypto.randomUUID() };
      const submission = { ...body, clientRequestId: request.current.id };
      const saved = sandbox
        ? await sandboxSportData<RacingRegistration>(
            sandbox.id,
            `/sport-registration/events/${eventId}/registrations`,
            "POST",
            submission,
          )
        : await submitSportRegistration(eventId, submission);
      if (accountRef.current !== account) return;
      setResult(saved);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["sport-registration", eventId] }),
        cache.invalidateQueries({ queryKey: ["sport-roster", eventId] }),
        cache.invalidateQueries({
          queryKey: ["sport-my-registrations", account],
        }),
      ]);
    } catch (e) {
      if (accountRef.current === account) {
        setError((e as Error).message);
        await config.refetch();
      }
    } finally {
      if (accountRef.current === account) setBusy(false);
    }
  }
  return (
    <section
      aria-label="Event registration"
      className="rounded-2xl border border-cyan-300/20 bg-[#07111f] p-6 text-white"
    >
      <h2 className="text-2xl font-black">Event registration</h2>
      {sandbox && (
        <fieldset className="mt-5 space-y-3 rounded-xl border border-amber-300/20 p-4">
          <legend>Private test athlete</legend>
          <label className="block">
            Name
            <input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            Date of birth
            <input
              type="date"
              value={testBirth}
              onChange={(e) => setTestBirth(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            Skill
            <select
              value={testSkill}
              onChange={(e) => setTestSkill(e.target.value)}
              className={inputClass}
            >
              <option value="junior">Junior</option>
              <option value="amateur">Amateur</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          <label className="block">
            {sportEquipmentLabels[sportKey]}
            <input
              value={testEquipment}
              onChange={(e) => setTestEquipment(e.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveTestAthlete()}
            className="min-h-11 text-cyan-200 underline"
          >
            Save test athlete
          </button>
          <p className="text-sm text-amber-200">
            Simulated identity and entries stay inside this private sandbox.
          </p>
          {error && <p role="alert">{error}</p>}
        </fieldset>
      )}
      {config.isPending ? (
        <p role="status" className="mt-3">
          Loading registration…
        </p>
      ) : config.isError ? (
        <div role="alert" className="mt-3">
          <p>Registration information is unavailable.</p>
          <button
            onClick={() => void config.refetch()}
            className="mt-3 underline"
          >
            Try again
          </button>
        </div>
      ) : !data?.settings ? (
        <p className="mt-3 text-slate-300">
          Registration has not been published yet.
        </p>
      ) : (
        <>
          <p className="mt-3 text-slate-300">
            {data.open
              ? "Registration is open."
              : "Registration is currently closed."}{" "}
            Paid entries await payment collected by the organizer. No online
            charge is made here.
          </p>
          {result ? (
            <div
              role="status"
              className="mt-5 rounded-xl border border-cyan-200/30 p-4"
            >
              <h3 className="font-bold">
                {result.status === "confirmed"
                  ? "Registration confirmed"
                  : "Entry reserved · payment awaiting collection"}
              </h3>
              <p className="mt-2">Reference: {result.id}</p>
              <p>
                Total: {(result.totalCents / 100).toFixed(2)} {result.currency}
              </p>
              <p className="mt-2">
                {result.status === "awaiting_payment"
                  ? "Contact the organizer to arrange payment. The organizer confirms your entry after collecting it."
                  : "Your entry is confirmed."}
              </p>
              {!sandbox && (
                <Link
                  href="/create-racer-profile?athletes=1"
                  className="mt-4 inline-block text-cyan-200 underline"
                >
                  View your sport profiles and registrations
                </Link>
              )}
            </div>
          ) : (
            data.open && (
              <>
                {!auth.isAuthenticated ? (
                  <Link
                    href={
                      returnTo
                        ? `/auth?next=${encodeURIComponent(returnTo)}`
                        : "/auth"
                    }
                    className="mt-5 inline-flex rounded-full bg-cyan-300 px-5 py-3 font-bold text-slate-950"
                  >
                    Sign in to register
                  </Link>
                ) : profiles.isPending ? (
                  <p role="status">Loading your sport profile…</p>
                ) : profiles.isError ? (
                  <p role="alert">
                    Unable to load your athlete profiles.{" "}
                    <button
                      onClick={() => void profiles.refetch()}
                      className="underline"
                    >
                      Try again
                    </button>
                  </p>
                ) : !profile ? (
                  sandbox ? (
                    <p className="mt-4">
                      Save a private test athlete above to try registration.
                    </p>
                  ) : (
                    <Link
                      href={profileEditor}
                      className="mt-5 inline-flex rounded-full bg-cyan-300 px-5 py-3 font-bold text-slate-950"
                    >
                      Create your {sportLabels[sportKey]} athlete profile
                    </Link>
                  )
                ) : (
                  <form onSubmit={submit} className="mt-5 space-y-5">
                    <p>
                      Registering <strong>{profile.name}</strong> ·{" "}
                      {profile.skillLevel}.{" "}
                      {!sandbox && (
                        <Link
                          href={profileEditor}
                          className="text-cyan-200 underline"
                        >
                          Edit profile
                        </Link>
                      )}
                    </p>
                    {data.classes.map((c) => {
                      const selected = entries.find((e) => e.classId === c.id);
                      const full =
                        c.capacity !== null && c.reservedCount >= c.capacity;
                      return (
                        <fieldset
                          key={c.id}
                          className="rounded-xl border border-white/15 p-4"
                        >
                          <legend className="font-bold">{c.name}</legend>
                          <label className="flex min-h-11 items-center gap-3">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              disabled={full || busy}
                              onChange={() => toggleClass(c.id)}
                            />
                            <span>
                              {(c.priceCents / 100).toFixed(2)}{" "}
                              {data.settings?.currency}{" "}
                              {c.pricePerDay ? "per day" : "per class"}
                              {full ? " · Full" : ""}
                            </span>
                          </label>
                          <p className="text-sm text-slate-300">
                            {c.description}
                          </p>
                          <p className="mt-2 text-sm text-slate-400">
                            Skills: {c.skillLevels.join(", ")} · Age{" "}
                            {c.minimumAge ?? "any"}–{c.maximumAge ?? "any"}
                            {c.capacity !== null
                              ? ` · ${Math.max(0, c.capacity - c.reservedCount)} places remain`
                              : ""}
                          </p>
                          {selected && (
                            <div className="mt-3 flex flex-wrap gap-4">
                              {c.dates.map((d) => (
                                <label
                                  key={d}
                                  className="flex min-h-11 items-center gap-2"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected.dates.includes(d)}
                                    disabled={busy}
                                    onChange={() => toggleDate(c.id, d)}
                                  />
                                  {d}
                                </label>
                              ))}
                            </div>
                          )}
                        </fieldset>
                      );
                    })}
                    {!data.classes.length && <p>No classes are open yet.</p>}
                    <label className="block">
                      Contact email
                      <input
                        required
                        type="email"
                        maxLength={150}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      Contact phone
                      <input
                        required
                        type="tel"
                        maxLength={40}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <p className="font-bold">
                      Estimated total: {(total / 100).toFixed(2)}{" "}
                      {data.settings.currency}
                    </p>
                    <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/15 p-4 text-sm text-slate-300">
                      {data.settings.termsText}
                    </div>
                    <label className="flex min-h-11 items-center gap-3">
                      <input
                        required
                        type="checkbox"
                        checked={accepted}
                        disabled={busy}
                        onChange={(e) => setAccepted(e.target.checked)}
                      />
                      I accept these registration terms.
                    </label>
                    {!!error && (
                      <p role="alert" className="text-orange-300">
                        {error}
                      </p>
                    )}
                    <button
                      disabled={
                        busy ||
                        !accepted ||
                        !entries.length ||
                        (total > 0 && !data.settings.allowCash)
                      }
                      className="min-h-12 rounded-full bg-cyan-300 px-6 font-black text-slate-950 disabled:opacity-50"
                    >
                      {busy
                        ? "Submitting…"
                        : total > 0
                          ? "Reserve entry · pay organizer"
                          : "Confirm free entry"}
                    </button>
                  </form>
                )}
              </>
            )
          )}
        </>
      )}
      {data?.settings?.publicRoster && (
        <div className="mt-8 border-t border-white/10 pt-5">
          <h3 className="font-bold">
            Confirmed athletes · {roster.data?.total ?? "…"}
          </h3>
          {roster.isError ? (
            <p role="alert">Roster unavailable.</p>
          ) : (
            roster.data?.items.map((r) => (
              <p key={r.id} className="mt-3">
                {r.name} {r.competitorNumber ? `#${r.competitorNumber}` : ""} ·{" "}
                {r.classes.map((c) => c.name).join(", ")}
              </p>
            ))
          )}
          {(roster.data?.total ?? 0) > 20 && (
            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                disabled={rosterPage === 1}
                onClick={() => setRosterPage((p) => p - 1)}
                className="min-h-11 disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {rosterPage}</span>
              <button
                type="button"
                disabled={rosterPage * 20 >= (roster.data?.total ?? 0)}
                onClick={() => setRosterPage((p) => p + 1)}
                className="min-h-11 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
