import { Link, useLocation } from "wouter";
import { useSportSelection } from "@/hooks/useSportSelection";
import { sportDirectory, sportHub } from "@/lib/sportNavigation";
import { sportVisual } from "@/lib/sportVisuals";
import ThemedSelect from "./ThemedSelect";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
export function SidebarSports({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { sports, sportKey, selectSport } = useSportSelection();
  const [, navigate] = useLocation();
  const choose = (key: string) => {
    selectSport(key);
    navigate(sportHub(key));
    onNavigate?.();
  };
  return (
    <>
      <div className="cl-sidebar-sports">
        <h2>{collapsed ? "" : "Sports"}</h2>
        {sports.map((sport) => (
          <button
            type="button"
            key={sport.key}
            aria-label={sport.label}
            title={sport.label}
            aria-current={sport.key === sportKey ? "page" : undefined}
            onClick={() => choose(sport.key)}
          >
            <span aria-hidden="true">{sportVisual(sport.key).initials}</span>
            {!collapsed && <strong>{sport.label}</strong>}
          </button>
        ))}
      </div>
      <div className="cl-mobile-sport-choice">
        <ThemedSelect
          label="Sport"
          value={sportKey}
          onChange={choose}
          options={sports.map((s) => ({ value: s.key, label: s.label }))}
        />
      </div>
    </>
  );
}
export function DesktopExploreNavigation({ sportKey }: { sportKey: string }) {
  const isJetSki = sportKey === "jet-ski";
  const [location] = useLocation();
  const links = [
    { label: "Home", href: "/" },
    { label: "Hub", href: sportHub(sportKey) },
    { label: "Organizations", href: sportDirectory(sportKey) },
    { label: "Events", href: "/event-map" },
  ];
  const more = [
    { label: isJetSki ? "Racers" : "Athletes", href: "/racer" },
    ...(isJetSki
      ? [
          { label: "Registration", href: "/registration" },
          { label: "Trending", href: "/top-trends" },
          { label: "Polls", href: "/polls" },
          { label: "Arcade", href: "/arcade" },
        ]
      : []),
  ];
  return (
    <nav className="cl-desktop-explore" aria-label="Explore">
      {links.map((link, i) => (
        <Link
          key={link.label}
          href={link.href}
          aria-current={
            location === link.href && (i !== 2 || links[1].href !== link.href)
              ? "page"
              : undefined
          }
        >
          {link.label}
        </Link>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger className="cl-more-trigger">
          More <span aria-hidden="true">⌄</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="cl-choice-menu">
          {more.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link href={link.href}>{link.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
