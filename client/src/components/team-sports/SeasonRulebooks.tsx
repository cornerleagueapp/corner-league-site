import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { publicSportData } from "@/lib/sportRegistration";
type Rulebook = {
  title: string;
  text: string;
  externalUrl: string;
  documents: { id: string; name: string; mediaType: string; size: number }[];
};
export function safeRulebookLink(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export default function SeasonRulebooks({ seasonId }: { seasonId: string }) {
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["season-rulebook", seasonId],
    queryFn: () =>
      publicSportData<{
        rulebook: Rulebook | null;
        publishedAt: string | null;
      }>(`/team-sports/seasons/${encodeURIComponent(seasonId)}/rulebook`),
    enabled: !!seasonId,
    staleTime: 15000,
    retry: false,
  });
  async function download(document: Rulebook["documents"][number]) {
    if (downloading) return;
    setDownloading(document.id);
    setError("");
    try {
      const response = await apiFetch(
        `/team-sports/seasons/${encodeURIComponent(seasonId)}/rulebook/documents/${encodeURIComponent(document.id)}`,
        { skipAuth: true, noRefresh: true },
      );
      if (!response.ok)
        throw new Error(
          "This document is no longer published. Refresh the rulebook and try again.",
        );
      const url = URL.createObjectURL(await response.blob());
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.name;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloading("");
    }
  }
  if (query.isPending) return <p role="status">Loading season rulebooks…</p>;
  if (query.isError)
    return (
      <div role="alert">
        <p>Season rulebooks are temporarily unavailable.</p>
        <button
          className="min-h-11 underline"
          onClick={() => void query.refetch()}
        >
          Try again
        </button>
      </div>
    );
  const rules = query.data?.rulebook;
  if (!rules)
    return (
      <section className="rounded-2xl border border-cl-border bg-cl-subtle p-5">
        <h2 className="text-xl font-bold">Season rulebooks</h2>
        <p className="mt-2 text-cl-muted">
          The organizer hasn’t published a rulebook for this season yet.
        </p>
      </section>
    );
  const link = safeRulebookLink(rules.externalUrl);
  return (
    <section className="min-w-0 space-y-5" aria-label="Season rulebooks">
      <header>
        <h2 className="break-words text-2xl font-bold">{rules.title}</h2>
        {query.data?.publishedAt && (
          <p className="mt-1 text-sm text-cl-muted">
            Published {new Date(query.data.publishedAt).toLocaleDateString()}
          </p>
        )}
      </header>
      {!!rules.text && (
        <div className="whitespace-pre-wrap break-words rounded-2xl border border-cl-border bg-cl-subtle p-5 leading-relaxed">
          {rules.text}
        </div>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-xl border border-cl-border bg-cl-subtle px-4 py-2 font-semibold"
        >
          Open external rulebook ↗
        </a>
      )}
      {!!rules.documents.length && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold">Rulebook documents</h3>
          {rules.documents.map((document) => (
            <div
              className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-cl-border p-4"
              key={document.id}
            >
              <div className="min-w-0">
                <p className="break-words font-semibold">{document.name}</p>
                <p className="text-sm text-cl-muted">
                  {(document.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                disabled={!!downloading}
                className="min-h-11 rounded-xl border border-cl-border bg-cl-subtle px-4 py-2 font-semibold disabled:opacity-50"
                onClick={() => void download(document)}
                aria-label={`Download ${document.name}`}
              >
                {downloading === document.id ? "Downloading…" : "Download"}
              </button>
            </div>
          ))}
        </div>
      )}
      {!!error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
