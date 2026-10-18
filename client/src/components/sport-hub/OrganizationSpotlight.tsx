import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchSportOrganizations } from "@/lib/sportOrganizations";
import { sportDirectory, sportOrganization } from "@/lib/sportNavigation";
import { sportLogo } from "@/lib/sportVisuals";
import { brandingImage } from "@/lib/consumerBranding";
import { BrandingImage } from "@/components/branding/ConsumerBrandingHero";
export default function OrganizationSpotlight({ sport }: { sport: string }) {
  const query = useQuery({
    queryKey: ["sport-organizations", sport, 1],
    queryFn: ({ signal }) => fetchSportOrganizations(sport, 1, signal),
    staleTime: 30_000,
  });
  const rows = query.data?.organizations.slice(0, 3) ?? [];
  return (
    <section className="sport-hub-section" aria-labelledby="spotlight-title">
      <div className="sport-section-heading">
        <h2 id="spotlight-title">Community spotlight</h2>
        <Link href={sportDirectory(sport)}>View organizations →</Link>
      </div>
      {query.isPending ? (
        <p role="status" className="sport-hub-empty">
          Loading your community…
        </p>
      ) : query.isError ? (
        <div role="alert" className="sport-hub-empty">
          Organizations couldn’t be loaded.{" "}
          <button
            onClick={() => void query.refetch()}
            className="sport-hub-more"
          >
            Try again
          </button>
        </div>
      ) : !rows.length ? (
        <p className="sport-hub-empty">
          Your community is growing. Organizations will appear here when
          available.
        </p>
      ) : (
        <div className="sport-spotlight-list">
          {rows.map((org) => (
            <Link
              key={org.id}
              href={sportOrganization(sport, org.id)}
              className="sport-spotlight-card"
            >
              <BrandingImage
                key={org.logoUrl ?? "default"}
                src={brandingImage(org.logoUrl)}
                fallback={sportLogo(sport)}
                alt={`${org.name} logo`}
                className="sport-spotlight-logo"
              />
              <div>
                <h3>{org.name}</h3>
                <p>
                  {org.description ||
                    "Meet the organization, explore its events, and follow its latest updates."}
                </p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
