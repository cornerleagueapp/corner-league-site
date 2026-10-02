import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyRacerProfile,
} from "@/hooks/useMyRacerProfile";
import { createMyRacerIdentity, searchSelfRacers, type RacerMatch } from "@/lib/selfRacerLookup";
import { Button } from "@/components/ui/button";

export default function CreateRacerProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const identity = useMyRacerProfile();
  const cache = useQueryClient();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [origin, setOrigin] = useState("");
  const [bio, setBio] = useState("");
  const [skillLevel, setSkillLevel] = useState("amateur");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RacerMatch[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input =
    "w-full rounded-xl border border-white/15 bg-[#07111f] px-4 py-3 text-white focus:border-cyan-300";
  const find = async () => {
    setBusy(true);
    setError("");
    setSearched(false);
    try {
      setResults(await searchSelfRacers(search.trim()));
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to search racers.");
    } finally {
      setBusy(false);
    }
  };
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await createMyRacerIdentity({
        name: name.trim(), nickname, origin, bio, skillLevel,
      });
      cache.setQueryData(["/athletes/me/racer-profile", user?.id], result);
      await cache.invalidateQueries({ queryKey: ["/auth/me"] });
      if (result.profile?.profileUrl) navigate(result.profile.profileUrl);
      else await identity.refetch();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to create racer profile.",
      );
      await identity.refetch();
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-white">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
          Jet Ski • Athlete identity
        </p>
        <h1 className="mt-2 text-3xl font-black">Your racer profile</h1>
        <p className="mt-3 text-slate-400">
          One racer profile follows your account across Corner League and helps
          you register for events faster.
        </p>
      </div>
      {isLoading || (isAuthenticated && identity.isPending) ? (
        <p role="status">Loading your racer profile…</p>
      ) : !isAuthenticated ? (
        <Button onClick={() => navigate("/login?next=%2Fcreate-racer-profile")}>
          Sign in to continue
        </Button>
      ) : identity.isError ? (
        <div role="alert">
          <p>
            We couldn’t check your racer profile. Try again before creating one.
          </p>
          <Button onClick={() => identity.refetch()}>Try again</Button>
        </div>
      ) : identity.data?.profile ? (
        <section className="space-y-4 rounded-2xl border border-cyan-300/20 bg-white/5 p-6">
          <h2 className="text-xl font-bold">{identity.data.profile.name}</h2>
          <p>
            {identity.data.profile.isVerifiedAthlete
              ? "Your verified athlete identity is linked to this account."
              : "Your profile is linked. Submit an identity claim from your racer page to request the verified athlete badge."}
          </p>
          {identity.data.profile.profileUrl ? (
            <Button
              onClick={() => navigate(identity.data!.profile!.profileUrl!)}
            >
              My Racer Profile
            </Button>
          ) : (
            <p>
              Your racer link needs support. Contact Corner League before
              creating another profile.
            </p>
          )}
        </section>
      ) : identity.data?.pendingClaim ? (
        <section className="space-y-3 rounded-2xl border border-white/15 p-6">
          <h2 className="text-xl font-bold">
            Claim pending: {identity.data.pendingClaim.name}
          </h2>
          <p>
            Your existing racer claim is under review. You can’t create a second
            profile while it is pending.
          </p>
        </section>
      ) : (
        <>
          <section className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-6">
            <h2 className="text-xl font-bold">
              Already raced with Corner League?
            </h2>
            <p className="text-sm text-slate-400">
              Find your existing profile first to keep your results history.
              Open it and use the claim button if it belongs to you.
            </p>
            <label className="block">
              Find an existing racer
              <input
                className={input}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearched(false);
                }}
              />
            </label>
            <Button disabled={busy || search.trim().length < 2} onClick={find}>
              Search racers
            </Button>
            {searched && results.length === 0 && (
              <p>No matching racers found.</p>
            )}
            {searched &&
              results.map((racer) => (
                <a
                  key={racer.id}
                  className="block rounded-xl border border-white/10 p-3 text-cyan-200"
                  href={racer.profileUrl}
                >
                  {racer.name} —{" "}
                  {racer.formattedLocation || "View racer profile"}
                </a>
              ))}
          </section>
          <form
            onSubmit={create}
            className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-6"
          >
            <h2 className="text-xl font-bold">Create your racer profile</h2>
            <p className="text-sm text-slate-400">
              This creates a public Jet Ski racer profile linked to your current
              account. Identity verification is reviewed separately. Additional
              sports will be available later.
            </p>
            <label className="block">
              Full name
              <input
                required
                maxLength={100}
                className={input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              Nickname (optional)
              <input
                maxLength={100}
                className={input}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
            <label className="block">
              Hometown (optional)
              <input
                maxLength={100}
                className={input}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </label>
            <label className="block">
              Skill level
              <select
                className={input}
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
              >
                <option value="junior">Junior</option>
                <option value="amateur">Amateur</option>
                <option value="pro">Pro</option>
              </select>
            </label>
            <label className="block">
              Bio (optional)
              <textarea
                maxLength={255}
                className={input}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>
            <Button disabled={busy || !name.trim()} type="submit">
              {busy ? "Please wait…" : "Create racer profile"}
            </Button>
          </form>
        </>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-red-200"
        >
          {error}
        </p>
      )}
    </main>
  );
}
