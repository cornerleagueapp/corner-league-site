import { trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";

type TrackedSponsorLinkProps = {
  href: string;
  sponsorId: string;
  sponsorName: string;
  placement: string;
  sport?: string;
  eventId?: string;
  orgId?: string;
  children: React.ReactNode;
  className?: string;
};

export function TrackedSponsorLink({
  href,
  sponsorId,
  sponsorName,
  placement,
  sport,
  eventId,
  orgId,
  children,
  className,
}: TrackedSponsorLinkProps) {
  const handleClick = () => {
    trackEvent(AnalyticsEvents.SPONSOR_LINK_CLICKED, {
      sponsor_id: sponsorId,
      sponsor_name: sponsorName,
      placement,
      sport,
      event_id: eventId,
      org_id: orgId,
      outbound_url: href,
    });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
