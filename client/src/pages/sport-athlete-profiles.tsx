import TeamRosterInvites from "@/components/team-sports/TeamRosterInvites";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearch, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSportSelection } from "@/hooks/useSportSelection";
import {
  AthleteInput,
  isAthleteSport,
  mySportAthletes,
  RacingRegistration,
  saveSportAthlete,
  sportEquipmentLabels,
  sportLabels,
  SportAthlete,
  unwrapSportData,
  registrationReturnPath,
} from "@/lib/sportRegistration";
import { apiRequest } from "@/lib/apiClient";
const inputClass =
  "mt-2 w-full rounded-xl border border-white/20 bg-[#07111f] p-3 text-white";
const initial = (sportKey: string): AthleteInput => ({
  sportKey,
  name: "",
  nickname: "",
  dateOfBirth: "",
  skillLevel: "amateur",
  bio: "",
  location: "",
  competitorNumber: "",
  equipmentDescription: "",
});
export default function SportAthleteProfiles() {
  const auth = useAuth(),
    cache = useQueryClient(),
    availability = useSportSelection();
  const params = new URLSearchParams(useSearch());
  const [, navigate] = useLocation();
  const returnTo = registrationReturnPath(params.get("next"));
  const [selected, setSelected] = useState(params.get("sport") ?? "");
  const profiles = useQuery({
    queryKey: ["sport-athletes", auth.user?.id],
    queryFn: mySportAthletes,
    enabled: auth.isAuthenticated,
    staleTime: 60_000,
  });
  const [page, setPage] = useState(1);
  const registrations = useQuery({
    queryKey: ["sport-my-registrations", auth.user?.id, page],
    queryFn: async () =>
      unwrapSportData<{ items: RacingRegistration[]; total: number }>(
        await apiRequest(
          "GET",
          `/sport-registration/me/registrations?page=${page}&limit=20`,
        ),
      ),
    enabled: auth.isAuthenticated,
    staleTime: 30_000,
  });
  const visible = [
    ...new Set([
      ...availability.sports
        .filter((s) => isAthleteSport(s.key))
        .map((s) => s.key),
      ...(profiles.data ?? []).map((p) => p.sportKey),
    ]),
  ];
  useEffect(() => {
    if (!selected && visible.length) setSelected(visible[0]);
  }, [visible.join("|"), selected]);
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 py-10 text-white">
      <h1 className="text-3xl font-black">Your athlete profiles</h1>
      {returnTo && (
        <Link href={returnTo} className="inline-block text-cyan-200 underline">
          Return to event registration
        </Link>
      )}
      <p className="text-slate-300">
        Keep one account-owned athlete profile for each sport. Existing Jet Ski
        racer profiles stay linked to your account. Ownership verification
        confirms the account link; it is not a competition license or skill
        certification.
      </p>
      <Link
        href="/create-racer-profile"
        className="inline-block text-cyan-200 underline"
      >
        Manage your Jet Ski racer profile
      </Link>
      {!auth.isAuthenticated ? (
        <Link href="/auth" className="block text-cyan-200 underline">
          Sign in to manage athlete profiles
        </Link>
      ) : profiles.isPending ? (
        <p role="status">Loading your profiles…</p>
      ) : profiles.isError ? (
        <p role="alert">
          Unable to load profiles.{" "}
          <button className="underline" onClick={() => void profiles.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {visible.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                aria-pressed={selected === key}
                className={`min-h-11 rounded-full border px-5 ${selected === key ? "border-cyan-300 text-cyan-200" : "border-white/20"}`}
              >
                {sportLabels[key]}
              </button>
            ))}
          </div>
          {!visible.length ? (
            <p className="text-slate-400">
              More sport profiles become available when an organization for that
              sport is published.
            </p>
          ) : (
            visible.includes(selected) && (
              <ProfileForm
                key={`${auth.user?.id}:${selected}:${profiles.data?.find((p) => p.sportKey === selected)?.id ?? "new"}`}
                sportKey={selected}
                profile={profiles.data?.find((p) => p.sportKey === selected)}
                onSave={async () => {
                  await Promise.all([
                    cache.invalidateQueries({
                      queryKey: ["sport-athletes", auth.user?.id],
                    }),
                    cache.invalidateQueries({
                      queryKey: ["sport-account-athletes", auth.user?.username],
                    }),
                    cache.invalidateQueries({
                      queryKey: ["sport-athlete-public"],
                    }),
                  ]);
                  if (returnTo) navigate(returnTo);
                }}
              />
            )
          )}
          <TeamRosterInvites />
          <section className="rounded-2xl border border-white/15 bg-[#07111f] p-5">
            <h2 className="text-xl font-bold">Your sport registrations</h2>
            {registrations.isPending ? (
              <p role="status">Loading registrations…</p>
            ) : registrations.isError ? (
              <p role="alert">
                Unable to load registrations.{" "}
                <button
                  className="underline"
                  onClick={() => void registrations.refetch()}
                >
                  Try again
                </button>
              </p>
            ) : (
              <>
                {!registrations.data?.items.length && (
                  <p className="mt-3 text-slate-400">
                    No registrations yet for these sports.
                  </p>
                )}
                {registrations.data?.items.map((r) => (
                  <article
                    key={r.id}
                    className="mt-5 border-t border-white/10 pt-4"
                  >
                    <h3 className="font-bold">
                      {r.event?.name ?? "Event"} · {r.status.replace(/_/g, " ")}
                    </h3>
                    <p className="mt-2 text-slate-300">
                      {r.entries
                        .map((e) => `${e.name}: ${e.dates.join(", ")}`)
                        .join(" · ")}
                    </p>
                    <p>
                      {(r.totalCents / 100).toFixed(2)} {r.currency} · Reference{" "}
                      {r.id}
                    </p>
                    {r.event && (
                      <Link
                        className="mt-2 inline-block text-cyan-200 underline"
                        href={`/sports/${r.event.sportKey}/organizations/${r.event.organizationId}?event=${r.event.id}`}
                      >
                        Open event
                      </Link>
                    )}
                  </article>
                ))}
                <div className="mt-5 flex items-center gap-4">
                  <button
                    disabled={page === 1}
                    className="min-h-11 disabled:opacity-40"
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    disabled={page * 20 >= (registrations.data?.total ?? 0)}
                    className="min-h-11 disabled:opacity-40"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
function ProfileForm({
  sportKey,
  profile,
  onSave,
}: {
  sportKey: string;
  profile?: SportAthlete;
  onSave: () => Promise<void>;
}) {
  const [form, setForm] = useState<AthleteInput>(
    profile
      ? {
          ...initial(sportKey),
          ...profile,
          dateOfBirth: profile.dateOfBirth ?? "",
          equipmentDescription: profile.equipmentDescription ?? "",
        }
      : initial(sportKey),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveSportAthlete({
        sportKey: form.sportKey,
        name: form.name,
        nickname: form.nickname,
        dateOfBirth: form.dateOfBirth,
        skillLevel: form.skillLevel,
        bio: form.bio,
        location: form.location,
        competitorNumber: form.competitorNumber,
        equipmentDescription: form.equipmentDescription,
      });
      if (!alive.current) return;
      await onSave();
      if (alive.current) setSaved(true);
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-cyan-200/20 bg-[#07111f] p-5"
    >
      <h2 className="text-2xl font-bold">
        {profile ? "Edit" : "Create"} your {sportLabels[sportKey]} profile
      </h2>
      {profile && (
        <Link
          href={`/racer/${profile.id}?sport=${sportKey}`}
          className="inline-block text-cyan-200 underline"
        >
          View public athlete profile
        </Link>
      )}
      {(
        [
          ["name", "Athlete name", 100],
          ["nickname", "Nickname", 100],
          ["dateOfBirth", "Date of birth (private; used for eligibility)", 10],
          ["location", "Location (public)", 120],
          ["competitorNumber", "Competitor number (public)", 40],
          ["equipmentDescription", sportEquipmentLabels[sportKey], 300],
          ["bio", "Bio (public)", 5000],
        ] as const
      ).map(([key, label, maxLength]) => (
        <label key={key} className="block">
          {label}
          <input
            type={key === "dateOfBirth" ? "date" : "text"}
            required={key === "name" || key === "dateOfBirth"}
            maxLength={maxLength}
            disabled={busy}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className={inputClass}
          />
        </label>
      ))}
      <label className="block">
        Skill level
        <select
          value={form.skillLevel}
          disabled={busy}
          onChange={(e) =>
            setForm((f) => ({ ...f, skillLevel: e.target.value }))
          }
          className={inputClass}
        >
          <option value="junior">Junior</option>
          <option value="amateur">Amateur</option>
          <option value="pro">Pro</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="text-orange-300">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-cyan-200">
          Profile saved.
        </p>
      )}
      <button
        disabled={busy}
        className="min-h-12 rounded-full bg-cyan-300 px-6 font-bold text-slate-950 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save athlete profile"}
      </button>
    </form>
  );
}
