import {
  useUnreadNotifications,
  NotificationCount,
} from "@/components/community/NotificationCount";
import React from "react";
import { useSportSelection } from "@/hooks/useSportSelection";
import MyRacerProfileLink from "@/components/MyRacerProfileLink";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/logout";
import {
  Bell,
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
  selectedSportKey?: string;
  onSportChange?: (sport: SportOption) => void;
};

const tabBase =
  "rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] transition duration-200 xl:px-5 xl:py-3 xl:text-xs xl:tracking-[0.18em]";

const activeTabClass = "bg-cl-accent text-cl-contrast shadow-cl-panel";

const inactiveTabClass =
  "border border-cl-border bg-cl-subtle text-cl-muted hover:border-cl-accent/25 hover:bg-cl-accent/10 hover:text-cl-ink";

function scrollToSection(targetId: string) {
  const element = document.getElementById(targetId);

  if (!element) {
    return;
  }

  const offset = 92;
  const y = element.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: y,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}

export default function PublicTopNav({
  activeTab = "home",
  sticky = true,
  selectedSportKey,
  onSportChange,
}: PublicTopNavProps) {
  const { user, isAuthenticated } = useAuth();
  const {
    sports,
    sport: activeSport,
    selectSport,
    isJetSki,
  } = useSportSelection();
  const notifications = useUnreadNotifications();
  const [location, navigate] = useLocation();

  const [sportsOpen, setSportsOpen] = React.useState(false);

  const [accountOpen, setAccountOpen] = React.useState(false);

  const sportsRef = React.useRef<HTMLDivElement | null>(null);

  const accountRef = React.useRef<HTMLDivElement | null>(null);
  const sportsId = React.useId();
  const accountId = React.useId();

  const isLandingPage = location === "/";

  const selectedSport = selectedSportKey
    ? sports.find((sport) => sport.key === selectedSportKey)
    : activeSport;

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

    selectSport(sport.key);

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
      if (event.key !== "Escape") return;
      for (const ref of [sportsRef, accountRef]) {
        const trigger = ref.current?.querySelector<HTMLButtonElement>(
          "button[aria-expanded='true']",
        );
        if (trigger && ref.current?.contains(document.activeElement)) {
          event.preventDefault();
          trigger.focus();
        }
      }
      closeMenus();
    }
    // Natural Tab navigation closes the disclosure after focus leaves it.
    function handleFocusIn(event: FocusEvent) {
      const target = event.target as Node;
      if (!sportsRef.current?.contains(target)) setSportsOpen(false);
      if (!accountRef.current?.contains(target)) setAccountOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    closeMenus();
  }, [location]);

  return (
    <header
      className={[
        "cl-dark relative z-[100] min-w-0 max-w-full overflow-visible",
        "border-b border-cl-accent/10 bg-cl-canvas backdrop-blur-xl",
        "shadow-cl-panel",
        sticky ? "consumer-public-nav-safe sticky top-0" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-cl-accent/30" />

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

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cl-accent/15 bg-cl-accent/[0.06]">
          <img
            src={cornerLeagueLogo}
            alt="Corner League"
            className="h-6 w-auto"
          />
        </span>

        <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3">
          {sports.length > 0 && (
            <div ref={sportsRef} className="relative min-w-0">
              <button
                type="button"
                aria-controls={sportsOpen ? sportsId : undefined}
                aria-expanded={sportsOpen}
                onClick={() => {
                  setAccountOpen(false);

                  setSportsOpen((current) => !current);
                }}
                className="inline-flex h-11 max-w-[126px] items-center gap-2 overflow-hidden rounded-full border border-cl-border bg-cl-subtle px-3 text-[10px] font-black uppercase tracking-[0.12em] text-cl-ink transition duration-200 hover:border-cl-accent/25 hover:bg-cl-accent/10 hover:text-cl-accent sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
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
                  id={sportsId}
                  className="absolute right-0 z-[250] mt-3 w-[min(82vw,260px)] overflow-hidden rounded-2xl border border-cl-accent/10 bg-cl-surface shadow-cl-panel backdrop-blur-xl"
                >
                  {sports.map((sport) => {
                    const selected = sport.key === selectedSport?.key;

                    const disabled = sport.enabled === false;

                    return (
                      <button
                        key={sport.key}
                        type="button"
                        aria-pressed={selected}
                        disabled={disabled}
                        onClick={() => handleSportSelect(sport)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                          disabled
                            ? "cursor-not-allowed text-cl-muted"
                            : selected
                              ? "bg-cl-accent/10 text-cl-accent"
                              : "text-cl-muted hover:bg-cl-subtle hover:text-cl-ink"
                        }`}
                      >
                        <span className="min-w-0 truncate uppercase tracking-[0.12em]">
                          {sport.label}
                        </span>

                        {selected ? (
                          <Check className="h-4 w-4 shrink-0 text-cl-accent" />
                        ) : disabled ? (
                          <span className="rounded-full border border-cl-border bg-cl-subtle px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-cl-muted">
                            Soon
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
          {isAuthenticated ? (
            <div ref={accountRef} className="relative min-w-0">
              <button
                type="button"
                aria-controls={accountOpen ? accountId : undefined}
                aria-expanded={accountOpen}
                onClick={() => {
                  setSportsOpen(false);

                  setAccountOpen((current) => !current);
                }}
                className="inline-flex h-11 max-w-[126px] items-center gap-2 overflow-hidden rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-cl-accent transition duration-200 hover:border-cl-accent/40 hover:bg-cl-accent/20 hover:text-cl-ink sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
              >
                <span className="block min-w-0 truncate">Account</span>
                <NotificationCount count={notifications.data?.unreadCount} />

                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    accountOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {accountOpen ? (
                <div
                  id={accountId}
                  className="absolute right-0 z-[250] mt-3 w-[min(88vw,290px)] overflow-hidden rounded-[22px] border border-cl-accent/25 bg-cl-surface p-2 shadow-cl-panel ring-1 ring-black/40"
                >
                  <div className="mb-2 flex items-center gap-3 rounded-[16px] border border-emerald-300/10 bg-emerald-300/[0.055] px-3 py-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-300/15 bg-emerald-300/10 text-emerald-200">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200">
                        Signed in
                      </p>

                      <p className="mt-1 truncate text-xs text-cl-muted">
                        {(user as any)?.email || username || "Account active"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateFromAccount(profileHref)}
                    className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-cl-muted transition hover:bg-cl-subtle hover:text-cl-ink"
                  >
                    <CircleUserRound className="h-4 w-4 shrink-0 text-cl-accent" />
                    Your Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateFromAccount("/notifications")}
                    className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-cl-muted transition hover:bg-cl-subtle hover:text-cl-ink"
                  >
                    <Bell className="h-4 w-4 shrink-0 text-cl-accent" />
                    <span>Notifications</span>
                    <span className="ml-auto">
                      <NotificationCount
                        count={notifications.data?.unreadCount}
                      />
                    </span>
                  </button>
                  <MyRacerProfileLink onNavigate={navigateFromAccount} />

                  {isJetSki && (
                    <button
                      type="button"
                      onClick={() => navigateFromAccount("/racepod")}
                      className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-cl-muted transition hover:bg-cl-subtle hover:text-cl-ink"
                    >
                      <Wifi className="h-4 w-4 shrink-0 text-cl-accent" />
                      RacePod
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigateFromAccount("/settings")}
                    className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-cl-muted transition hover:bg-cl-subtle hover:text-cl-ink"
                  >
                    <Settings className="h-4 w-4 shrink-0 text-cl-accent" />
                    Account Settings
                  </button>

                  <div className="my-2 h-px bg-cl-subtle" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-bold text-cl-accent transition hover:bg-cl-accent/10 hover:text-cl-ink"
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
              className="inline-flex h-11 max-w-[126px] items-center justify-center overflow-hidden rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-cl-accent transition duration-200 hover:border-cl-accent/40 hover:bg-cl-accent/20 hover:text-cl-ink sm:max-w-none sm:px-4 sm:text-xs sm:tracking-[0.18em]"
            >
              <span className="block truncate">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
