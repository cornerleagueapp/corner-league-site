import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { Ticket } from "@/lib/admissions";
import {
  assetReference,
  designImages,
  renderStudioTicket,
  type StudioDesign,
} from "@/lib/ticket-design";
export function StudioPass({
  ticket,
  onReady,
  preview = false,
}: {
  ticket: Ticket;
  onReady?: (ready: boolean) => void;
  preview?: boolean;
}) {
  const d = ticket.snapshot.design as StudioDesign;
  const [images, setImages] = useState<Record<string, string>>({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const signature = JSON.stringify(designImages(d));
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    onReady?.(false);
    void (async () => {
      const result: Record<string, string> = {};
      let bytes = 0;
      for (const url of JSON.parse(signature) as string[]) {
        const ref = assetReference(url);
        if (!ref) throw new Error("This ticket contains unsupported artwork.");
        const response = await apiFetch(
          `/admissions/assets/${ref.org}/${ref.id}`,
          { signal: controller.signal, skipAuth: true, cache: "force-cache" },
        );
        if (!response.ok)
          throw new Error(
            "Ticket artwork could not load. Reopen this pass to retry.",
          );
        const blob = await response.blob();
        bytes += blob.size;
        if (bytes > 16 * 1024 * 1024 || blob.type !== "image/png")
          throw new Error("Ticket artwork exceeds the image limit.");
        result[url] = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      if (active) {
        setImages(result);
        setLoading(false);
      }
    })().catch((e) => {
      if (active) {
        setError(e.message || "Artwork unavailable.");
        setLoading(false);
      }
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [signature]);
  useEffect(() => {
    onReady?.(!loading && !error && !!ticket.qr);
    return () => onReady?.(false);
  }, [loading, error, ticket.qr, onReady]);
  if (loading) return <p role="status">Preparing your ticket artwork…</p>;
  if (error)
    return (
      <p role="alert" className="admission-error">
        {error}
      </p>
    );
  try {
    const result = renderStudioTicket(
      d,
      {
        ...ticket.snapshot,
        ticketId: preview ? undefined : ticket.id,
        qr: ticket.qr,
        status: preview ? "preview" : ticket.entryState || ticket.status,
        entryStart: ticket.entryStart,
        entryEnd: ticket.entryEnd,
      },
      images,
    );
    return (
      <figure
        className={
          preview
            ? "studio-issued-pass mx-auto w-48 max-w-full"
            : "studio-issued-pass"
        }
      >
        <div dangerouslySetInnerHTML={{ __html: result.svg }} />
        <figcaption className="sr-only">
          {ticket.snapshot.eventName}. {ticket.snapshot.typeName}.{" "}
          {ticket.snapshot.location}. Status:{" "}
          {ticket.entryState || ticket.status}. One guest, gate validation
          required.
        </figcaption>
      </figure>
    );
  } catch (e) {
    return (
      <p role="alert" className="admission-error">
        {(e as Error).message}
      </p>
    );
  }
}
export async function downloadTicketImage(id: string) {
  const response = await apiFetch(
    `/admissions/me/tickets/${encodeURIComponent(id)}/image`,
    { cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(
      "The ticket image could not be prepared. Reopen this pass and try again.",
    );
  const blob = await response.blob();
  if (blob.type !== "image/png") throw new Error("Ticket image unavailable.");
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `cornerleague-${id}.png`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
