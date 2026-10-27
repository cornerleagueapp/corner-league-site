import ProfileHonors from "@/components/team-sports/ProfileHonors";
import PeopleDialog from "@/components/community/PeopleDialog";
import FollowedResults from "@/components/community/FollowedResults";
import { FollowedOrganizations } from "@/components/community/OrganizationFollowing";
import AthleteAccountLinks from "@/components/sport-registration/AthleteAccountLinks";
import ProfilePhotoViewer from "@/components/community/ProfilePhotoViewer";
import ProfileHeader from "@/components/community/ProfileHeader";
import { useSportSelection } from "@/hooks/useSportSelection";
import { PublicationList } from "@/components/community/Publishing";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { RefreshCw, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getCommunityProfile } from "@/lib/communityApi";
import { socialRequest } from "@/lib/socialApi";
import { PageSEO } from "@/seo/usePageSEO";
import RacerIdentityCard from "@/components/community/RacerIdentityCard";
import FollowedAthletesPanel from "@/components/community/FollowedAthletesPanel";
import { UserSocialControls } from "@/components/community/UserSocialControls";
import SocialPostFeed, {
  SocialFailure,
  socialBox,
  socialButton,
} from "@/components/community/SocialPosts";
export default function UserProfilePage({ username }: { username: string }) {
  const { user } = useAuth();
  const { sportKey } = useSportSelection();
  const [tab, setTab] = useState<"athletes" | "posts" | "results" | "articles">(
    "posts",
  );
  const [people, setPeople] = useState<"followers" | "following" | null>(null);
  const peopleTrigger = useRef<HTMLElement | null>(null);
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
  if (profile.isPending)
    return (
      <main className="p-6 text-cl-ink" role="status">
        Loading profile…
      </main>
    );
  if (profile.isError)
    return (
      <main className="mx-auto max-w-3xl p-6 text-cl-ink">
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
    <main className="consumer-social-profile mx-auto max-w-6xl space-y-6 text-cl-ink">
      <PageSEO title={`@${person.username} • Corner League`} />
      <header className="profile-social-header">
        <ProfileHeader
          key={person.id}
          userId={person.id}
          username={person.username}
          sport={racer?.sportKey || sportKey}
          isOwn={isOwn}
        />
        <div className="profile-identity-body">
          <div className="profile-identity-row">
            <ProfilePhotoViewer
              key={person.id}
              picture={person.profilePicture}
              username={person.username}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-cl-accent">
                Corner League community
              </p>
              <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">
                {[person.firstName, person.lastName]
                  .filter(Boolean)
                  .join(" ") || person.username}
              </h1>
              <p className="mt-1 text-cl-muted">@{person.username}</p>
              <AthleteAccountLinks key={person.id} username={person.username} racer={racer} />
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-cl-muted">
                {person.bio}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {person.tags.profile.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-cl-border px-3 py-1 text-xs text-cl-muted"
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
                onClick={(event) => {
                  peopleTrigger.current = event.currentTarget;
                  setPeople("followers");
                }}
              >
                {summary.data?.followersCount ?? "—"} Followers
              </button>
              <button
                className={socialButton}
                onClick={(event) => {
                  peopleTrigger.current = event.currentTarget;
                  setPeople("following");
                }}
              >
                {summary.data?.followingCount ?? "—"} Following users
              </button>
              <button
                aria-label="Refresh profile"
                className={socialButton}
                onClick={() => {
                  void profile.refetch();
                  void summary.refetch();
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
            <p role="status" className="mt-3 text-xs text-amber-900">
              Community counts are temporarily unavailable.
            </p>
          )}
          {share && (
            <p role="status" className="mt-3 break-all text-xs text-cl-accent">
              {share}
            </p>
          )}
        </div>
      </header>
      <ProfileHonors id={person.id} kind="users" />
      {people && (
        <PeopleDialog
          username={username}
          kind={people}
          onClose={() => setPeople(null)}
          returnFocus={peopleTrigger.current}
        />
      )}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="profile-about space-y-5">
          <RacerIdentityCard profile={racer} isOwn={isOwn} />
          <section className={socialBox}>
            <h2 className="font-bold">About</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-cl-muted">
              {person.bio || "No bio added yet."}
            </p>
          </section>
        </aside>
        <section className="min-w-0 space-y-5">
          <nav aria-label="Profile content" className="profile-content-nav">
            {(
              [
                ["posts", "Posts"],
                ["athletes", "Athletes"],
                ["results", "Results"],
                ["articles", "Articles"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
                className="profile-content-button"
              >
                {label}
              </button>
            ))}
          </nav>
          {tab === "athletes" && (
            <>
              <FollowedAthletesPanel username={username} isOwn={isOwn} />
              <FollowedOrganizations key={username} username={username} />
            </>
          )}
          {tab === "posts" && (
            <SocialPostFeed username={username} compose={isOwn} />
          )}
          {tab === "articles" && (
            <section className="profile-articles space-y-4">
              {isOwn && (
                <Link className={socialButton} href="/writer">
                  Manage your articles
                </Link>
              )}
              <PublicationList kind="article" username={username} />
            </section>
          )}
          {tab === "results" && (
            <FollowedResults key={username} username={username} isOwn={isOwn} />
          )}
        </section>
      </div>
    </main>
  );
}
