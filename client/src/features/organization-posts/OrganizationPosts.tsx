import { useOrganizationPageApi } from "@/pages/organizations/SandboxContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";
import {
  postAccent,
  postInline,
  postLines,
  safePostImage,
  type OrgPost,
} from "./postPresentation";

type Feed = {
  articles: OrgPost[];
  meta: { itemCount: number; hasNextPage: boolean };
};
export async function fetchPublicPost<T>(path: string): Promise<T> {
  const response = await apiFetch(path, {
    skipAuth: true,
    noRefresh: true,
    cache: "no-store",
  });
  const json = await response.json();
  if (!response.ok)
    throw new Error(
      json?.message || "This post is unavailable or has returned to draft.",
    );
  return json?.data ?? json;
}
const postLabel = (type: string) =>
  type === "article"
    ? "Article / Blog"
    : type === "announcement"
      ? "Announcement"
      : "Update";
const dateLabel = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
function InlineText({ text, format }: { text: string; format: string }) {
  return (
    <>
      {postInline(text, format).map((part, i) =>
        part.bold ? (
          <strong key={i}>{part.text}</strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
export function PostBody({ post }: { post: OrgPost }) {
  return (
    <div className="space-y-3 break-words text-base leading-8 text-slate-200">
      {postLines(post.content, post.contentFormat).map((line, i) => {
        const content = (
          <InlineText text={line.text} format={post.contentFormat} />
        );
        if (line.kind === "heading")
          return (
            <h2 key={i} className="pt-3 text-xl font-bold text-white">
              {content}
            </h2>
          );
        if (line.kind === "bullet")
          return (
            <ul key={i} className="list-disc pl-6">
              <li>{content}</li>
            </ul>
          );
        return (
          <p key={i} className="min-h-3 whitespace-pre-wrap">
            {content}
          </p>
        );
      })}
    </div>
  );
}
function PostImage({
  url,
  caption,
  title,
}: {
  url?: string | null;
  caption?: string | null;
  title: string;
}) {
  const src = safePostImage(url);
  return src ? (
    <figure>
      <img
        src={src}
        alt={caption || title}
        loading="lazy"
        className="max-h-[560px] w-full rounded-xl object-contain"
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  ) : null;
}
export function OrganizationPosts({
  organizationId,
}: {
  organizationId: string;
}) {
  const { sandbox, fetch: pageFetch } = useOrganizationPageApi();
  const [page, setPage] = useState(1);
  const query = useQuery<Feed>({
    queryKey: [
      "organization-public-posts",
      organizationId,
      page,
      ...(sandbox ? [sandbox.account] : []),
    ],
    queryFn: () =>
      sandbox
        ? pageFetch(
            `/org-articles/organization/${organizationId}/published?page=${page}&limit=6`,
          ).then(async (res) => {
            if (!res.ok) throw new Error("Private posts unavailable");
            const json = await res.json();
            return json.data ?? json;
          })
        : fetchPublicPost(
            `/org-articles/organization/${organizationId}/published?page=${page}&limit=6&order=DESC`,
          ),
    enabled: !!organizationId,
    gcTime: sandbox ? 0 : undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: "always",
  });
  return (
    <section
      aria-label="Organization news and posts"
      className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">News & Updates</h2>
        <button
          type="button"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          aria-label="Refresh organization posts"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-cyan-300 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
      {query.isLoading && (
        <p className="text-slate-300" role="status">
          Loading posts…
        </p>
      )}
      {query.isError && (
        <p className="text-amber-300" role="alert">
          Unable to load organization posts. Use Refresh to try again.
        </p>
      )}
      {query.data && !query.data.articles.length && (
        <p className="text-slate-400">
          No published posts yet. Official news and announcements will appear
          here.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {query.data?.articles.map((post) => (
          <Link
            key={post.id}
            href={
              sandbox
                ? `/internal/test-organizations/${sandbox.id}?post=${encodeURIComponent(post.id)}`
                : `/organization-posts/${post.id}`
            }
            className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/50 transition hover:border-cyan-300/50"
            style={{ borderTop: `3px solid ${postAccent(post.accentColor)}` }}
          >
            {safePostImage(post.headerImageUrl) && (
              <img
                src={safePostImage(post.headerImageUrl)}
                alt={post.headerImageCaption || post.title}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
            )}
            <div className="space-y-3 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                {postLabel(post.postType)} · {dateLabel(post.publishedAt)}
              </p>
              <h3 className="break-words text-xl font-bold text-white">
                {post.title}
              </h3>
              <p className="break-words text-sm leading-6 text-slate-300">
                {post.summary || post.content.slice(0, 180)}
                {!post.summary && post.content.length > 180 ? "…" : ""}
              </p>
              <span className="inline-block text-sm font-semibold text-cyan-300">
                Read post →
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-4 text-sm text-slate-300">
        {page > 1 && (
          <button className="min-h-11 px-3" onClick={() => setPage(page - 1)}>
            Previous
          </button>
        )}
        <span>Page {page}</span>
        {query.data?.meta.hasNextPage && (
          <button className="min-h-11 px-3" onClick={() => setPage(page + 1)}>
            Next
          </button>
        )}
      </div>
    </section>
  );
}
export function OrganizationPostPage({ id }: { id: string }) {
  const { sandbox, fetch: pageFetch } = useOrganizationPageApi();
  const query = useQuery<{ article: OrgPost }>({
    queryKey: [
      "organization-public-post",
      id,
      ...(sandbox ? [sandbox.account] : []),
    ],
    queryFn: () =>
      sandbox
        ? pageFetch(`/org-articles/${id}`).then(async (res) => {
            if (!res.ok) throw new Error("Private post unavailable");
            const json = await res.json();
            return json.data ?? json;
          })
        : fetchPublicPost(`/org-articles/${id}`),
    gcTime: sandbox ? 0 : undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: "always",
  });
  const post = query.data?.article;
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8">
      {query.isLoading && (
        <p className="text-slate-300" role="status">
          Loading post…
        </p>
      )}
      {query.isError && (
        <div className="space-y-4 text-slate-300">
          <PageSEO title="Post unavailable" noindex />
          <p role="alert">This post is unavailable or has returned to draft.</p>
          <button
            className="min-h-11 rounded-lg border border-white/15 px-4"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
          <Link href="/aqua-organizations" className="block text-cyan-300">
            Browse organizations
          </Link>
        </div>
      )}
      {post && !query.isError && (
        <article
          className="space-y-6 rounded-2xl border border-white/10 bg-slate-950/50 p-5 sm:p-8"
          style={{ borderTop: `4px solid ${postAccent(post.accentColor)}` }}
        >
          <PageSEO
            title={post.title}
            noindex={!!sandbox}
            description={post.summary || post.content.slice(0, 160)}
            canonicalPath={`/organization-posts/${post.id}`}
            image={safePostImage(post.headerImageUrl)}
            type="article"
          />
          <Link
            href={
              sandbox
                ? `/internal/test-organizations/${sandbox.id}`
                : `/aqua-organizations/${post.organization?.id}`
            }
            className="text-sm text-cyan-300"
          >
            ← {post.organization?.name || "Organization"}
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            {postLabel(post.postType)} · {dateLabel(post.publishedAt)}
          </p>
          <h1 className="break-words text-3xl font-black text-white sm:text-4xl">
            {post.title}
          </h1>
          {post.summary && (
            <p className="break-words text-lg leading-8 text-slate-300">
              {post.summary}
            </p>
          )}
          <PostImage
            url={post.headerImageUrl}
            caption={post.headerImageCaption}
            title={post.title}
          />
          <PostBody post={post} />
          <PostImage
            url={post.articleImageUrl}
            caption={post.articleImageCaption}
            title={post.title}
          />
          <p className="border-t border-white/10 pt-5 text-sm text-slate-400">
            Published by {post.organization?.name || "the organization"}. Copy
            this page’s address to share this post.
          </p>
        </article>
      )}
    </main>
  );
}
