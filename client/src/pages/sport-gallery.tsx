import { useRoute } from "wouter";
import SportHubGallery from "@/components/sport-hub/SportHubGallery";
import { PageSEO } from "@/seo/usePageSEO";
import { sportVisual } from "@/lib/sportVisuals";
export default function SportGalleryPage() {
  const [, p] = useRoute("/sports/:sportKey/gallery");
  const sport = p?.sportKey || "";
  return (
    <main className="consumer-document-page cl-sport-hub">
      <PageSEO
        title={`${sportVisual(sport).label} gallery · Corner League`}
        canonicalPath={`/sports/${sport}/gallery`}
      />
      <h1>{sportVisual(sport).label} gallery</h1>
      <SportHubGallery key={sport} sport={sport} full />
    </main>
  );
}
