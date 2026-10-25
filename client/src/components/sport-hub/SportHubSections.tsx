import { Link } from "wouter";
import {
  Building2,
  MessageSquare,
  Search,
  CalendarDays,
  Newspaper,
  ClipboardList,
} from "lucide-react";
import { sportDirectory, sportRegistration } from "@/lib/sportNavigation";
import { sportVisual } from "@/lib/sportVisuals";
export default function SportHubSections({ sport }: { sport: string }) {
  const label = sportVisual(sport).label;
  const cards = [
    {
      title: "Organizations",
      text: `Discover the leagues and clubs bringing ${label.toLowerCase()} to your community.`,
      action: "Explore organizations",
      href: sportDirectory(sport),
      Icon: Building2,
    },
    {
      title: "Community Forum",
      text: "Talk sport, share ideas and join the conversation with your community.",
      action: "Join the discussion",
      href: `/community?sport=${sport}`,
      Icon: MessageSquare,
    },
    {
      title: "Search Athletes",
      text: "Find athletes, follow their teams and explore their performance.",
      action: "Find athletes",
      href: `/racer?sport=${sport}`,
      Icon: Search,
    },
    {
      title: "Upcoming Events",
      text: "Your next game starts here. Explore schedules and results across organizations.",
      action: "Open schedule",
      href: `/sports/${sport}/events`,
      Icon: CalendarDays,
    },
    {
      title: "Articles & Blogs",
      text: `Stories, perspectives and updates from the ${label.toLowerCase()} community.`,
      action: "Read stories",
      href: `/articles?sport=${sport}`,
      Icon: Newspaper,
    },
    {
      title: "Registration",
      text: "Find your competition and explore the available ways to take part.",
      action: "Explore registration",
      href: sportRegistration(sport),
      Icon: ClipboardList,
    },
  ];
  return (
    <section className="cl-hub-sections" aria-label={`${label} sections`}>
      <p className="cl-eyebrow">Browse</p>
      <h2>{label} sections</h2>
      <div className="cl-hub-section-grid">
        {cards.map(({ title, text, action, href, Icon }) => (
          <Link className="cl-hub-section-card" key={title} href={href}>
            <span className="cl-hub-section-icon">
              <Icon size={21} aria-hidden="true" />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
            <strong>
              {action} <span aria-hidden="true">→</span>
            </strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
