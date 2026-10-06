import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";
export default function TestOrganizationPreview() {
  const [, params] = useRoute("/internal/test-organizations/:id");
  const { user, isAuthenticated } = useAuth();
  const allowed =
    isAuthenticated && String(user?.role).toUpperCase() === "SUPER_ADMIN";
  const [result, setResult] = useState<{
    account: string;
    id: string;
    data: any;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setResult(null);
    setError("");
    if (!allowed || !params?.id || !user) return;
    const controller = new AbortController();
    void apiFetch(
      `/sports/catalog/test-preview/${encodeURIComponent(params.id)}`,
      { cache: "no-store", signal: controller.signal, noRefresh: true },
    )
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Test organization unavailable or access denied");
        return response.json();
      })
      .then((json) => {
        if (!controller.signal.aborted)
          setResult({
            account: String(user.id),
            id: params.id,
            data: json.data ?? json,
          });
      })
      .catch((caught) => {
        if (!controller.signal.aborted) setError(caught.message);
      });
    return () => controller.abort();
  }, [allowed, user?.id, params?.id]);
  const data =
    allowed && result?.account === String(user?.id) && result?.id === params?.id
      ? result.data
      : null;
  return (
    <main className="p-6 max-w-4xl mx-auto text-white">
      <PageSEO title="Private test preview" noindex />
      <p className="text-amber-300 font-bold">PRIVATE TEST PREVIEW</p>
      {!allowed ? (
        <div className="mt-4"><p>Sign in with a Super Admin account to view this workspace.</p>{!isAuthenticated && <Link className="inline-block mt-4 text-cyan-300 underline" href={`/auth?next=${encodeURIComponent(`/internal/test-organizations/${params?.id ?? ""}`)}`}>Sign in</Link>}</div>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : !data ? (
        <p>Loading private preview…</p>
      ) : (
        <>
          <h1 className="text-3xl font-bold mt-4">{data.organization.name}</h1>
          <p className="text-cyan-300 mt-2">{data.sportProfile.label}</p>
          <p className="mt-4">{data.organization.description}</p>
          <p className="my-6 text-amber-200">
            Only organization setup and private text drafts are available in
            this foundation batch. These drafts are not public posts.
          </p>
          <h2 className="text-xl font-bold">Private draft posts</h2>
          {data.posts?.length ? (
            data.posts.map((post: any) => (
              <article
                key={post.id}
                className="mt-4 p-5 rounded-xl border border-white/20"
              >
                <h3 className="font-bold text-lg">{post.title}</h3>
                <p className="whitespace-pre-wrap mt-3">{post.content}</p>
              </article>
            ))
          ) : (
            <p className="mt-4">No drafts yet.</p>
          )}
        </>
      )}
    </main>
  );
}
