import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import PublicOrganizationChooser from "./PublicOrganizationChooser";
import OrganizationPhotoGallery from "@/components/OrganizationPhotoGallery";
import GalleryThumbnail from "@/components/media/GalleryThumbnail";
import ConsumerMediaDialog from "@/components/ui/ConsumerMediaDialog";
import { apiFetch } from "@/lib/apiClient";
import { galleryResponse, type GalleryPhoto } from "@/lib/organizationGallery";
import { sportVisual } from "@/lib/sportVisuals";
import { sportOrganization } from "@/lib/sportNavigation";
export default function SportHubGallery({
  sport,
  full = false,
}: {
  sport: string;
  full?: boolean;
}) {
  const [organization, setOrganization] = useState("");
  return (
    <section
      className="cl-hub-gallery"
      aria-label={`${sportVisual(sport).label} public gallery`}
    >
      <div className="cl-hub-section-heading">
        <div>
          <p className="cl-eyebrow">Community gallery</p>
          <h2>
            Photos & game-day <span>moments</span>
          </h2>
          <p>
            Published photos from your sport’s organizations. Choose a community
            to explore.
          </p>
        </div>
        {!full && (
          <Link className="sport-hub-more" href={`/sports/${sport}/gallery`}>
            View all →
          </Link>
        )}
      </div>
      <PublicOrganizationChooser
        sport={sport}
        value={organization}
        onChange={setOrganization}
      />
      {organization &&
        (full ? (
          <OrganizationPhotoGallery
            key={organization}
            organizationId={organization}
          />
        ) : (
          <Preview
            key={organization}
            organization={organization}
            sport={sport}
          />
        ))}
    </section>
  );
}
function Preview({
  organization,
  sport,
}: {
  organization: string;
  sport: string;
}) {
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const q = useQuery({
    queryKey: ["sport-hub-gallery", sport, organization],
    queryFn: async ({ signal }) => {
      const r = await apiFetch(
        `/organization-gallery/organizations/${encodeURIComponent(organization)}?page=1&limit=6`,
        { signal, skipAuth: true, noRefresh: true },
      );
      if (!r.ok) throw new Error("Gallery unavailable");
      const data = galleryResponse(await r.json());
      if (data.items.some((p) => p.organizationId !== organization))
        throw new Error("Gallery does not match this organization");
      return data;
    },
    staleTime: 60000,
    retry: false,
  });
  return (
    <>
      {q.isPending ? (
        <p role="status" className="cl-hub-empty">
          Loading published photos…
        </p>
      ) : q.isError ? (
        <div role="alert" className="cl-hub-empty">
          Photos couldn’t load.{" "}
          <button onClick={() => q.refetch()}>Try again</button>
        </div>
      ) : !q.data.items.length ? (
        <p className="cl-hub-empty">
          No published photos from this organization yet. Choose another
          organization above.
        </p>
      ) : (
        <div className="cl-hub-gallery-grid">
          {q.data.items.map((photo) => (
            <article key={photo.id}>
              <button
                className="cl-hub-photo"
                onClick={() => setSelected(photo)}
                aria-label={`View ${photo.caption || "organization photo"}`}
              >
                <GalleryThumbnail
                  src={photo.url}
                  alt={photo.caption || "Community photo"}
                  className="h-full w-full object-cover"
                />
              </button>
              <div>
                <Link href={sportOrganization(sport, organization)}>
                  {photo.organizationName}
                </Link>
                <h3>{photo.caption || photo.album || "Game-day moments"}</h3>
              </div>
            </article>
          ))}
        </div>
      )}
      {selected && (
        <ConsumerMediaDialog
          title={selected.caption || "Community photo"}
          description={selected.organizationName}
          onClose={() => setSelected(null)}
        >
          <button
            className="m-3 min-h-11 rounded-xl border border-cl-border px-4"
            onClick={() => setSelected(null)}
          >
            Close photo
          </button>
          <img
            className="max-h-[75dvh] w-full object-contain"
            src={selected.url}
            alt={selected.caption || "Community photo"}
          />
        </ConsumerMediaDialog>
      )}
    </>
  );
}
