import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import SportArtwork from "@/components/sport-hub/SportArtwork";
import { apiFetch } from "@/lib/apiClient";
import { racerResponseData } from "@/lib/selfRacerLookup";
import { safeProfileImage } from "@/lib/profileDirectory";
import { useAuth } from "@/hooks/useAuth";
type Presentation = {
  userId: string;
  headerUrl: string | null;
  revision: number;
};
export default function ProfileHeader({
  userId,
  username,
  sport,
  isOwn,
}: {
  userId: string;
  username: string;
  sport: string;
  isOwn: boolean;
}) {
  const auth = useAuth();
  const cache = useQueryClient();
  const picker = useRef<HTMLInputElement>(null);
  const writing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState<string | null>(null);
  const key = ["profile-presentation", userId, username];
  const query = useQuery<Presentation>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const response = await apiFetch(
        `/community/profiles/${encodeURIComponent(username)}/presentation`,
        { signal, skipAuth: true, noRefresh: true, cache: "no-store" },
      );
      if (!response.ok) throw new Error("Header unavailable.");
      const data = racerResponseData(await response.json());
      if (
        data.userId !== userId ||
        !Number.isInteger(data.revision) ||
        data.revision < 0 ||
        (data.headerUrl !== null && !safeProfileImage(data.headerUrl))
      )
        throw new Error("Invalid profile header.");
      return data;
    },
    staleTime: 60_000,
    retry: false,
  });
  const source = safeProfileImage(query.data?.headerUrl);
  async function save(file?: File) {
    if (
      writing.current ||
      !query.data ||
      !isOwn ||
      String(auth.user?.id) !== userId
    )
      return;
    if (
      file &&
      (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 8 * 1024 * 1024 ||
        !file.size)
    ) {
      setError("Choose a JPEG, PNG, or WebP image up to 8 MB.");
      return;
    }
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("revision", String(query.data.revision));
      if (file) body.append("image", file);
      const response = await apiFetch("/community/me/presentation/header", {
        method: file ? "POST" : "DELETE",
        body: file ? body : { revision: query.data.revision },
      });
      if (!response.ok) {
        if (response.status === 409) await query.refetch();
        throw new Error(
          response.status === 409
            ? "Header changed in another session. Please try again."
            : "Unable to save header. Please try again.",
        );
      }
      // Read the authoritative public state instead of trusting an upload URL.
      await cache.invalidateQueries({ queryKey: key });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      writing.current = false;
      setBusy(false);
      if (picker.current) picker.current.value = "";
    }
  }
  return (
    <>
      <div className="profile-cover">
        {source && failed !== source ? (
          <img src={source} alt="" onError={() => setFailed(source)} />
        ) : (
          <SportArtwork sport={sport} />
        )}
      </div>
      {isOwn && (
        <div className="profile-header-editor">
          <input
            ref={picker}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-label="Upload profile header"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy || !query.data}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void save(file);
            }}
          />
          <button
            type="button"
            disabled={busy || !query.data}
            onClick={() => picker.current?.click()}
          >
            <Camera size={16} aria-hidden="true" />
            {busy ? "Saving…" : source ? "Replace cover" : "Upload cover"}
          </button>
          {source && (
            <button type="button" disabled={busy} onClick={() => void save()}>
              Remove cover
            </button>
          )}
          {query.isError && (
            <button type="button" onClick={() => void query.refetch()}>
              Retry cover settings
            </button>
          )}
          {busy && <span role="status">Saving profile cover…</span>}
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </>
  );
}
