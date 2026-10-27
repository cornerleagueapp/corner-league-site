import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ShieldCheck, Trophy, X, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ProfileListAvatar from "@/components/community/ProfileListAvatar";
import {
  publicSportData,
  SportAthlete,
  sportLabels,
} from "@/lib/sportRegistration";
export default function AthleteAccountLinks({
  username,
  racer,
  variant = "badge",
  isOwn = false,
}: {
  username: string;
  variant?: "badge" | "identity";
  isOwn?: boolean;
  racer?: {
    profileUrl: string | null;
    isVerifiedAthlete: boolean;
    name?: string;
  } | null;
}) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["sport-account-athletes", username],
    queryFn: async () => {
      const rows = await publicSportData<SportAthlete[]>(
        `/sport-registration/accounts/${encodeURIComponent(username)}/profiles`,
      );
      if (!Array.isArray(rows)) throw Error("Athlete profiles could not load.");
      return rows;
    },
    staleTime: 60000,
    retry: false,
  });
  const profiles = (query.data || []).map((p) => ({
    id: p.id,
    name: p.name,
    sport: sportLabels[p.sportKey] || p.sportKey,
    href: `/athlete/${encodeURIComponent(p.id)}?sport=${encodeURIComponent(p.sportKey)}`,
    image: p.imageUrl,
  }));
  if (racer?.profileUrl && (racer.isVerifiedAthlete || variant === "identity"))
    profiles.unshift({
      id: "jet-ski",
      name: racer.name || username,
      sport: "Jet Ski",
      href: racer.profileUrl,
      image: null,
    });
  const identity = variant === "identity";
  if (
    !profiles.length &&
    !query.isError &&
    (!identity || (!isOwn && !query.isPending))
  )
    return null;
  const content = identity ? (
    <section className="min-w-0 rounded-3xl border border-cl-accent/20 bg-cl-accent/[0.06] p-5">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cl-accent">
        <Trophy className="h-4 w-4" /> Athlete identity
      </h2>
      {query.isPending && !profiles.length ? (
        <p role="status" className="text-sm text-cl-muted">
          Loading athlete profiles…
        </p>
      ) : profiles.length || query.isError ? (
        <>
          <p className="text-sm leading-relaxed text-cl-muted">
            Choose a sport to view an athlete profile.
          </p>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-cl-border px-3 py-2 text-left text-sm font-bold text-cl-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-cl-accent"
            >
              View athlete profiles
              <ChevronRight size={18} className="shrink-0" />
            </button>
          </Dialog.Trigger>
        </>
      ) : (
        <p className="text-sm text-cl-muted">
          Create or claim an athlete profile to connect your sports identity.
        </p>
      )}
      {isOwn && !query.isPending && !query.isError && !profiles.length && (
        <div className="mt-3 grid gap-3 text-sm font-semibold text-cl-accent">
          <Link
            href="/create-racer-profile?athletes=1"
            className="min-h-11 py-2"
          >
            Create an athlete profile
          </Link>
          <Link href="/create-racer-profile" className="min-h-11 py-2">
            Create or claim a Jet Ski profile
          </Link>
        </div>
      )}
    </section>
  ) : (
    <Dialog.Trigger asChild>
      <button type="button" className="profile-verified-badge">
        <ShieldCheck size={16} />{" "}
        {profiles.length ? "Verified athlete" : "Athlete profiles"}
      </button>
    </Dialog.Trigger>
  );
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {content}
      <Dialog.Portal>
        <Dialog.Overlay className="community-dialog-overlay" />
        <Dialog.Content className="community-people-dialog athlete-profile-picker">
          <Dialog.Title className="pr-12 text-xl font-bold">
            Athlete profiles
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-cl-muted">
            Choose a sport profile for @{username}.
          </Dialog.Description>
          <Dialog.Close
            className="community-dialog-close"
            aria-label="Close athlete profiles"
          >
            <X size={22} />
          </Dialog.Close>
          {query.isError && (
            <div role="alert" className="mt-4 text-sm">
              Additional profiles could not load.{" "}
              <button
                className="underline"
                onClick={() => void query.refetch()}
              >
                Try again
              </button>
            </div>
          )}
          <div className="mt-5 grid gap-3">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                onClick={() => setOpen(false)}
                className="profile-picker-row"
              >
                <ProfileListAvatar key={p.image} src={p.image} name={p.name} />
                <span className="min-w-0 flex-1">
                  <strong className="block break-words">{p.name}</strong>
                  <span className="text-sm text-cl-muted">{p.sport}</span>
                </span>
                <ChevronRight size={18} />
              </Link>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
