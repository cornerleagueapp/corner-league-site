import { SportIcon } from "./SportIcon";
import { Link, useLocation } from "wouter";
import { useSportSelection } from "@/hooks/useSportSelection";
import { sportDirectory, sportHub } from "@/lib/sportNavigation";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const choose = (key: string) => {
    selectSport(key);
    navigate(sportHub(key));
    onNavigate?.();
  };
  return (
    <>
      <div className="cl-sidebar-sports">
        <h2>{collapsed ? "" : "Sports"}</h2>
        <button type="button" title="All Sports" aria-label="All Sports" aria-current={location === "/" ? "page" : undefined} onClick={()=>{navigate("/");onNavigate?.();}}><SportIcon sport="all" />{!collapsed&&<strong>All Sports</strong>}</button>
        {sports.map((sport) => (
          <button
            type="button"
            key={sport.key}
            aria-label={sport.label}
            title={sport.label}
            aria-current={location !== "/" && sport.key === sportKey ? "page" : undefined}
            onClick={() => choose(sport.key)}
          >
            <SportIcon sport={sport.key} />{!collapsed && <strong>{sport.label}</strong>}
          </button>
        ))}
      </div>
      <div className="cl-mobile-sport-choice">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-cl-border bg-cl-subtle px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-cl-muted transition hover:border-cl-accent/20 hover:bg-cl-accent/[0.06] hover:text-cl-ink"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>Sports</span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div id={listId} hidden={!open} className="cl-mobile-sport-list">
          <button type="button" onClick={()=>{navigate("/");onNavigate?.();}}>All Sports</button>
          {sports.map((sport) => (
            <button
              type="button"
              key={sport.key}
              aria-current={location !== "/" && sport.key === sportKey ? "page" : undefined}
              onClick={() => choose(sport.key)}
            >
              <SportIcon sport={sport.key} /> {sport.label}
            </button>
          ))}
        </div>
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
          <span>More</span>
          <ChevronDown aria-hidden="true" className="cl-more-chevron" />
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
