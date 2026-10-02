import { PageSEO } from "@/seo/usePageSEO";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Share2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { socialRequest } from "@/lib/socialApi";
import {
  loadPublication,
  loadPublications,
  loadReplies,
  publicationPath,
  publicationRoute,
  publishingSports,
  publishingCategories,
  publishingLabel,
  safePublishingUrl,
  type Publication,
  type PublicationKind,
} from "@/lib/publishingApi";
import PublicationBody from "./PublicationBody";
import {
  socialBox,
  socialInput,
  socialButton,
  SocialFailure,
  Pagination,
} from "./SocialPosts";
const queryOptions = { staleTime: 120_000, retry: false as const };
function usePublishing() {
  const cache = useQueryClient();
  return () =>
    cache.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).startsWith("publishing-"),
    });
}
function SignIn({ next }: { next: string }) {
  return (
    <section className={socialBox}>
      <p className="mb-3">
        Sign in with your Corner League account to write or participate.
      </p>
      <Link
        className={socialButton}
        href={`/auth?next=${encodeURIComponent(next)}`}
      >
        Sign in / Create account
      </Link>
    </section>
  );
}
export function PublicationList({
  kind,
  username,
  mine = false,
}: {
  kind: PublicationKind;
  username?: string;
  mine?: boolean;
}) {
  const { user, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1),
    [sport, setSport] = useState(""),
    [category, setCategory] = useState(""),
    [input, setInput] = useState(""),
    [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: [
      "publishing-list",
      user?.id || "public",
      kind,
      mine,
      username,
      page,
      sport,
      category,
      search,
    ],
    queryFn: () =>
      loadPublications(kind, isAuthenticated, {
        page,
        sport,
        category,
        search,
        username,
        mine,
      }),
    enabled: !mine || isAuthenticated,
    ...queryOptions,
  });
  if (mine && !isAuthenticated) return <SignIn next="/writer" />;
  return (
    <section className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(input.trim());
        }}
        className="flex flex-wrap gap-2"
        aria-label="Publication filters"
      >
        <input
          aria-label="Search titles"
          placeholder="Search titles"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={80}
          className={`${socialInput} flex-1 min-w-40`}
        />
        <select
          aria-label="Sport"
          value={sport}
          onChange={(e) => {
            setSport(e.target.value);
            setPage(1);
          }}
          className={`${socialInput} w-auto`}
        >
          <option value="">All sports</option>
          {publishingSports.map((s) => (
            <option key={s} value={s}>
              {publishingLabel(s)}
            </option>
          ))}
        </select>
        {kind === "forum" && (
          <select
            aria-label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className={`${socialInput} w-auto`}
          >
            <option value="">All categories</option>
            {publishingCategories.map((s) => (
              <option key={s} value={s}>
                {publishingLabel(s)}
              </option>
            ))}
          </select>
        )}
        <button className={socialButton}>Search</button>
        <button
          type="button"
          className={socialButton}
          aria-label="Refresh publications"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
        </button>
      </form>
      {query.isLoading && <p role="status">Loading…</p>}
      {query.isError && <SocialFailure error={query.error} />}
      {query.data?.items.length === 0 && (
        <section className={socialBox}>
          No {kind === "forum" ? "discussions" : "articles"} yet.
        </section>
      )}
      {query.data?.items.map((p) => (
        <article className={`${socialBox} space-y-3`} key={p.id}>
          {p.coverUrl && safePublishingUrl(p.coverUrl) && (
            <img
              src={safePublishingUrl(p.coverUrl)!}
              alt=""
              className="max-h-60 w-full rounded-2xl object-cover"
              loading="lazy"
            />
          )}
          <div className="flex flex-wrap gap-2 text-xs text-cyan-200">
            <span>{publishingLabel(p.sport)}</span>
            {kind === "forum" && <span>· {publishingLabel(p.category)}</span>}
            {!p.published && (
              <span className="text-amber-200">Draft · Only you</span>
            )}
          </div>
          <h2 className="text-xl font-bold">
            <Link href={`${publicationRoute(kind)}/${p.id}`}>{p.title}</Link>
          </h2>
          <p className="whitespace-pre-wrap break-words text-sm text-white/60">
            {p.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
            <Link href={`/profile/${encodeURIComponent(p.author.username)}`}>
              By {p.author.username}
            </Link>
            <time dateTime={p.createdAt}>
              {new Date(p.createdAt).toLocaleDateString()}
            </time>
            {kind === "forum" && (
              <span>
                {p.score} votes · {p.replyCount} replies
              </span>
            )}
            {p.canEdit && (
              <Link
                className={socialButton}
                href={`${publicationRoute(kind)}/${p.id}/edit`}
              >
                Edit
              </Link>
            )}
          </div>
        </article>
      ))}
      {query.data && (
        <Pagination
          page={page}
          hasNext={query.data.hasNextPage}
          setPage={setPage}
        />
      )}
    </section>
  );
}
export function PublishingDirectory({ kind }: { kind: PublicationKind }) {
  const { isAuthenticated } = useAuth();
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 py-8 text-white">
      <PageSEO
        title={
          kind === "forum" ? "Community discussions" : "Articles & stories"
        }
        canonicalPath={publicationRoute(kind)}
      />
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">
          Corner League community
        </p>
        <h1 className="text-3xl font-black">
          {kind === "forum" ? "Community discussions" : "Articles & stories"}
        </h1>
        <p className="text-white/60">
          {kind === "forum"
            ? "Ask questions, talk equipment, and share ideas across sports."
            : "Stories, guides, and perspectives from the people in the sport."}
        </p>
        <Link
          className={socialButton}
          href={
            kind === "forum"
              ? "/community/new"
              : isAuthenticated
                ? "/writer"
                : "/auth?next=%2Fwriter"
          }
        >
          {kind === "forum" ? "Start a discussion" : "Become a writer"}
        </Link>
      </header>
      <PublicationList key={kind} kind={kind} />
    </main>
  );
}
export function WriterPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 py-8 text-white">
      <PageSEO title="Writer studio" canonicalPath="/writer" noindex />
      <header className="space-y-3">
        <h1 className="text-3xl font-black">Your writer studio</h1>
        <p className="text-white/60">
          Draft, publish, and manage your articles. Published work also appears
          on your profile.
        </p>
        <Link className={socialButton} href="/writer/new">
          Write an article
        </Link>
        <Link className={`${socialButton} ml-2`} href="/articles">
          Browse articles
        </Link>
      </header>
      <PublicationList kind="article" mine />
    </main>
  );
}
function PublicationForm({
  kind,
  publication,
}: {
  kind: PublicationKind;
  publication?: Publication;
}) {
  const [, navigate] = useLocation(),
    invalidate = usePublishing();
  const [title, setTitle] = useState(publication?.title || ""),
    [body, setBody] = useState(publication?.body || ""),
    [sport, setSport] = useState(publication?.sport || "general"),
    [category, setCategory] = useState(publication?.category || "discussion"),
    [published, setPublished] = useState(publication?.published || false),
    [file, setFile] = useState<File | null>(null),
    [removeCover, setRemoveCover] = useState(false),
    [preview, setPreview] = useState(false),
    [fileError, setFileError] = useState("");
  const request = useRef<{ key: string; fingerprint: string }>(),
    asset = useRef<{ file: File; id: string }>();
  const save = useMutation({
    mutationFn: async () => {
      if (fileError) throw new Error(fileError);
      if (!title.trim() || !body.trim())
        throw new Error("A title and content are required.");
      let coverMediaId: string | null | undefined = removeCover
        ? null
        : undefined;
      if (file) {
        if (asset.current?.file !== file) {
          const form = new FormData();
          form.append("image", file);
          const upload = await socialRequest<{ id: string }>(
            "POST",
            "me/media",
            form,
          );
          if (typeof upload.id !== "string")
            throw new Error("Image upload failed.");
          asset.current = { file, id: upload.id };
        }
        coverMediaId = asset.current!.id;
      }
      const fields = {
        title: title.trim(),
        body: body.trim(),
        sport,
        category,
        coverMediaId,
        published: kind === "forum" || published,
      };
      if (publication)
        return socialRequest<Publication>(
          "PATCH",
          publicationPath(kind, true, `/${publication.id}`),
          { ...fields, revision: publication.revision },
        );
      const fingerprint = JSON.stringify(fields);
      if (request.current?.fingerprint !== fingerprint)
        request.current = { fingerprint, key: crypto.randomUUID() };
      return socialRequest<Publication>("POST", publicationPath(kind, true), {
        ...fields,
        clientRequestId: request.current!.key,
      });
    },
    onSuccess: async (p) => {
      await invalidate();
      navigate(`${publicationRoute(kind)}/${p.id}`);
    },
  });
  return (
    <form
      className={`${socialBox} space-y-4`}
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <label className="block">
        Title
        <input
          className={`${socialInput} mt-2`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          required
        />
      </label>
      <div className="flex flex-wrap gap-4">
        <label>
          Sport
          <select
            className={`${socialInput} mt-2`}
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            {publishingSports.map((s) => (
              <option key={s} value={s}>
                {publishingLabel(s)}
              </option>
            ))}
          </select>
        </label>
        {kind === "forum" && (
          <label>
            Category
            <select
              className={`${socialInput} mt-2`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {publishingCategories.map((s) => (
                <option key={s} value={s}>
                  {publishingLabel(s)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <label className="block">
        {kind === "forum" ? "Discussion" : "Article"}
        <textarea
          className={`${socialInput} mt-2 min-h-72`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={kind === "forum" ? 10000 : 30000}
          required
        />
      </label>
      <p className="text-xs text-white/55">
        Formatting: # heading, ## subheading, **bold**, - list item, &gt; quote,
        [label](https://example.com). Include a clear disclosure for affiliate
        links.
      </p>
      <label className="block">
        Cover image (optional)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-2 block w-full text-sm"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (
              selected &&
              (selected.size > 8 * 1024 * 1024 ||
                !["image/jpeg", "image/png", "image/webp"].includes(
                  selected.type,
                ))
            ) {
              e.target.value = "";
              setFile(null);
              setFileError("Choose a JPEG, PNG, or WebP image up to 8 MB.");
              return;
            }
            setFileError("");
            setFile(selected || null);
            setRemoveCover(false);
          }}
        />
      </label>
      <p className="text-xs text-white/50">
        JPEG, PNG, or WebP · Maximum 8 MB.
      </p>
      {publication?.coverUrl &&
        !file &&
        !removeCover &&
        safePublishingUrl(publication.coverUrl) && (
          <img
            className="max-h-48 rounded-xl"
            src={safePublishingUrl(publication.coverUrl)!}
            alt="Current cover"
          />
        )}
      {(file || publication?.coverUrl) && (
        <button
          type="button"
          className={socialButton}
          onClick={() => {
            setFile(null);
            setRemoveCover(true);
            setFileError("");
          }}
        >
          Remove cover
        </button>
      )}
      {kind === "article" && (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Publish publicly (unchecked saves a private draft)
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <button className={socialButton} disabled={save.isPending}>
          {save.isPending
            ? "Saving…"
            : kind === "forum"
              ? "Post discussion"
              : published
                ? "Save & publish"
                : "Save draft"}
        </button>
        <button
          type="button"
          className={socialButton}
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Hide preview" : "Preview"}
        </button>
        <Link
          className={socialButton}
          href={
            publication
              ? `${publicationRoute(kind)}/${publication.id}`
              : kind === "forum"
                ? "/community"
                : "/writer"
          }
        >
          Cancel
        </Link>
      </div>
      {fileError && (
        <p role="alert" className="text-rose-200">
          {fileError}
        </p>
      )}
      {save.isError && <SocialFailure error={save.error} />}{" "}
      {preview && (
        <section
          aria-label="Content preview"
          className="border-t border-white/10 pt-4"
        >
          <h2 className="mb-4 text-2xl font-bold">{title}</h2>
          <PublicationBody body={body} />
        </section>
      )}
    </form>
  );
}
export function PublicationEditor({
  kind,
  id,
}: {
  kind: PublicationKind;
  id?: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: ["publishing-detail", user?.id, kind, id],
    queryFn: () => loadPublication(kind, true, id!),
    enabled: !!id && isAuthenticated,
    ...queryOptions,
  });
  if (!isAuthenticated)
    return (
      <main className="mx-auto max-w-3xl p-4 py-8 text-white">
        <SignIn
          next={
            id
              ? `${publicationRoute(kind)}/${id}/edit`
              : kind === "forum"
                ? "/community/new"
                : "/writer/new"
          }
        />
      </main>
    );
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4 py-8 text-white">
      <PageSEO title="Publication editor" noindex />
      <h1 className="text-3xl font-black">
        {id ? "Edit" : kind === "forum" ? "Start a" : "Write an"}{" "}
        {kind === "forum" ? "discussion" : "article"}
      </h1>
      {query.isError ? (
        <SocialFailure error={query.error} />
      ) : id && !query.data ? (
        <p>Loading…</p>
      ) : query.data && !query.data.canEdit ? (
        <p>Only the author can edit this publication.</p>
      ) : (
        <PublicationForm
          key={`${user?.id}:${kind}:${id || "new"}:${query.data?.revision}`}
          kind={kind}
          publication={query.data}
        />
      )}
    </main>
  );
}
function ForumReplies({ id }: { id: string }) {
  const { user, isAuthenticated } = useAuth(),
    invalidate = usePublishing();
  const [page, setPage] = useState(1),
    [body, setBody] = useState("");
  const request = useRef<{ body: string; key: string }>();
  const query = useQuery({
    queryKey: ["publishing-replies", user?.id || "public", id, page],
    queryFn: () => loadReplies(isAuthenticated, id, page),
    ...queryOptions,
  });
  const send = useMutation({
    mutationFn: () => {
      const text = body.trim();
      if (!text) throw new Error("Write a reply.");
      if (request.current?.body !== text)
        request.current = { body: text, key: crypto.randomUUID() };
      return socialRequest("POST", `me/forums/${id}/replies`, {
        body: text,
        clientRequestId: request.current!.key,
      });
    },
    onSuccess: async () => {
      setBody("");
      request.current = undefined;
      await invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (replyId: string) =>
      socialRequest("DELETE", `me/forum-replies/${replyId}`),
    onSuccess: invalidate,
  });
  return (
    <section className={`${socialBox} space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Replies</h2>
        <button
          className={socialButton}
          aria-label="Refresh replies"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {query.isLoading && <p>Loading…</p>}
      {query.isError && <SocialFailure error={query.error} />}
      {query.data?.items.length === 0 && (
        <p className="text-white/55">Be the first to reply.</p>
      )}
      {query.data?.items.map((r) => (
        <article className="space-y-2 border-t border-white/10 pt-4" key={r.id}>
          <Link
            className="text-sm text-cyan-200"
            href={`/profile/${encodeURIComponent(r.author.username)}`}
          >
            {r.author.username}
          </Link>
          <p className="whitespace-pre-wrap break-words text-white/80">
            {r.body}
          </p>
          {r.canDelete && (
            <button
              className={socialButton}
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm("Delete this reply?")) remove.mutate(r.id);
              }}
            >
              Delete reply
            </button>
          )}
        </article>
      ))}
      {query.data && (
        <Pagination
          page={page}
          hasNext={query.data.hasNextPage}
          setPage={setPage}
        />
      )}
      {isAuthenticated ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
          className="space-y-3"
        >
          <textarea
            aria-label="Your reply"
            placeholder="Join the discussion"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={3000}
            className={socialInput}
            required
          />
          <button className={socialButton} disabled={send.isPending}>
            Post reply
          </button>
        </form>
      ) : (
        <SignIn next={`/community/${id}`} />
      )}
      {send.isError && <SocialFailure error={send.error} />}{" "}
      {remove.isError && <SocialFailure error={remove.error} />}
    </section>
  );
}
export function PublicationPage({
  kind,
  id,
}: {
  kind: PublicationKind;
  id: string;
}) {
  const { user, isAuthenticated } = useAuth(),
    invalidate = usePublishing(),
    [, navigate] = useLocation();
  const [notice, setNotice] = useState("");
  const query = useQuery({
    queryKey: ["publishing-detail", user?.id || "public", kind, id],
    queryFn: () => loadPublication(kind, isAuthenticated, id),
    ...queryOptions,
  });
  const vote = useMutation({
    mutationFn: (value: number) =>
      socialRequest("PUT", `me/forums/${id}/vote`, { value }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () =>
      socialRequest("DELETE", publicationPath(kind, true, `/${id}`)),
    onSuccess: async () => {
      await invalidate();
      navigate(publicationRoute(kind));
    },
  });
  const p = query.data;
  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 py-8 text-white">
      <PageSEO
        title={p?.title || "Community publication"}
        canonicalPath={`${publicationRoute(kind)}/${id}`}
        description={p?.excerpt}
        image={
          p?.coverUrl ? safePublishingUrl(p.coverUrl) || undefined : undefined
        }
        noindex={!p?.published}
        type={kind === "article" ? "article" : "website"}
      />
      <div className="flex gap-2">
        <Link className={socialButton} href={publicationRoute(kind)}>
          Back to {kind === "forum" ? "community" : "articles"}
        </Link>
        <button
          className={socialButton}
          disabled={query.isFetching}
          aria-label="Refresh publication"
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {query.isLoading && <p>Loading…</p>}
      {query.isError && <SocialFailure error={query.error} />}
      {p && (
        <article className={`${socialBox} space-y-5`}>
          {!p.published && (
            <p className="text-amber-200">
              Private draft · Only you can see this article.
            </p>
          )}
          <div className="text-sm text-cyan-200">
            {publishingLabel(p.sport)}
            {kind === "forum" ? ` · ${publishingLabel(p.category)}` : ""}
          </div>
          <h1 className="break-words text-3xl font-black">{p.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/55">
            <Link href={`/profile/${encodeURIComponent(p.author.username)}`}>
              By {p.author.username}
            </Link>
            <time dateTime={p.createdAt}>
              {new Date(p.createdAt).toLocaleDateString()}
            </time>
          </div>
          {p.coverUrl && safePublishingUrl(p.coverUrl) && (
            <img
              alt="Article cover"
              src={safePublishingUrl(p.coverUrl)!}
              className="max-h-96 w-full rounded-2xl object-cover"
            />
          )}
          <PublicationBody body={p.body || ""} />
          <div className="flex flex-wrap items-center gap-2">
            {kind === "forum" && (
              <>
                <button
                  aria-label="Upvote discussion"
                  aria-pressed={p.vote === 1}
                  className={socialButton}
                  disabled={!isAuthenticated || vote.isPending}
                  onClick={() => vote.mutate(p.vote === 1 ? 0 : 1)}
                >
                  <ArrowUp size={16} />
                </button>
                <span>{p.score}</span>
                <button
                  aria-label="Downvote discussion"
                  aria-pressed={p.vote === -1}
                  className={socialButton}
                  disabled={!isAuthenticated || vote.isPending}
                  onClick={() => vote.mutate(p.vote === -1 ? 0 : -1)}
                >
                  <ArrowDown size={16} />
                </button>
              </>
            )}
            {p.published && (
              <button
                className={socialButton}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}${publicationRoute(kind)}/${id}`,
                    );
                    setNotice("Link copied.");
                  } catch {
                    setNotice("Copy the link from your address bar.");
                  }
                }}
              >
                <Share2 size={16} />
                Share
              </button>
            )}
            {p.canEdit && (
              <>
                <Link
                  className={socialButton}
                  href={`${publicationRoute(kind)}/${id}/edit`}
                >
                  <Pencil size={16} />
                  Edit{kind === "article" ? " / Publish" : ""}
                </Link>
                <button
                  className={socialButton}
                  disabled={remove.isPending}
                  onClick={() => {
                    if (
                      window.confirm("Delete this publication and its replies?")
                    )
                      remove.mutate();
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
          {notice && <p role="status">{notice}</p>}
          {vote.isError && <SocialFailure error={vote.error} />}{" "}
          {remove.isError && <SocialFailure error={remove.error} />}
        </article>
      )}
      {p && kind === "forum" && (
        <ForumReplies key={`${user?.id || "public"}:${id}`} id={id} />
      )}
    </main>
  );
}
