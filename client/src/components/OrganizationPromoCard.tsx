import { CREATE_ORGANIZATION_URL } from "./CreateOrganizationLink";

export default function OrganizationPromoCard() {
  return (
    <section
      className="consumer-editorial-card consumer-org-promo"
      aria-labelledby="organization-promo-title"
    >
      <p className="consumer-eyebrow">For sports organizers</p>
      <h2 id="organization-promo-title">
        Your organization. All in one place.
      </h2>
      <p>
        Bring your events, registration, scores and community together on Corner
        League.
      </p>
      <a
        href={CREATE_ORGANIZATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="consumer-editorial-cta"
      >
        Create your own Org ↗
      </a>
      <p className="consumer-editorial-note">
        Opens the organizer setup in a new tab.
      </p>
    </section>
  );
}
