// src/components/sidebarPanel.tsx
import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { logout } from "@/lib/logout";
import {
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  Gamepad2,
  Home,
  LogIn,
  LogOut,
  Map,
  MessageSquare,
  Mic2,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  Vote,
  Wifi,
} from "lucide-react";

export type SidebarItem = {
  key: string;
  label: string;
  selectable?: boolean;
  onSelect?: () => void;
  matchPaths?: string[];
  disabled?: boolean;
  helper?: string;
  badge?: string;
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

export function useAppSidebarSections(opts?: {
  extra?: SidebarSection[];
  onLogout?: () => void;
  isSuperAdmin?: boolean;
  guestMode?: boolean;
}) {
  const [, navigate] = useLocation();

  const goToAuth = () => {
    const next = encodeURIComponent(
      `${window.location.pathname}${window.location.search}`,
    );

    navigate(`/auth?next=${next}`);
  };

  return useMemo<SidebarSection[]>(() => {
    const guest = !!opts?.guestMode;

    const base: SidebarSection[] = [
      ...(opts?.isSuperAdmin && !guest
        ? [
            {
              title: "Admin",
              items: [
                {
                  key: "admin-athlete-claims",
                  label: "Athlete Claims",
                  selectable: false,
                  matchPaths: ["/admin/athlete-claims"],
                  onSelect: () => navigate("/admin/athlete-claims"),
                },
                {
                  key: "admin-create-racer",
                  label: "Create Racer",
                  selectable: false,
                  matchPaths: ["/admin/create-racer"],
                  onSelect: () => navigate("/admin/create-racer"),
                },
                {
                  key: "admin-create-organization",
                  label: "Create Organization",
                  selectable: false,
                  matchPaths: ["/admin/create-organization"],
                  onSelect: () => navigate("/admin/create-organization"),
                },
                {
                  key: "admin-event-list",
                  label: "Event List",
                  selectable: false,
                  matchPaths: [
                    "/organization/event-list",
                    "/events/create",
                    "/organization/events/*",
                  ],
                  onSelect: () => navigate("/organization/event-list"),
                },
                {
                  key: "admin-rankings",
                  label: "Rankings Dashboard",
                  selectable: false,
                  matchPaths: ["/admin/rankings"],
                  onSelect: () => navigate("/admin/rankings"),
                },
                {
                  key: "admin-polls",
                  label: "Polls Console",
                  selectable: false,
                  matchPaths: ["/admin/polls"],
                  onSelect: () => navigate("/admin/polls"),
                },
                {
                  key: "admin-racepods",
                  label: "RacePods",
                  selectable: false,
                  matchPaths: ["/admin/racepods"],
                  onSelect: () => navigate("/admin/racepods"),
                },
              ],
            },
          ]
        : []),

      {
        title: "Explore",
        items: [
          {
            key: "home",
            label: "Home",
            selectable: false,
            matchPaths: ["/"],
            onSelect: () => navigate("/"),
          },
          {
            key: "racing-hub",
            label: "Racing Hub",
            selectable: false,
            matchPaths: ["/scores", "/scores/aqua"],
            onSelect: () => navigate("/scores/aqua"),
          },
          {
            key: "race-registration",
            label: "Race Registration",
            selectable: false,
            badge: "New",
            matchPaths: ["/registration", "/registration/*"],
            onSelect: () => navigate("/registration"),
          },
          {
            key: "search-racers",
            label: "Search Racers",
            selectable: false,
            matchPaths: ["/racer/*"],
            onSelect: () => {
              window.dispatchEvent(new CustomEvent("racer-search:open"));
            },
          },
          {
            key: "race-organizations",
            label: "Race Organizations",
            selectable: false,
            matchPaths: ["/aqua-organizations", "/aqua-organizations/*"],
            onSelect: () => navigate("/aqua-organizations"),
          },
          {
            key: "event-map",
            label: "Event Map",
            selectable: false,
            matchPaths: ["/event-map"],
            onSelect: () => navigate("/event-map"),
          },
          {
            key: "podcast-episodes",
            label: "Podcast Episodes",
            selectable: false,
            matchPaths: ["/podcast-episodes"],
            onSelect: () => navigate("/podcast-episodes"),
          },
          {
            key: "top-trends",
            label: "Top Trends",
            selectable: false,
            matchPaths: ["/top-trends"],
            onSelect: () => navigate("/top-trends"),
          },
          {
            key: "polls",
            label: "Polls",
            selectable: false,
            matchPaths: ["/polls", "/polls/*"],
            onSelect: () => navigate("/polls"),
          },
          {
            key: "arcade",
            label: "Arcade",
            selectable: false,
            matchPaths: ["/arcade"],
            onSelect: () => navigate("/arcade"),
          },
        ],
      },
    ];

    return opts?.extra?.length ? [...base, ...opts.extra] : base;
  }, [
    navigate,
    opts?.extra,
    opts?.onLogout,
    opts?.isSuperAdmin,
    opts?.guestMode,
  ]);
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activeKey: string;
  onChange: (key: string) => void;
  sections: SidebarSection[];
  logoSrc?: string;
  backHref?: string;
  logoAlt?: string;
  onGuestPrompt?: () => void;
  showSignIn?: boolean;
  signInHref?: string;

  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

type SidebarTooltipState = {
  label: string;
  badge?: string;
  left: number;
  top: number;
} | null;

function Chevron({ open }: { open: boolean }) {
  return (
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
  );
}

function getSidebarItemIcon(key: string) {
  switch (key) {
    case "home":
      return Home;

    case "racing-hub":
      return Trophy;

    case "race-registration":
    case "admin-event-list":
      return CalendarDays;

    case "search-racers":
      return Search;

    case "race-organizations":
    case "admin-create-organization":
      return Building2;

    case "event-map":
      return Map;

    case "podcast-episodes":
      return Mic2;

    case "top-trends":
    case "admin-rankings":
      return ChartNoAxesCombined;

    case "polls":
    case "admin-polls":
      return Vote;

    case "arcade":
      return Gamepad2;

    case "admin-athlete-claims":
      return ShieldCheck;

    case "admin-create-racer":
      return UserPlus;

    case "admin-racepods":

    case "racepod":
      return Wifi;

    case "messages":
      return MessageSquare;

    case "alerts":
      return Bell;

    case "feed":
      return Radio;

    case "my":
    case "discover":
      return Users;

    default:
      return CircleUserRound;
  }
}

export default function SidebarPanel({
  isOpen,
  onClose,
  activeKey,
  onChange,
  sections,
  logoSrc,
  backHref = "/",
  logoAlt = "Corner League",
  onGuestPrompt,
  showSignIn = false,
  signInHref = "/auth",
  collapsed = false,
  onCollapsedChange,
}: Props) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [location] = useLocation();

  const [isDesktop, setIsDesktop] = useState(false);

  const [renderCollapsed, setRenderCollapsed] = useState(false);

  const [tooltip, setTooltip] = useState<SidebarTooltipState>(null);

  const collapseTimerRef = useRef<number | null>(null);

  void showSignIn;
  void signInHref;

  const effectiveCollapsed = isDesktop && collapsed;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const updateDesktopState = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateDesktopState();

    mediaQuery.addEventListener("change", updateDesktopState);

    return () => {
      mediaQuery.removeEventListener("change", updateDesktopState);
    };
  }, []);

  useEffect(() => {
    if (collapseTimerRef.current) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }

    if (!effectiveCollapsed) {
      setRenderCollapsed(false);
      setTooltip(null);
      return;
    }

    collapseTimerRef.current = window.setTimeout(() => {
      setRenderCollapsed(true);
    }, 70);

    return () => {
      if (collapseTimerRef.current) {
        window.clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
    };
  }, [effectiveCollapsed]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow || "";
    };
  }, [isOpen]);

  useEffect(() => {
    const next: Record<string, boolean> = {};

    for (const section of sections) {
      next[section.title] = section.items.some(
        (item) => item.key === activeKey || isRouteMatch(item),
      );
    }

    setOpenMap(next);
  }, [sections, activeKey, location]);

  useEffect(() => {
    setTooltip(null);
  }, [location, effectiveCollapsed, isOpen]);

  const toggleSection = (title: string) => {
    setOpenMap((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  function isRouteMatch(item: SidebarItem) {
    if (!item.matchPaths?.length) {
      return false;
    }

    return item.matchPaths.some((path) => {
      if (path.endsWith("*")) {
        const prefix = path.slice(0, -1);
        return location.startsWith(prefix);
      }

      return location === path;
    });
  }

  function selectItem(item: SidebarItem) {
    setTooltip(null);

    if (item.disabled) {
      onGuestPrompt?.();
      onClose();
      return;
    }

    item.onSelect?.();

    if (item.selectable !== false) {
      onChange(item.key);
    }

    onClose();
  }

  function showItemTooltip(
    event: MouseEvent<HTMLButtonElement>,
    item: SidebarItem,
  ) {
    if (!renderCollapsed || !isDesktop) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setTooltip({
      label: item.label,
      badge: item.badge,
      left: rect.right + 12,
      top: rect.top + rect.height / 2,
    });
  }

  function showHomeTooltip(event: MouseEvent<HTMLButtonElement>) {
    if (!renderCollapsed || !isDesktop) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setTooltip({
      label: "Go to Home",
      left: rect.right + 12,
      top: rect.top + rect.height / 2,
    });
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-[990] bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-[1000] flex h-dvh flex-col border-r border-cyan-300/10 bg-[#030913] shadow-[0_30px_90px_rgba(0,0,0,0.55)] transition-[width,transform] duration-150 ease-out ${
          effectiveCollapsed ? "md:w-[88px]" : "md:w-72"
        } w-[86vw] max-w-[330px] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />

          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>

        <header
          className={`relative z-20 shrink-0 overflow-hidden border-b border-cyan-300/10 bg-[#030913]/95 backdrop-blur-xl ${
            renderCollapsed ? "p-3" : "p-4"
          }`}
        >
          <div
            className={`flex items-center ${
              renderCollapsed
                ? "flex-col justify-center gap-3"
                : "justify-between gap-3 pl-16 md:pl-0"
            }`}
          >
            <Link href={backHref}>
              <button
                type="button"
                onClick={onClose}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.1]"
                aria-label="Go home"
              >
                {logoSrc ? (
                  <img src={logoSrc} alt={logoAlt} className="h-7 w-auto" />
                ) : (
                  <span className="text-sm font-black text-white">CL</span>
                )}
              </button>
            </Link>

            {!renderCollapsed ? (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-black uppercase tracking-[0.22em] text-white">
                  Corner League
                </div>

                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/55">
                  Sports
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setTooltip(null);
                onCollapsedChange?.(!effectiveCollapsed);
              }}
              className="hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100 md:grid"
              aria-label={
                effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {effectiveCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        <div
          className={`relative z-10 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20 ${
            renderCollapsed ? "px-2 py-3" : "p-4"
          }`}
        >
          {sections.map((section) => {
            const open = renderCollapsed ? true : !!openMap[section.title];

            return (
              <section
                className={renderCollapsed ? "mb-4" : "mb-2"}
                key={section.title}
              >
                {!renderCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/70 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.06] hover:text-white"
                    aria-expanded={open}
                  >
                    <span>{section.title}</span>
                    <Chevron open={open} />
                  </button>
                ) : (
                  <div
                    className="mx-auto mb-2 h-px w-8 bg-white/10"
                    aria-hidden="true"
                  />
                )}

                {open ? (
                  <div
                    className={
                      renderCollapsed ? "space-y-2" : "mt-2 space-y-1 pl-1"
                    }
                  >
                    {section.items.map((item) => {
                      const ItemIcon = getSidebarItemIcon(item.key);

                      const isActive =
                        !item.disabled &&
                        (item.key === activeKey ||
                          (!activeKey && isRouteMatch(item)));

                      if (renderCollapsed) {
                        return (
                          <div key={item.key} className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => selectItem(item)}
                              onMouseEnter={(event) =>
                                showItemTooltip(event, item)
                              }
                              onMouseLeave={() => setTooltip(null)}
                              onFocus={(event) =>
                                showItemTooltip(
                                  event as unknown as MouseEvent<HTMLButtonElement>,
                                  item,
                                )
                              }
                              onBlur={() => setTooltip(null)}
                              aria-label={item.label}
                              disabled={item.disabled}
                              className={`relative grid h-12 w-12 place-items-center rounded-2xl border transition ${
                                item.disabled
                                  ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/20"
                                  : isActive
                                    ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                                    : "border-transparent bg-transparent text-white/45 hover:border-cyan-300/15 hover:bg-cyan-300/[0.07] hover:text-white"
                              }`}
                            >
                              <ItemIcon className="h-5 w-5" />

                              {item.badge ? (
                                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#030913] bg-[#FF6B35]" />
                              ) : null}
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => selectItem(item)}
                          disabled={item.disabled}
                          className={`group w-full rounded-2xl border px-3 py-3 text-left transition ${
                            item.disabled
                              ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25"
                              : isActive
                                ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                                : "border-transparent bg-transparent text-white/55 hover:border-cyan-300/15 hover:bg-cyan-300/[0.06] hover:text-white"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <ItemIcon className="h-4 w-4 shrink-0 text-current opacity-75" />

                            <span className="min-w-0 flex-1 break-words text-sm font-bold">
                              {item.label}
                            </span>

                            {item.badge ? (
                              <span className="shrink-0 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#FFB199]">
                                {item.badge}
                              </span>
                            ) : null}
                          </div>

                          {item.helper ? (
                            <div className="mt-1 pl-7 text-xs leading-5 text-white/35">
                              {item.helper}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <footer
          className={`relative z-20 shrink-0 overflow-hidden border-t border-cyan-300/10 bg-[#030913]/95 backdrop-blur-xl ${
            renderCollapsed
              ? "p-3"
              : "p-4 pb-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-4"
          }`}
        >
          {renderCollapsed ? (
            <div className="flex justify-center">
              <Link href="/">
                <button
                  type="button"
                  onClick={onClose}
                  onMouseEnter={showHomeTooltip}
                  onMouseLeave={() => setTooltip(null)}
                  aria-label="Go to Home"
                  className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 transition hover:bg-cyan-300 hover:text-[#06111d]"
                >
                  <Home className="h-5 w-5" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <Link href="/">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-300 hover:text-[#06111d]"
                >
                  ← Go to Home
                </button>
              </Link>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/55">
                  Corner League Sports
                </div>

                <div className="mt-1 text-xs leading-5 text-white/35">
                  Jet ski racing results, rankings, events, and athlete
                  profiles.
                </div>
              </div>
            </div>
          )}
        </footer>
      </aside>

      {tooltip && renderCollapsed && isDesktop ? (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[200] -translate-y-1/2 whitespace-nowrap rounded-xl border border-cyan-300/15 bg-[#07111F] px-3 py-2.5 text-xs font-bold text-white shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
          style={{
            left: tooltip.left,
            top: tooltip.top,
          }}
        >
          <span>{tooltip.label}</span>

          {tooltip.badge ? (
            <span className="ml-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#FFB199]">
              {tooltip.badge}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
