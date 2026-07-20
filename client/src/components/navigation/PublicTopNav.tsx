import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/logout";
import {
  Check,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Settings,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import cornerLeagueLogo from "@assets/CL_Logo.png";

type NavTabKey = "home" | "events" | "stats" | "calendar" | "sponsors";

type SportOption = {
  key: string;
  label: string;
  href?: string;
  enabled?: boolean;
};

type PublicTopNavProps = {
  activeTab?: NavTabKey;
  sticky?: boolean;
  sports?: SportOption[];
  selectedSportKey?: string;
  onSportChange?: (sport: SportOption) => void;
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

function scrollToSection(targetId: string) {
  const element = document.getElementById(targetId);

  if (!element) {
    return;
  }

  const offset = 92;
  const y = element.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: y,
    behavior: "smooth",
  });
}

export default function PublicTopNav({
  activeTab = "home",
  sticky = true,
  sports = defaultSports,
  selectedSportKey = "jet-ski",
  onSportChange,
}: PublicTopNavProps) {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  const [sportsOpen, setSportsOpen] = React.useState(false);

  const [accountOpen, setAccountOpen] = React.useState(false);

  const sportsRef = React.useRef<HTMLDivElement | null>(null);

  const accountRef = React.useRef<HTMLDivElement | null>(null);

  const isLandingPage = location === "/";

  const selectedSport =
    sports.find((sport) => sport.key === selectedSportKey) ?? sports[0];

  const username = String((user as any)?.username ?? "").trim();

  const profileHref = username
    ? `/profile/${encodeURIComponent(username)}`
    : "/profile";

  const navItems: Array<{
    key: NavTabKey;
    label: string;
    targetId: string;
  }> = [
    {
      key: "home",
      label: "Home",
      targetId: "home-section",
    },
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

  function closeMenus() {
    setSportsOpen(false);
    setAccountOpen(false);
  }

  function handleLogin() {
    const next = encodeURIComponent(`${location}${window.location.search}`);

    navigate(`/auth?next=${next}`);
  }

  async function handleLogout() {
    closeMenus();
    await logout("/auth");
  }

  function handleSportSelect(sport: SportOption) {
    setSportsOpen(false);

    if (sport.enabled === false) {
      return;
    }

    if (onSportChange) {
      onSportChange(sport);
      return;
    }

    if (sport.href) {
      navigate(sport.href);
    }
  }

  function navigateFromAccount(path: string) {
    setAccountOpen(false);
    navigate(path);
  }

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      const clickedSports = sportsRef.current?.contains(target);

      const clickedAccount = accountRef.current?.contains(target);

      if (!clickedSports) {
        setSportsOpen(false);
      }

      if (!clickedAccount) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    closeMenus();
  }, [location]);

  return (
    <header
      className={[
        "relative z-[100] min-w-0 max-w-full overflow-visible",
        "border-b border-cyan-300/10 bg-[#030913]/95 backdrop-blur-xl",
        "shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
        sticky ? "sticky top-0" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(34,211,238,0.45)_45%,rgba(255,107,53,0.35)_70%,transparent_100%)]" />

      <div className="flex min-h-[68px] w-full min-w-0 items-center px-3 py-3 pl-[76px] sm:px-5 sm:pl-[84px] md:px-6 md:pl-6 lg:px-8">
        {/* {isLandingPage ? (
          <nav className="hidden min-w-0 items-center gap-2 lg:flex">
            {navItems.map((item) => {
              const className = `${tabBase} ${
                activeTab === item.key ? activeTabClass : inactiveTabClass
              }`;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => scrollToSection(item.targetId)}
                  className={className}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : null} */}

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06]">
          <img
            src={cornerLeagueLogo}
            alt="Corner League"
            className="h-6 w-auto"
          />
        </span>

        <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3">
          <div ref={sportsRef} className="relative min-w-0">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={sportsOpen}
              onClick={() => {
                setAccountOpen(false);

                setSportsOpen((current) => !current);
              }}
              className="inline-flex h-11 max-w-[126px] items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.05] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white transition duration-200 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-50 sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
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

            {sportsOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-[250] mt-3 w-[min(82vw,260px)] overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111F]/98 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              >
                {sports.map((sport) => {
                  const selected = sport.key === selectedSport?.key;

                  const disabled = sport.enabled === false;

                  return (
                    <button
                      key={sport.key}
                      type="button"
                      role="menuitem"
                      disabled={disabled}
                      onClick={() => handleSportSelect(sport)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                        disabled
                          ? "cursor-not-allowed text-white/25"
                          : selected
                            ? "bg-cyan-300/10 text-cyan-100"
                            : "text-white/75 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="min-w-0 truncate uppercase tracking-[0.12em]">
                        {sport.label}
                      </span>

                      {selected ? (
                        <Check className="h-4 w-4 shrink-0 text-cyan-200" />
                      ) : disabled ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white/30">
                          Soon
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          {isAuthenticated ? (
            <div ref={accountRef} className="relative min-w-0">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => {
                  setSportsOpen(false);

                  setAccountOpen((current) => !current);
                }}
                className="inline-flex h-11 max-w-[126px] items-center gap-2 overflow-hidden rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#FFB199] transition duration-200 hover:border-[#FF7849]/40 hover:bg-[#FF6B35]/20 hover:text-white sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
              >
                <span className="block min-w-0 truncate">Account</span>

                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    accountOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {accountOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-[250] mt-3 w-[min(88vw,290px)] overflow-hidden rounded-[22px] border border-[#FF6B35]/25 bg-[#07111F] p-2 shadow-[0_28px_90px_rgba(0,0,0,0.85)] ring-1 ring-black/40"
                >
                  <div className="mb-2 flex items-center gap-3 rounded-[16px] border border-emerald-300/10 bg-emerald-300/[0.055] px-3 py-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-300/15 bg-emerald-300/10 text-emerald-200">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200">
                        Signed in
                      </p>

                      <p className="mt-1 truncate text-xs text-white/45">
                        {(user as any)?.email || username || "Account active"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => navigateFromAccount(profileHref)}
                    className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <CircleUserRound className="h-4 w-4 shrink-0 text-cyan-200" />
                    Your Profile
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => navigateFromAccount("/racepod")}
                    className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Wifi className="h-4 w-4 shrink-0 text-cyan-200" />
                    RacePod
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => navigateFromAccount("/settings")}
                    className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Settings className="h-4 w-4 shrink-0 text-cyan-200" />
                    Account Settings
                  </button>

                  <div className="my-2 h-px bg-white/10" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-[#FFB199] transition hover:bg-[#FF6B35]/10 hover:text-white"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="inline-flex h-11 max-w-[126px] items-center justify-center overflow-hidden rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#FFB199] transition duration-200 hover:border-[#FF7849]/40 hover:bg-[#FF6B35]/20 hover:text-white sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
            >
              <span className="block truncate">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
