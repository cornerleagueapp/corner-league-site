import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";
import { SandboxContext } from "./SandboxContext";
import AquaOrganizationDetailsPage from "./aqua-organization-details";
import OrgEventDetailsPage from "./org-event-details";
import { OrganizationPostPage } from "@/features/organization-posts/OrganizationPosts";
import PublicRaceSchedulePage from "@/features/race-schedule-public/pages/PublicRaceSchedulePage";
export default function TestOrganizationPreview() {
  const search = useSearch();
  const previewParams = new URLSearchParams(search);
  const eventId = previewParams.get("event") || undefined;
  const postId = previewParams.get("post") || undefined;
  const schedule = previewParams.get("view") === "schedule";
  const [location] = useLocation();
  const id = location.split("/")[3];
  const params = id ? { id } : null;
  const { user, isAuthenticated } = useAuth();
  const allowed =
    isAuthenticated && String(user?.role).toUpperCase() === "SUPER_ADMIN";
  const [result, setResult] = useState<{
    account: string;
    id: string;
    data: any;
  } | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const update = () => setRefresh((n) => n + 1);
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, []);
  useEffect(() => {
    setResult(null);
    setError("");
    if (!allowed || !params?.id || !user) return;
    const controller = new AbortController();
    void apiFetch(
      `/sandbox/organizations/${encodeURIComponent(params.id)}/preview`,
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
  }, [allowed, user?.id, params?.id, eventId, postId, schedule, refresh]);
  const data =
    allowed && result?.account === String(user?.id) && result?.id === params?.id
      ? result.data
      : null;
  if (!allowed)
    return (
      <main className="p-6 text-white">
        <PageSEO title="Private sandbox" noindex />
        <p>Sign in with a Super Admin account to view this workspace.</p>
        {!isAuthenticated && (
          <Link
            className="text-cyan-300 underline"
            href={`/auth?next=${encodeURIComponent(window.location.pathname)}`}
          >
            Sign in
          </Link>
        )}
      </main>
    );
  if (error || !data)
    return (
      <main className="p-6 text-white">
        <PageSEO title="Private sandbox" noindex />
        <p role={error ? "alert" : "status"}>
          {error || "Loading private preview…"}
        </p>
      </main>
    );
  const sandbox = { id: params!.id, account: String(user!.id), data };
  return (
    <SandboxContext.Provider
      key={`${sandbox.account}:${sandbox.id}`}
      value={sandbox}
    >
      <PageSEO title={`${data.organization.name} · Private sandbox`} noindex />
      <div className="border-b border-amber-300/20 bg-amber-300/10 px-5 py-3 text-sm text-amber-200">
        TEST SANDBOX · Super Admin only · This is the normal consumer layout
        with private test data.
      </div>
      {postId ? (
        <OrganizationPostPage id={postId} />
      ) : eventId ? (
        schedule ? (
          <PublicRaceSchedulePage eventSlug={eventId} />
        ) : (
          <OrgEventDetailsPage params={{ id: eventId }} />
        )
      ) : (
        <AquaOrganizationDetailsPage params={{ id: sandbox.id }} />
      )}
    </SandboxContext.Provider>
  );
}
