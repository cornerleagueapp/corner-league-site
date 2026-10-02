import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Heart,
  MessageCircle,
  RefreshCw,
  Share2,
  ImagePlus,
  Send,
  Trash2,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyRacerProfile } from "@/hooks/useMyRacerProfile";
import {
  loadPost,
  loadPosts,
  parsePage,
  postPath,
  socialError,
  socialRequest,
  type SocialComment,
  type SocialPost,
} from "@/lib/socialApi";
export const socialBox =
  "rounded-3xl border border-white/10 bg-[#07111f] p-4 sm:p-6";
export const socialInput =
  "w-full rounded-xl border border-white/15 bg-black/20 p-3 text-white outline-none focus:border-cyan-300";
export const socialButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-white/10 disabled:opacity-40";
export function SocialFailure({ error }: { error: unknown }) {
  return (
    <p role="alert" className="mt-3 text-sm text-rose-200">
      {socialError(error)}
    </p>
  );
}
export function PostComposer({ athleteId }: { athleteId?: string }) {
  const { user, isAuthenticated } = useAuth();
  const identity = useMyRacerProfile();
  const cache = useQueryClient();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [asAthlete, setAsAthlete] = useState(!!athleteId);
  const [error, setError] = useState("");
  const requestId = useRef<string>();
  const uploaded = useRef(new Map<File, string>());
  const fingerprint = useRef("");
  const ownAthlete = identity.data?.profile?.athleteId;
  const canCompose =
    isAuthenticated && (!athleteId || ownAthlete === athleteId);
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  const publish = useMutation({
    mutationFn: async () => {
      if (!content.trim() && !files.length)
        throw new Error("Add text or an image.");
      const mediaIds: string[] = [];
      for (const file of files) {
        let id = uploaded.current.get(file);
        if (!id) {
          const form = new FormData();
          form.append("image", file);
          const asset = await socialRequest<{ id: string }>(
            "POST",
            "me/media",
            form,
          );
          if (typeof asset.id !== "string")
            throw new Error("Image upload failed.");
          id = asset.id;
          uploaded.current.set(file, id);
        }
        mediaIds.push(id);
      }
      const nextFingerprint = JSON.stringify({
        content,
        mediaIds,
        athleteId: asAthlete ? ownAthlete : undefined,
      });
      if (fingerprint.current !== nextFingerprint) {
        requestId.current = crypto.randomUUID();
        fingerprint.current = nextFingerprint;
      }
      requestId.current ??= crypto.randomUUID();
      return socialRequest<{ id: string }>("POST", "me/posts", {
        content,
        mediaIds,
        clientRequestId: requestId.current,
        ...(asAthlete && ownAthlete ? { athleteId: ownAthlete } : {}),
      });
    },
    onSuccess: () => {
      setContent("");
      setFiles([]);
      uploaded.current.clear();
      requestId.current = undefined;
      void cache.invalidateQueries({ queryKey: ["social-posts"] });
    },
  });
  if (!canCompose) return null;
  return (
    <form
      className={socialBox}
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        publish.mutate();
      }}
    >
      <h2 className="mb-3 text-lg font-bold">Share an update</h2>
      <textarea
        aria-label="Post content"
        maxLength={5000}
        rows={3}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={publish.isPending}
        placeholder="News from your day, your training, or your next event…"
        className={socialInput}
      />
      {previews.length > 0 && (
        <div className="my-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {previews.map((url, index) => (
            <div key={url}>
              <img
                src={url}
                alt={`Selected image ${index + 1}`}
                className="h-24 w-full rounded-xl object-cover"
              />
              <button
                type="button"
                disabled={publish.isPending}
                onClick={() =>
                  setFiles((value) => value.filter((_, i) => i !== index))
                }
                className="min-h-11 text-xs text-rose-200"
              >
                Remove image {index + 1}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className={`${socialButton} cursor-pointer`}>
          <ImagePlus size={16} />
          Images
          <input
            aria-label="Add images"
            type="file"
            className="sr-only"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={publish.isPending}
            onChange={(event) => {
              const next = [...files, ...Array.from(event.target.files ?? [])];
              if (
                next.length > 4 ||
                next.some((file) => file.size > 8 * 1024 * 1024)
              )
                setError("Choose up to four images, each up to 8 MB.");
              else {
                setFiles(next);
                setError("");
              }
              event.target.value = "";
            }}
          />
        </label>
        {!athleteId && ownAthlete && (
          <label className="flex min-h-11 items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={asAthlete}
              disabled={publish.isPending}
              onChange={(event) => setAsAthlete(event.target.checked)}
            />
            Publish as my athlete
          </label>
        )}
        <button
          type="submit"
          disabled={publish.isPending}
          className={`${socialButton} bg-cyan-300/15`}
        >
          <Send size={16} />
          {publish.isPending ? "Publishing…" : "Publish"}
        </button>
      </div>
      <p className="mt-3 text-xs text-white/45">
        Posts are public. JPEG, PNG, and WebP · up to 4 images · 8 MB each.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {publish.isError && <SocialFailure error={publish.error} />}
    </form>
  );
}
function CommentsPanel({ postId }: { postId: string }) {
  const { user, isAuthenticated } = useAuth();
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [text, setText] = useState("");
  const request = useRef<string>();
  useEffect(() => {
    request.current = undefined;
  }, [text]);
  const query = useQuery({
    queryKey: ["social-comments", user?.id, postId, page],
    queryFn: async () =>
      parsePage<SocialComment>(
        await socialRequest(
          "GET",
          postPath(
            isAuthenticated,
            `/${postId}/comments?page=${page}&limit=20`,
          ),
        ),
        (c) =>
          !!c &&
          typeof c.content === "string" &&
          typeof c.author?.username === "string",
      ),
    staleTime: 30_000,
    retry: false,
  });
  const write = useMutation({
    mutationFn: () => {
      request.current ??= crypto.randomUUID();
      return socialRequest("POST", `me/posts/${postId}/comments`, {
        content: text,
        clientRequestId: request.current,
      });
    },
    onSuccess: () => {
      setText("");
      request.current = undefined;
      void cache.invalidateQueries({ queryKey: ["social-comments"] });
      void cache.invalidateQueries({ queryKey: ["social-posts"] });
      void cache.invalidateQueries({ queryKey: ["social-post"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => socialRequest("DELETE", `me/comments/${id}`),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["social-comments"] });
      void cache.invalidateQueries({ queryKey: ["social-posts"] });
      void cache.invalidateQueries({ queryKey: ["social-post"] });
    },
  });
  return (
    <section
      className="mt-4 border-t border-white/10 pt-4"
      aria-label="Comments"
    >
      {query.isPending ? (
        <p role="status">Loading comments…</p>
      ) : query.isError ? (
        <>
          <SocialFailure error={query.error} />
          <button onClick={() => void query.refetch()} className={socialButton}>
            Retry
          </button>
        </>
      ) : (
        <>
          {query.data.items.map((comment) => (
            <article
              key={comment.id}
              className="mb-3 rounded-xl bg-white/5 p-3"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/profile/${encodeURIComponent(comment.author.username)}`}
                  className="text-sm font-bold text-cyan-100"
                >
                  @{comment.author.username}
                </Link>
                {comment.canDelete && (
                  <button
                    type="button"
                    disabled={remove.isPending}
                    aria-label="Delete comment"
                    onClick={() => {
                      if (window.confirm("Delete your comment?"))
                        remove.mutate(comment.id);
                    }}
                    className="min-h-11 px-3 text-rose-200"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-white/80">
                {comment.content}
              </p>
            </article>
          ))}
          {!query.data.items.length && (
            <p className="text-sm text-white/50">No comments yet.</p>
          )}
          <Pagination
            page={page}
            hasNext={query.data.hasNextPage}
            setPage={setPage}
          />
        </>
      )}
      {isAuthenticated ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            write.mutate();
          }}
          className="mt-3 flex flex-wrap gap-2"
        >
          <input
            aria-label="Write a comment"
            maxLength={2000}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className={`${socialInput} min-w-0 flex-1`}
          />
          <button
            className={socialButton}
            disabled={write.isPending || !text.trim()}
          >
            Comment
          </button>
        </form>
      ) : (
        <Link
          href={`/auth?next=${encodeURIComponent(`/posts/${postId}`)}`}
          className="inline-flex min-h-11 items-center text-sm text-cyan-200"
        >
          Sign in to comment
        </Link>
      )}
      {write.isError && <SocialFailure error={write.error} />}
      {remove.isError && <SocialFailure error={remove.error} />}
    </section>
  );
}
export function Pagination({
  page,
  hasNext,
  setPage,
}: {
  page: number;
  hasNext: boolean;
  setPage: (page: number) => void;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        className={socialButton}
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </button>
      <span className="text-sm text-white/50">Page {page}</span>
      <button
        className={socialButton}
        disabled={!hasNext}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
export function PostCard({ post }: { post: SocialPost }) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const cache = useQueryClient();
  const [comments, setComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [shareText, setShareText] = useState("");
  const change = useMutation({
    mutationFn: ({
      method,
      path,
      body,
    }: {
      method: string;
      path: string;
      body?: unknown;
    }) => socialRequest(method, path, body),
    onSuccess: () => {
      setEditing(false);
      void cache.invalidateQueries({ queryKey: ["social-posts"] });
      void cache.invalidateQueries({ queryKey: ["social-post"] });
    },
  });
  const signIn = () =>
    navigate(`/auth?next=${encodeURIComponent(`/posts/${post.id}`)}`);
  return (
    <article className={socialBox}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={`/profile/${encodeURIComponent(post.author.username)}`}
            className="text-sm font-bold text-cyan-100"
          >
            @{post.author.username}
          </Link>
          <p className="mt-1 text-xs text-white/45">
            {post.athlete ? `Athlete update · ${post.athlete.name} · ` : ""}
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
        {post.canEdit && (
          <div className="flex gap-2">
            <button
              aria-label="Edit post"
              className={socialButton}
              onClick={() => {
                setContent(post.content);
                setEditing(true);
              }}
            >
              <Pencil size={15} />
            </button>
            <button
              aria-label="Delete post"
              className={socialButton}
              disabled={change.isPending}
              onClick={() => {
                if (window.confirm("Delete this post?"))
                  change.mutate({
                    method: "DELETE",
                    path: `me/posts/${post.id}`,
                  });
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            change.mutate({
              method: "PATCH",
              path: `me/posts/${post.id}`,
              body: { content },
            });
          }}
        >
          <textarea
            aria-label="Edit post content"
            maxLength={5000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            className={socialInput}
          />
          <div className="mt-2 flex gap-2">
            <button className={socialButton} disabled={change.isPending}>
              Save
            </button>
            <button
              type="button"
              className={socialButton}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="whitespace-pre-wrap break-words leading-relaxed text-white/85">
          {post.content}
        </p>
      )}
      {post.mediaUrls.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {post.mediaUrls.map((url, index) => (
            <a
              key={`${url}-${index}`}
              href={/^https?:\/\//i.test(url) ? url : undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={/^https?:\/\//i.test(url) ? url : undefined}
                alt={`Post image ${index + 1}`}
                loading="lazy"
                className="max-h-96 w-full rounded-2xl object-contain"
                onError={(event) => {
                  event.currentTarget.alt = "Image unavailable";
                }}
              />
            </a>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={post.liked}
          className={socialButton}
          disabled={change.isPending}
          onClick={() => {
            if (!isAuthenticated) return signIn();
            change.mutate({
              method: post.liked ? "DELETE" : "PUT",
              path: `me/posts/${post.id}/like`,
            });
          }}
        >
          <Heart size={16} fill={post.liked ? "currentColor" : "none"} />
          {post.likeCount}
        </button>
        <button
          className={socialButton}
          aria-expanded={comments}
          onClick={() => setComments((value) => !value)}
        >
          <MessageCircle size={16} />
          {post.commentCount}
        </button>
        <button
          className={socialButton}
          onClick={async () => {
            const url = `${window.location.origin}/posts/${post.id}`;
            try {
              await navigator.clipboard.writeText(url);
              setShareText("Link copied");
            } catch {
              setShareText(url);
            }
          }}
        >
          <Share2 size={16} />
          Share
        </button>
        <Link href={`/posts/${post.id}`} className={socialButton}>
          Open post
        </Link>
      </div>
      {shareText && (
        <p role="status" className="mt-2 break-all text-xs text-cyan-200">
          {shareText}
        </p>
      )}
      {change.isError && <SocialFailure error={change.error} />}
      {comments && <CommentsPanel postId={post.id} />}
    </article>
  );
}
function Feed({
  username,
  athleteId,
  feed = "all",
  compose = false,
}: {
  username?: string;
  athleteId?: string;
  feed?: "all" | "following";
  compose?: boolean;
}) {
  const { user, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["social-posts", user?.id, username, athleteId, feed, page],
    queryFn: () =>
      loadPosts(
        isAuthenticated,
        {
          ...(username ? { username } : {}),
          ...(athleteId ? { athleteId } : {}),
          feed,
        },
        page,
      ),
    staleTime: 30_000,
    retry: false,
    enabled: feed !== "following" || isAuthenticated,
  });
  return (
    <div className="space-y-4">
      {compose && <PostComposer key={String(user?.id)} athleteId={athleteId} />}
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{athleteId ? "Athlete updates" : "Posts"}</h2>
        <button
          aria-label="Refresh posts"
          className={socialButton}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw
            size={16}
            className={query.isFetching ? "animate-spin" : ""}
          />
        </button>
      </div>
      {feed === "following" && !isAuthenticated ? (
        <Link href="/auth?next=%2Ffeed" className={socialButton}>
          Sign in for your feed
        </Link>
      ) : query.isPending ? (
        <p role="status">Loading posts…</p>
      ) : query.isError ? (
        <SocialFailure error={query.error} />
      ) : (
        <>
          {!query.data.items.length && (
            <div className={socialBox}>
              <p className="text-white/60">
                {feed === "following"
                  ? "Follow people or athletes to see their updates here."
                  : "No posts yet."}
              </p>
            </div>
          )}
          {query.data.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <Pagination
            page={page}
            hasNext={query.data.hasNextPage}
            setPage={setPage}
          />
        </>
      )}
    </div>
  );
}
export default function SocialPostFeed(props: {
  username?: string;
  athleteId?: string;
  feed?: "all" | "following";
  compose?: boolean;
}) {
  return (
    <Feed
      key={`${props.username}:${props.athleteId}:${props.feed}`}
      {...props}
    />
  );
}
export function SocialPostPage({ id }: { id: string }) {
  const { user, isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: ["social-post", user?.id, id],
    queryFn: () => loadPost(isAuthenticated, id),
    retry: false,
  });
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4 py-8 text-white">
      <Link href="/feed" className={socialButton}>
        Back to feed
      </Link>
      {query.isPending ? (
        <p role="status">Loading post…</p>
      ) : query.isError ? (
        <div className={socialBox}>
          <SocialFailure error={query.error} />
          <button className={socialButton} onClick={() => void query.refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <PostCard post={query.data} />
      )}
    </main>
  );
}
