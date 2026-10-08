import AthleteAccountLinks from "@/components/sport-registration/AthleteAccountLinks";
import UserSearchPanel from "@/components/community/UserSearchPanel";
import { PublicationList } from "@/components/community/Publishing";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShieldCheck, RefreshCw, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { getCommunityProfile } from "@/lib/communityApi";
import { socialRequest } from "@/lib/socialApi";
import { PageSEO } from "@/seo/usePageSEO";
import RacerIdentityCard from "@/components/community/RacerIdentityCard";
import FollowedAthletesPanel from "@/components/community/FollowedAthletesPanel";
import {
  PeoplePanel,
  UserSocialControls,
} from "@/components/community/UserSocialControls";
import SocialPostFeed, {
  SocialFailure,
  socialBox,
  socialButton,
} from "@/components/community/SocialPosts";
import stockAvatar from "@/assets/stockprofilepicture.jpeg";
export default function UserProfilePage({ username }: { username: string }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"athletes" | "posts" | "results" | "articles">("athletes");
  const [people, setPeople] = useState<"followers" | "following" | null>(null);
  const [share, setShare] = useState("");
  const profile = useQuery({
    queryKey: ["community-profile", username],
    queryFn: () => getCommunityProfile(username),
    staleTime: 60_000,
    retry: false,
  });
  const summary = useQuery({
    queryKey: ["user-social-summary", username],
    queryFn: () =>
      socialRequest<{ followersCount: number; followingCount: number }>(
        "GET",
        `profiles/${encodeURIComponent(username)}/social`,
      ),
    enabled: !!profile.data,
    staleTime: 30_000,
    retry: false,
  });
  const teams = useQuery({
    queryKey: ["profile-teams", profile.data?.user.id],
    queryFn: () =>
      apiRequest<{ data: { teams: { id: string; name: string }[] } }>(
        "GET",
        `/users/${profile.data!.user.id}/get-favorite-teams`,
      ),
    enabled: !!profile.data,
    retry: false,
  });
  if (profile.isPending)
    return (
      <main className="p-6 text-white" role="status">
        Loading profile…
      </main>
    );
  if (profile.isError)
    return (
      <main className="mx-auto max-w-3xl p-6 text-white">
        <SocialFailure error={profile.error} />
        <button className={socialButton} onClick={() => void profile.refetch()}>
          Retry profile
        </button>
      </main>
    );
  const person = profile.data.user;
  const racer = profile.data.racerProfile;
  const isOwn = String(user?.id) === person.id;
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 py-8 text-white">
      <PageSEO title={`@${person.username} • Corner League`} />
      <header
        className={`${socialBox} relative overflow-hidden bg-gradient-to-br from-cyan-950/60 via-[#07111f] to-orange-950/30`}
      >
        <div className="flex flex-col gap-5 sm:flex-row">
          <img
            src={person.profilePicture || stockAvatar}
            alt={`${person.username} profile`}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = stockAvatar;
            }}
            className="h-28 w-28 shrink-0 rounded-full border border-cyan-300/25 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">
              Corner League community
            </p>
            <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">
              {[person.firstName, person.lastName].filter(Boolean).join(" ") ||
                person.username}
            </h1>
            <p className="mt-1 text-white/55">@{person.username}</p>
            {racer?.isVerifiedAthlete && racer.profileUrl && (
              <Link
                href={racer.profileUrl}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 text-sm text-emerald-200"
              >
                <ShieldCheck size={16} />
                Verified athlete · Racer profile
              </Link>
            )}
            <AthleteAccountLinks username={person.username} />
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/70">
              {person.bio}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {person.tags.profile.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              className={socialButton}
              onClick={() =>
                setPeople(people === "followers" ? null : "followers")
              }
            >
              {summary.data?.followersCount ?? "—"} Followers
            </button>
            <button
              className={socialButton}
              onClick={() =>
                setPeople(people === "following" ? null : "following")
              }
            >
              {summary.data?.followingCount ?? "—"} Following users
            </button>
            <button
              aria-label="Refresh profile"
              className={socialButton}
              onClick={() => {
                void profile.refetch();
                void summary.refetch();
                void teams.refetch();
              }}
            >
              <RefreshCw size={16} />
            </button>
            <button
              className={socialButton}
              onClick={async () => {
                const url = `${window.location.origin}/profile/${encodeURIComponent(person.username)}`;
                try {
                  await navigator.clipboard.writeText(url);
                  setShare("Link copied");
                } catch {
                  setShare(url);
                }
              }}
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
          <UserSocialControls targetId={person.id} />
        </div>
        {summary.isError && (
          <p role="status" className="mt-3 text-xs text-amber-200">
            Community counts are temporarily unavailable.
          </p>
        )}
        {share && (
          <p role="status" className="mt-3 break-all text-xs text-cyan-200">
            {share}
          </p>
        )}
      </header>
      {people && <PeoplePanel username={username} kind={people} />}
      {isOwn && <UserSearchPanel key={user?.id} />}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="order-2 space-y-5 lg:order-1">
          <RacerIdentityCard profile={racer} isOwn={isOwn} />
          <section className={socialBox}>
            <h2 className="mb-3 font-bold">Favorite teams</h2>
            {teams.isError ? (
              <p className="text-sm text-white/50">Teams unavailable.</p>
            ) : teams.data?.data?.teams?.length ? (
              teams.data.data.teams.map((team) => (
                <p key={team.id} className="mb-2 text-sm text-white/70">
                  {team.name}
                </p>
              ))
            ) : (
              <p className="text-sm text-white/50">No favorite teams yet.</p>
            )}
          </section>
        </aside>
        <section className="order-1 min-w-0 space-y-5 lg:order-2">
          <nav
            role="tablist"
            aria-label="Profile content"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                ["athletes", "Athletes"],
                ["posts", "Posts"],
                ["results", "Results"],
                ["articles", "Articles"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={socialButton}
              >
                {label}
              </button>
            ))}
          </nav>
          {tab === "athletes" && (
            <FollowedAthletesPanel username={username} isOwn={isOwn} />
          )}
          {tab === "posts" && (
            <SocialPostFeed username={username} compose={isOwn} />
          )}
          {tab === "articles" && (<section className="space-y-4">{isOwn && <Link className={socialButton} href="/writer">Manage your articles</Link>}<PublicationList kind="article" username={username} /></section>)}
          {tab === "results" && (
            <section className={socialBox}>
              <h2 className="font-bold">Race results & rankings</h2>
              {racer?.profileUrl ? (
                <Link
                  href={racer.profileUrl}
                  className={`${socialButton} mt-4`}
                >
                  View racer results
                </Link>
              ) : (
                <p className="mt-3 text-sm text-white/55">
                  No linked racer results yet.
                </p>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
