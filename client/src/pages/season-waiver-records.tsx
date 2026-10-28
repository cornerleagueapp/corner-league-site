import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BreadcrumbTrail } from "@/components/navigation/Breadcrumbs";
import { PageSEO } from "@/seo/usePageSEO";
import { loadWaiverReceipt, saveWaiverReceipt } from "@/lib/waiverReceipts";
export default function SeasonWaiverRecords() {
  const params = new URLSearchParams(useSearch()),
    season = params.get("season") || "",
    signature = params.get("signature") || "",
    { user, isAuthenticated, isLoading } = useAuth();
  const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    valid = uuid.test(season) && uuid.test(signature),
    next = `/season-waiver-records?${new URLSearchParams({ season, signature })}`;
  const [error, setError] = useState("");
  const q = useQuery({
    queryKey: ["private-waiver-receipt", user?.id, season, signature],
    enabled: valid && isAuthenticated,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: () => loadWaiverReceipt(season, signature),
  });
  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 px-4 py-10 text-foreground">
      <PageSEO
        title="Private waiver signing record"
        canonicalPath="/season-waiver-records"
        noindex
      />
      <BreadcrumbTrail
        items={[{ label: "Home", href: "/" }, { label: "Signing record" }]}
      />
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8">
        <h1 className="text-2xl font-bold">Your signing record</h1>
        <p>
          This private record remains available when season registration closes
          or the public season is unpublished.
        </p>
        {!valid ? (
          <p role="alert">
            This signing-record link is invalid. Open the complete link from
            your receipt email.
          </p>
        ) : isLoading ? (
          <p role="status">Checking your account…</p>
        ) : !isAuthenticated ? (
          <>
            <p>Sign in with the account used to sign this document.</p>
            <Button asChild>
              <Link href={`/auth?next=${encodeURIComponent(next)}`}>
                Sign in to view record
              </Link>
            </Button>
          </>
        ) : q.isPending ? (
          <p role="status">Loading your signing record…</p>
        ) : q.isError ? (
          <div role="alert">
            <p>{q.error.message}</p>
            <Button variant="outline" onClick={() => void q.refetch()}>
              Try again
            </Button>
          </div>
        ) : q.data ? (
          <>
            <h2 className="break-words text-xl font-semibold">
              {q.data.title} · revision {q.data.revision}
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="font-semibold">Athlete</dt>
                <dd>{q.data.athleteName}</dd>
              </div>
              <div>
                <dt className="font-semibold">Signed by</dt>
                <dd>{q.data.signerName}</dd>
              </div>
              <div>
                <dt className="font-semibold">Signed at</dt>
                <dd>{new Date(q.data.signedAt).toLocaleString()}</dd>
              </div>
            </dl>
            <Button
              onClick={() => {
                try {
                  setError("");
                  saveWaiverReceipt(q.data!);
                } catch {
                  setError(
                    "Your browser could not download the record. Try again in your browser.",
                  );
                }
              }}
            >
              Download signed PDF
            </Button>
          </>
        ) : null}
        {!!error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
