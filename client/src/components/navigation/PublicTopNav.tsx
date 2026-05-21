import React from "react";
import { Link, useLocation } from "wouter";
import logoPath from "@assets/CL_Logo.png";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/logout";
import { ChevronDown, Check } from "lucide-react";

type NavTabKey = "home" | "events" | "stats" | "calendar" | "sponsors";

type SportOption = {
  key: string;
  label: string;
  href?: string;
  enabled?: boolean;
};

type MobileSectionOption = {
  key: string;
  label: string;
  targetId: string;
};

type PublicTopNavProps = {
  activeTab?: NavTabKey;
  sticky?: boolean;
  homeHref?: string;
  sports?: SportOption[];
  selectedSportKey?: string;
  onSportChange?: (sport: SportOption) => void;
  mobileSections?: MobileSectionOption[];
};

const tabBase =
  "rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] transition duration-200 xl:px-5 xl:py-3 xl:text-xs xl:tracking-[0.18em]";

const activeTabClass =
  "bg-cyan-300 text-[#06111d] shadow-[0_0_26px_rgba(34,211,238,0.26)]";

const inactiveTabClass =
  "border border-white/10 bg-white/[0.04] text-white/65 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white";

const defaultSports: SportOption[] = [
  {
    key: "jet-ski",
    label: "Jet Ski",
    href: "/scores/aqua",
    enabled: true,
  },
];

const defaultMobileSections: MobileSectionOption[] = [
  {
    key: "events",
    label: "Events",
    targetId: "schedule-section",
  },
  {
    key: "stats",
    label: "Stats",
    targetId: "rankings-section",
  },
  {
    key: "calendar",
    label: "Calendar",
    targetId: "events-calendar-section",
  },
  {
    key: "sponsors",
    label: "Sponsors",
    targetId: "sponsors-section",
  },
];

function scrollToSection(targetId: string) {
  const el = document.getElementById(targetId);
  if (!el) return;

  const offset = 92;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: y,
    behavior: "smooth",
  });
}

export default function PublicTopNav({
  activeTab = "home",
  sticky = true,
  homeHref = "/",
  sports = defaultSports,
  selectedSportKey = "jet-ski",
  onSportChange,
  mobileSections = defaultMobileSections,
}: PublicTopNavProps) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const [sportsOpen, setSportsOpen] = React.useState(false);
  const [mobileSectionsOpen, setMobileSectionsOpen] = React.useState(false);
  const [activeMobileSection, setActiveMobileSection] =
    React.useState<MobileSectionOption>(mobileSections[0]);

  const selectedSport =
    sports.find((sport) => sport.key === selectedSportKey) ?? sports[0];

  const handleLogin = () => {
    window.location.href = `/auth?next=${encodeURIComponent(location)}`;
  };

  const handleLogout = async () => {
    await logout("/auth");
  };

  const handleClubsClick = () => {
    if (isAuthenticated) {
      navigate("/clubs");
      return;
    }

    window.location.href = `/auth?next=${encodeURIComponent("/clubs")}`;
  };

  const handleSportSelect = (sport: SportOption) => {
    setSportsOpen(false);

    if (onSportChange) {
      onSportChange(sport);
      return;
    }

    if (sport.enabled === false) return;
    if (sport.href) navigate(sport.href);
  };

  const handleMobileSectionSelect = (section: MobileSectionOption) => {
    setActiveMobileSection(section);
    setMobileSectionsOpen(false);

    const el = document.getElementById(section.targetId);
    if (!el) return;

    const offset = 92;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  };

  React.useEffect(() => {
    const onDocClick = () => {
      setSportsOpen(false);
      setMobileSectionsOpen(false);
    };

    if (sportsOpen || mobileSectionsOpen) {
      document.addEventListener("click", onDocClick);
    }

    return () => document.removeEventListener("click", onDocClick);
  }, [sportsOpen, mobileSectionsOpen]);

  const navItems: Array<{
    key: NavTabKey;
    label: string;
    targetId: string;
  }> = [
    { key: "home", label: "Home", targetId: "home-section" },
    { key: "events", label: "Events", targetId: "schedule-section" },
    { key: "stats", label: "Stats", targetId: "rankings-section" },
    { key: "calendar", label: "Calendar", targetId: "events-calendar-section" },
    { key: "sponsors", label: "Sponsors", targetId: "sponsors-section" },
  ];

  return (
    <header
      className={[
        "z-40 min-w-0 max-w-full overflow-visible border-b border-cyan-300/10 bg-[#030913]/90 backdrop-blur-xl",
        "shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
        sticky ? "sticky top-0" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(34,211,238,0.45)_45%,rgba(255,107,53,0.35)_70%,transparent_100%)]" />

      <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <Link href={homeHref}>
          <div className="group flex min-w-0 shrink-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] shadow-[0_0_28px_rgba(34,211,238,0.08)] transition duration-200 group-hover:border-cyan-300/30 group-hover:bg-cyan-300/[0.1]">
              <img
                src={logoPath}
                alt="Corner League"
                className="h-6 w-auto cursor-pointer"
              />
            </div>

            <div className="hidden min-w-0 sm:block">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white">
                Corner League
              </div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/55">
                Sports
              </div>
            </div>
          </div>
        </Link>

        <nav className="hidden min-w-0 items-center gap-2 md:flex">
          {navItems.map((item) => {
            const className = `${tabBase} ${
              activeTab === item.key ? activeTabClass : inactiveTabClass
            }`;

            return (
              <button
                type="button"
                key={item.key}
                onClick={() => scrollToSection(item.targetId)}
                className={className}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-0 shrink items-center justify-end gap-2 sm:gap-3">
          <div className="relative min-w-0 md:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMobileSectionsOpen((prev) => !prev);
              }}
              className="inline-flex h-11 max-w-[154px] items-center gap-2 overflow-hidden rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.12)] transition duration-200 hover:border-cyan-300/35 hover:bg-cyan-300/15 sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
            >
              <span className="block min-w-0 truncate">
                {activeMobileSection?.label ?? "Events"}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${
                  mobileSectionsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mobileSectionsOpen && (
              <div
                className="absolute right-0 z-50 mt-3 w-[min(82vw,260px)] overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111F]/95 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {mobileSections.map((section) => {
                  const isSelected = section.key === activeMobileSection?.key;

                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => handleMobileSectionSelect(section)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                        isSelected
                          ? "bg-cyan-300/10 text-cyan-100"
                          : "text-white/75 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="min-w-0 truncate uppercase tracking-[0.12em]">
                        {section.label}
                      </span>

                      {isSelected ? (
                        <Check className="h-4 w-4 shrink-0 text-cyan-200" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative hidden min-w-0 md:block">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSportsOpen((prev) => !prev);
              }}
              className="inline-flex h-11 max-w-[138px] items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.05] px-3 text-[11px] font-black uppercase tracking-[0.14em] text-white transition duration-200 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-50 sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
            >
              <span className="block min-w-0 truncate">
                {selectedSport?.label ?? "Select Sport"}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${
                  sportsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {sportsOpen && (
              <div
                className="absolute right-0 z-50 mt-3 w-[min(82vw,260px)] overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111F]/95 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {sports.map((sport) => {
                  const isSelected = sport.key === selectedSport?.key;
                  const isDisabled = sport.enabled === false;

                  return (
                    <button
                      key={sport.key}
                      type="button"
                      onClick={() => handleSportSelect(sport)}
                      disabled={isDisabled}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                        isDisabled
                          ? "cursor-not-allowed text-white/25"
                          : isSelected
                            ? "bg-cyan-300/10 text-cyan-100"
                            : "text-white/75 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="min-w-0 truncate uppercase tracking-[0.12em]">
                        {sport.label}
                      </span>

                      {isSelected ? (
                        <Check className="h-4 w-4 shrink-0 text-cyan-200" />
                      ) : isDisabled ? (
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/30">
                          Soon
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="h-11 max-w-[112px] shrink-0 overflow-hidden rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#FFB199] transition duration-200 hover:border-[#FF7849]/40 hover:bg-[#FF6B35]/20 hover:text-white sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
            >
              <span className="block truncate">Logout</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="h-11 max-w-[112px] shrink-0 overflow-hidden rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#FFB199] transition duration-200 hover:border-[#FF7849]/40 hover:bg-[#FF6B35]/20 hover:text-white sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
            >
              <span className="block truncate">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
