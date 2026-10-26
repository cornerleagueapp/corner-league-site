import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
type Contact = {
  version: number;
  sharedWithTeams: boolean;
  kind: "athlete" | "guardian";
  name: string;
  email: string;
  phone: string;
  note: string;
};
export default function PrivateTeamContact({
  profileId,
  sport,
}: {
  profileId: string;
  sport: string;
}) {
  const auth = useAuth();
  return auth.isAuthenticated ? (
    <ContactForm
      key={`${auth.user?.id}:${profileId}`}
      profileId={profileId}
      sport={sport}
    />
  ) : null;
}
function ContactForm({
  profileId,
  sport,
}: {
  profileId: string;
  sport: string;
}) {
  const [data, setData] = useState<Contact>(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const alive = useRef(true),
    writing = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setData(undefined);
    setError("");
    void apiRequest(
      "GET",
      `/team-management/profiles/${profileId}/team-contact`,
    )
      .then((json) => {
        if (active) setData(unwrapSportData<Contact>(json));
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [profileId, retry]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!data || writing.current) return;
    writing.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = unwrapSportData<Contact>(
        await apiRequest(
          "POST",
          `/team-management/profiles/${profileId}/team-contact`,
          {
            version: data.version,
            sharedWithTeams: data.sharedWithTeams,
            kind: data.kind,
            name: data.name,
            email: data.email,
            phone: data.phone,
            note: data.note,
          },
        ),
      );
      if (alive.current) {
        setData(result);
        setNotice("Contact preferences saved.");
      }
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      writing.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const input =
    "mt-1 w-full rounded-lg border border-cl-border bg-cl-canvas px-3 py-2 text-cl-ink";
  return (
    <section className="space-y-4 rounded-2xl border border-cl-border bg-cl-surface p-5 text-cl-ink">
      <h2 className="text-xl font-bold">Private team contact</h2>
      <p className="text-sm text-cl-muted">
        You control these details. When sharing is on, active coaches and
        administrators of your assigned teams can view them for current seasons.
        They are never included on your public profile or roster-sheet exports.
        Turning sharing off removes future access; it cannot erase details
        someone already saved.
      </p>
      <a
        className="inline-block font-semibold underline"
        href={`/athlete/${encodeURIComponent(profileId)}?sport=${encodeURIComponent(sport)}`}
      >
        View your athlete profile / edit headshot
      </a>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            disabled={busy}
            className="underline"
            onClick={() => setRetry((x) => x + 1)}
          >
            Reload saved details
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!data && !error && <p role="status">Loading contact preferences…</p>}
      {data && (
        <form onSubmit={save} className="space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={data.sharedWithTeams}
              onChange={(e) =>
                setData({ ...data, sharedWithTeams: e.target.checked })
              }
            />
            <span>Share with active team staff</span>
          </label>
          <label className="block">
            Contact type
            <select
              className={input}
              value={data.kind}
              onChange={(e) =>
                setData({ ...data, kind: e.target.value as Contact["kind"] })
              }
            >
              <option value="athlete">Athlete</option>
              <option value="guardian">Parent / guardian</option>
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["name", "email", "phone"] as const).map((key) => (
              <label className="block" key={key}>
                {key === "name"
                  ? "Contact name"
                  : key === "email"
                    ? "Contact email"
                    : "Contact phone"}
                <input
                  className={input}
                  type={
                    key === "email" ? "email" : key === "phone" ? "tel" : "text"
                  }
                  maxLength={key === "name" ? 100 : key === "email" ? 254 : 40}
                  value={data[key]}
                  onChange={(e) => setData({ ...data, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label className="block">
            Contact instructions (optional)
            <input
              className={input}
              maxLength={200}
              value={data.note}
              onChange={(e) => setData({ ...data, note: e.target.value })}
            />
            <span className="text-sm text-cl-muted">
              For example, preferred contact hours. Do not include medical
              information.
            </span>
          </label>
          <button
            disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save contact preferences"}
          </button>
        </form>
      )}
    </section>
  );
}
