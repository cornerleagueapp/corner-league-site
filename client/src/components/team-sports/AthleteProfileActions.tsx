import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/apiClient";
import {
  publicSportData,
  unwrapSportData,
  type SportAthlete,
} from "@/lib/sportRegistration";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export default function AthleteProfileActions({
  athlete: p,
}: {
  athlete: SportAthlete;
}) {
  const { user, isAuthenticated } = useAuth(),
    [, navigate] = useLocation(),
    cache = useQueryClient();
  const [edit, setEdit] = useState(false),
    [notice, setNotice] = useState("");
  const own = String(user?.id) === p.ownerId;
  const state = useQuery({
    queryKey: ["sport-athlete-follow", p.id, user?.id, isAuthenticated],
    queryFn: () =>
      isAuthenticated
        ? apiRequest("GET", `/sport-athlete-social/${p.id}/state`).then(
            unwrapSportData<{ isFollowing: boolean; followerCount: number }>,
          )
        : publicSportData<{ isFollowing?: boolean; followerCount: number }>(
            `/sport-athlete-social/${p.id}/summary`,
          ),
    staleTime: 30000,
    retry: false,
  });
  const follow = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/sport-athlete-social/${p.id}/follow`, {
        following: !state.data?.isFollowing,
      }),
    onSuccess: async () => {
      await cache.invalidateQueries({
        queryKey: ["sport-athlete-follow", p.id],
      });
      await cache.invalidateQueries({ queryKey: ["followed-sport-athletes"] });
    },
  });
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: p.name, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setNotice("Profile link copied.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setNotice(
          "Could not share. Copy the profile address from your browser.",
        );
    }
  }
  return (
    <>
      <div className="cl-profile-actions">
        {!own && (
          <button
            aria-pressed={!!state.data?.isFollowing}
            disabled={
              follow.isPending ||
              (isAuthenticated && (state.isPending || state.isError))
            }
            onClick={() => {
              if (!isAuthenticated) {
                navigate(
                  `/auth?next=${encodeURIComponent(location.pathname + location.search)}`,
                );
                return;
              }
              follow.mutate();
            }}
          >
            {state.data?.isFollowing ? "Following athlete" : "Follow athlete"}
            {state.data && ` · ${state.data.followerCount}`}
          </button>
        )}
        <button onClick={share}>Share profile</button>
        {own && (
          <>
            <button onClick={() => setEdit(true)}>Edit profile & photos</button>
            <Link
              className="self-center underline"
              href={`/create-racer-profile?athletes=1&sport=${encodeURIComponent(p.sportKey)}`}
            >
              Manage athlete details
            </Link>
          </>
        )}
        <span className="self-center text-sm text-cl-muted">
          {p.isDemo
            ? "Demo profile · not claimable"
            : p.ownershipVerified
              ? "Account ownership verified"
              : "Managed athlete profile"}
        </span>
      </div>
      {notice && <p role="status">{notice}</p>}
      {state.isError && (
        <button onClick={() => state.refetch()}>
          Following unavailable. Retry
        </button>
      )}
      {follow.isError && (
        <p role="alert">Could not update follow. Please try again.</p>
      )}
      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-cl-surface text-cl-ink">
          <DialogHeader>
            <DialogTitle>Edit athlete profile</DialogTitle>
            <DialogDescription>
              Update your bio, links and public photos.
            </DialogDescription>
          </DialogHeader>
          <Editor key={p.presentation?.revision || 0} p={p} />
        </DialogContent>
      </Dialog>
    </>
  );
}
function Editor({ p }: { p: SportAthlete }) {
  const cache = useQueryClient();
  const [bio, setBio] = useState(p.bio),
    [nickname, setNickname] = useState(p.nickname),
    [location, setLocation] = useState(p.location),
    [website, setWebsite] = useState(p.presentation?.website || "");
  const revision = p.presentation?.revision || 0;
  const change = useMutation({
    mutationFn: ({
      method,
      path,
      body,
    }: {
      method: string;
      path: string;
      body: unknown;
    }) => apiRequest(method, path, body),
    onSuccess: () =>
      cache.invalidateQueries({
        queryKey: ["sport-athlete-public", p.sportKey, p.id],
      }),
  });
  function upload(file: File | undefined, slot: string) {
    if (!file) return;
    const body = new FormData();
    body.append("media", file);
    body.append("revision", String(revision));
    change.mutate({
      method: "POST",
      path: `/sport-athlete-social/${p.id}/media/${slot}`,
      body,
    });
  }
  return (
    <div className="cl-profile-editor">
      <label>
        Nickname
        <input
          maxLength={100}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </label>
      <label>
        Location
        <input
          maxLength={120}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>
      <label>
        Bio
        <textarea
          maxLength={5000}
          rows={5}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </label>
      <label>
        Website or social link (HTTPS)
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>
      <button
        disabled={
          change.isPending || (!!website && !/^https:\/\/\S+$/.test(website))
        }
        onClick={() =>
          change.mutate({
            method: "PATCH",
            path: `/sport-athlete-social/${p.id}/presentation`,
            body: { revision, bio, nickname, location, website },
          })
        }
      >
        Save profile
      </button>
      {["portrait", "header", "gallery"].map((slot) => (
        <label key={slot}>
          Upload {slot} photo (JPEG, PNG or WebP, up to 8 MB)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={change.isPending}
            onChange={(e) => upload(e.target.files?.[0], slot)}
          />
        </label>
      ))}
      {p.presentation?.gallery?.map((photo) => (
        <div key={photo.id}>
          <img
            className="h-20 w-20 object-cover"
            src={photo.url}
            alt={photo.title}
          />
          <button
            disabled={change.isPending}
            onClick={() =>
              change.mutate({
                method: "DELETE",
                path: `/sport-athlete-social/${p.id}/media/${photo.id}`,
                body: { revision },
              })
            }
          >
            Remove photo
          </button>
        </div>
      ))}
      {change.isPending && <p role="status">Saving…</p>}
      {change.isError && (
        <p role="alert">
          {change.error instanceof Error
            ? change.error.message
            : "Could not save. Try again."}
        </p>
      )}
    </div>
  );
}
