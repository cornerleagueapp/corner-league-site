import { useOrganizationPageApi } from "@/pages/organizations/SandboxContext";
import { galleryResponse } from "@/lib/organizationGallery";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/apiClient";
import {
  loadOrganizationGallery,
  photoDate,
  safeRacerLink,
  type GalleryPhoto,
} from "@/lib/organizationGallery";
export default function OrganizationPhotoGallery({
  organizationId,
  athleteId,
  canRemoveTag = false,
}: {
  organizationId?: string;
  athleteId?: string;
  canRemoveTag?: boolean;
}) {
  const id = organizationId || athleteId;
  if (!id) return null;
  return (
    <Gallery
      key={`${organizationId ? "organizations" : "athletes"}:${id}`}
      scope={organizationId ? "organizations" : "athletes"}
      id={id}
      canRemoveTag={canRemoveTag}
    />
  );
}
function Gallery({
  scope,
  id,
  canRemoveTag,
}: {
  scope: "organizations" | "athletes";
  id: string;
  canRemoveTag: boolean;
}) {
  const { sandbox, fetch: pageFetch } = useOrganizationPageApi();
  const [page, setPage] = useState(1),
    [selected, setSelected] = useState<GalleryPhoto | null>(null),
    [removing, setRemoving] = useState(false),
    [error, setError] = useState<string | null>(null);
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: [
      "organization-gallery",
      scope,
      id,
      page,
      ...(sandbox ? [sandbox.account] : []),
    ],
    queryFn: () =>
      sandbox
        ? pageFetch(
            `/organization-gallery/${scope}/${id}?page=${page}&limit=12`,
          ).then(async (res) => {
            if (!res.ok) throw new Error("Private gallery unavailable");
            return galleryResponse(await res.json());
          })
        : loadOrganizationGallery(scope, id, page),
    gcTime: sandbox ? 0 : 1800000,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });
  const remove = async (photo: GalleryPhoto) => {
    setRemoving(true);
    setError(null);
    try {
      await apiRequest(
        "DELETE",
        `/organization-gallery/tags/${photo.id}/${id}`,
      );
      setSelected(null);
      await cache.invalidateQueries({ queryKey: ["organization-gallery"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the tag.");
    } finally {
      setRemoving(false);
    }
  };
  return (
    <section
      aria-label={
        scope === "organizations"
          ? "Organization photo gallery"
          : "Photos tagged by organizations"
      }
      className="rounded-[28px] border border-cl-accent/10 bg-cl-surface p-5 text-cl-ink sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {scope === "organizations"
            ? "Photo Gallery"
            : "Tagged Organization Photos"}
        </h2>
      </div>
      <p className="mt-2 text-sm text-cl-muted">
        {scope === "organizations"
          ? "Photos and moments shared by this organization."
          : "Photos shared by organizations featuring this athlete."}{" "}
        Newest capture dates first (UTC).
      </p>
      {query.isPending ? (
        <p role="status" className="mt-4">
          Loading photos…
        </p>
      ) : null}
      {query.isError ? (
        <p role="alert" className="mt-4 text-cl-danger">
          Photos could not load. <button type="button" className="ml-2 underline" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? "Retrying…" : "Try again"}</button>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-cl-danger">
          {error}
        </p>
      ) : null}
      {!query.isError && query.data && !query.data.items.length ? (
        <p className="mt-4 text-sm text-cl-muted">No published photos yet.</p>
      ) : null}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {query.data?.items.map((photo) => (
          <article
            key={photo.id}
            className="overflow-hidden rounded-2xl border border-cl-border bg-cl-subtle"
          >
            <button
              type="button"
              className="block aspect-[4/3] w-full"
              onClick={() => setSelected(photo)}
              aria-label={`View ${photo.caption || "organization photo"}`}
            >
              <img
                src={photo.url}
                alt={photo.caption || `Photo from ${photo.organizationName}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
            <div className="min-w-0 space-y-2 break-words p-3">
              <time
                dateTime={photo.capturedAt}
                className="text-xs text-cl-accent"
              >
                {photoDate(photo.capturedAt)}
              </time>
              {photo.album ? (
                <p className="text-xs text-cl-muted">{photo.album}</p>
              ) : null}
              <p className="line-clamp-2 whitespace-pre-wrap text-sm">
                {photo.caption}
              </p>
              <PhotoCredits photo={photo} />
            </div>
          </article>
        ))}
      </div>
      {query.data && query.data.total > 12 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            disabled={page === 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button
            variant="outline"
            disabled={page * 12 >= query.data.total || query.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !removing) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto border-cl-border bg-cl-surface text-cl-ink">
          <DialogTitle>Organization photo</DialogTitle>
          <DialogDescription className="text-cl-muted">
            {selected
              ? `${selected.organizationName} · ${photoDate(selected.capturedAt)}`
              : ""}
          </DialogDescription>
          {selected ? (
            <>
              <img
                src={selected.url}
                alt={
                  selected.caption || `Photo from ${selected.organizationName}`
                }
                className="max-h-[60vh] w-full object-contain"
              />
              <p className="whitespace-pre-wrap">{selected.caption}</p>
              <PhotoCredits photo={selected} />
              {scope === "athletes" && canRemoveTag ? (
                <Button
                  variant="outline"
                  disabled={removing}
                  onClick={() => void remove(selected)}
                >
                  {removing ? "Removing tag…" : "Remove my tag from this photo"}
                </Button>
              ) : null}
              {error ? (
                <p role="alert" className="text-cl-danger">
                  {error}
                </p>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
function PhotoCredits({ photo }: { photo: GalleryPhoto }) {
  const { sandbox } = useOrganizationPageApi();
  return (
    <div className="space-y-2 text-xs">
      <Link
        className="text-cl-accent underline"
        href={
          sandbox
            ? `/internal/test-organizations/${sandbox.id}`
            : `/aqua-organizations/${encodeURIComponent(photo.organizationId)}`
        }
      >
        {photo.organizationName}
      </Link>
      <div className="flex flex-wrap gap-2">
        {photo.tags.map((tag) => {
          const href = safeRacerLink(tag.profileUrl);
          return href ? (
            <Link
              key={tag.athleteId}
              className="rounded-full bg-cl-accent/10 px-2 py-1 text-cl-accent"
              href={href}
            >
              {tag.name}
            </Link>
          ) : (
            <span key={tag.athleteId}>{tag.name}</span>
          );
        })}
      </div>
    </div>
  );
}
