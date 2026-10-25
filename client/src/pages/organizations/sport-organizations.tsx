import { useRoute } from "wouter";
import { PageSEO } from "@/seo/usePageSEO";
import { sportVisual } from "@/lib/sportVisuals";
import { isTeamSport } from "@/lib/sportRegistration";
import SportHubSections from "@/components/sport-hub/SportHubSections";
import SportHubGallery from "@/components/sport-hub/SportHubGallery";
import SportCommunitySection from "@/components/sport-hub/SportCommunitySection";
import UpcomingSportEvents from "@/components/sport-hub/UpcomingSportEvents";
import HubGameCarousel from "@/components/sport-hub/HubGameCarousel";
import OrganizationPromoCard from "@/components/OrganizationPromoCard";
type Props = { sportKey?: string; params?: { sportKey: string } };
export default function SportOrganizationsPage({
  sportKey: selected,
  params: routeParams,
}: Props = {}) {
  const [, params] = useRoute("/sports/:sportKey");
  const sport = selected ?? routeParams?.sportKey ?? params?.sportKey ?? "";
  const label = sportVisual(sport).label;
  return (
    <main className="consumer-document-page cl-sport-hub" key={sport}>
      <PageSEO
        title={`${label} hub · Corner League`}
        canonicalPath={`/sports/${sport}`}
      />
      <header className="cl-hub-intro">
        <p className="cl-eyebrow">Corner League · {label}</p>
        <h1>
          {label} <span>sports hub</span>
        </h1>
        <p>
          Discover organizations, follow athletes, find your next competition
          and connect with the {label.toLowerCase()} community.
        </p>
      </header>
      {isTeamSport(sport) ? <HubGameCarousel sport={sport} /> : null}
      <SportHubSections sport={sport} />
      {!isTeamSport(sport) && <UpcomingSportEvents sport={sport} />}
      <SportHubGallery sport={sport} />
      <SportCommunitySection sport={sport} />
      <OrganizationPromoCard />
    </main>
  );
}
