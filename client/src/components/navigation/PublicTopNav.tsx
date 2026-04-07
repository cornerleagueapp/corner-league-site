import React from "react";
import { Link, useLocation } from "wouter";
import logoPath from "@assets/CL_Logo.png";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/logout";
import { ChevronDown, Check } from "lucide-react";

type NavTabKey = "home" | "details" | "scores" | "clubs";

type SportOption = {
  key: string;
  label: string;
  href?: string;
  enabled?: boolean;
};

type PublicTopNavProps = {
  activeTab?: NavTabKey;
  sticky?: boolean;
  homeHref?: string;
  sports?: SportOption[];
  selectedSportKey?: string;
  onSportChange?: (sport: SportOption) => void;
};

const tabBase =
  "px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors";
const activeTabClass = "bg-white text-black";
const inactiveTabClass = "bg-white/10 text-white/70 hover:bg-white/15";

const defaultSports: SportOption[] = [
  {
    key: "jet-ski",
    label: "Jet Ski",
    href: "/scores/aqua",
    enabled: true,
  },
];

export default function PublicTopNav({
  activeTab = "home",
  sticky = true,
  homeHref = "/",
  sports = defaultSports,
  selectedSportKey = "jet-ski",
  onSportChange,
}: PublicTopNavProps) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const [sportsOpen, setSportsOpen] = React.useState(false);

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

  React.useEffect(() => {
    const onDocClick = () => setSportsOpen(false);
    if (sportsOpen) {
      document.addEventListener("click", onDocClick);
    }
    return () => document.removeEventListener("click", onDocClick);
  }, [sportsOpen]);

  const navItems: Array<{
    key: NavTabKey;
    label: string;
    href?: string;
    onClick?: () => void;
  }> = [
    { key: "home", label: "Home", href: "/" },
    { key: "details", label: "Details", href: "/home" },
    { key: "scores", label: "Scores", href: "/welcome" },
    { key: "clubs", label: "Clubs", onClick: handleClubsClick },
  ];

  return (
    <header
      className={[
        "z-40 border-b border-white/10 bg-black/90 backdrop-blur",
        sticky ? "sticky top-0" : "",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={homeHref}>
          <img
            src={logoPath}
            alt="Corner League"
            className="h-8 w-auto cursor-pointer"
          />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const className = `${tabBase} ${
              activeTab === item.key ? activeTabClass : inactiveTabClass
            }`;

            if (item.href) {
              return (
                <Link key={item.key} href={item.href}>
                  <button className={className}>{item.label}</button>
                </Link>
              );
            }

            return (
              <button
                key={item.key}
                onClick={item.onClick}
                className={className}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSportsOpen((prev) => !prev);
              }}
              className="inline-flex items-center gap-2 bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white/15"
            >
              <span>{selectedSport?.label ?? "Select Sport"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  sportsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {sportsOpen && (
              <div
                className="absolute right-0 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0f] shadow-2xl"
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
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                        isDisabled
                          ? "cursor-not-allowed text-white/25"
                          : isSelected
                            ? "bg-white/10 text-white"
                            : "text-white/75 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="uppercase tracking-[0.12em]">
                        {sport.label}
                      </span>

                      {isSelected ? (
                        <Check className="h-4 w-4" />
                      ) : isDisabled ? (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">
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
              onClick={handleLogout}
              className="bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white/15"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white/15"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
