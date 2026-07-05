// src/components/sidebarPanel.tsx
import { Link, useLocation } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { logout } from "@/lib/logout";

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
            key: "racing-hub",
            label: "Racing Hub",
            selectable: false,
            matchPaths: ["/scores", "/scores/aqua"],
            onSelect: () => navigate("/scores/aqua"),
          },
          // {
          //   key: "featured-races",
          //   label: "Featured Races",
          //   selectable: false,
          //   matchPaths: [],
          //   onSelect: () => navigate("/scores/aqua"),
          // },
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
        ],
      },

      {
        title: guest ? "Access" : "Account",
        items: guest
          ? [
              {
                key: "signin",
                label: "Sign in to access",
                selectable: false,
                badge: "Required",
                onSelect: goToAuth,
              },
              {
                key: "your-profile",
                label: "Your profile",
                selectable: false,
                disabled: true,
                helper: "Sign in required",
              },
            ]
          : [
              {
                key: "signed-in",
                label: "Signed in ✓",
                selectable: false,
                helper: "Account active",
              },
              {
                key: "your-profile",
                label: "Your profile",
                selectable: false,
                matchPaths: ["/profile", "/profile/*"],
                onSelect: () => navigate("/profile"),
              },
              {
                key: "racepod",
                label: "RacePod",
                selectable: false,
                matchPaths: ["/racepod", "/racepod/*"],
                onSelect: () => navigate("/racepod"),
              },
              {
                key: "account",
                label: "Account Settings",
                selectable: false,
                matchPaths: ["/settings"],
                onSelect: () => navigate("/settings"),
              },
              {
                key: "logout",
                label: "Logout",
                selectable: false,
                onSelect: () =>
                  opts?.onLogout ? opts.onLogout() : void logout("/auth"),
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
};

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
}: Props) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [location] = useLocation();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isOpen]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const s of sections) {
      next[s.title] = s.items.some(
        (it) => it.key === activeKey || isRouteMatch(it),
      );
    }
    setOpenMap(next);
  }, [sections, activeKey, location]);

  const toggleSection = (title: string) =>
    setOpenMap((m) => ({ ...m, [title]: !m[title] }));

  function isRouteMatch(item: SidebarItem) {
    if (!item.matchPaths?.length) return false;
    return item.matchPaths.some((path) => {
      if (path.endsWith("*")) {
        const prefix = path.slice(0, -1);
        return location.startsWith(prefix);
      }
      return location === path;
    });
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[86vw] max-w-[330px] flex-col overflow-hidden border-r border-cyan-300/10 bg-[#030913] shadow-[0_30px_90px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-in-out md:w-72 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } overscroll-contain`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>
        <div className="sticky top-0 z-10 border-b border-cyan-300/10 bg-[#030913]/90 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Link href={backHref}>
              <button
                type="button"
                onClick={onClose}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.1]"
                aria-label="Go home"
              >
                {logoSrc ? (
                  <img src={logoSrc} alt={logoAlt} className="h-7 w-auto" />
                ) : (
                  <span className="text-sm font-black text-white">CL</span>
                )}
              </button>
            </Link>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-black uppercase tracking-[0.22em] text-white">
                Corner League
              </div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/55">
                Sports
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/65 transition hover:border-[#FF6B35]/25 hover:bg-[#FF6B35]/10 hover:text-white md:hidden"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-300/20">
          {sections.map((section) => {
            const open = !!openMap[section.title];
            return (
              <div className="mb-2" key={section.title}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/70 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.06] hover:text-white"
                  aria-expanded={open}
                >
                  <span>{section.title}</span>
                  <Chevron open={open} />
                </button>

                {open && (
                  <div className="mt-2 space-y-1 pl-1">
                    {section.items.map((item) => {
                      const isActive =
                        !item.disabled &&
                        (item.key === activeKey ||
                          (!activeKey && isRouteMatch(item)));

                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            if (item.disabled) {
                              onGuestPrompt?.();
                              onClose();
                              return;
                            }

                            item.onSelect?.();
                            if (item.selectable !== false) onChange(item.key);
                            onClose();
                          }}
                          className={`group w-full rounded-2xl border px-3 py-3 text-left transition ${
                            item.disabled
                              ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25"
                              : isActive
                                ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                                : "border-transparent bg-transparent text-white/55 hover:border-cyan-300/15 hover:bg-cyan-300/[0.06] hover:text-white"
                          }`}
                        >
                          <div className="flex min-w-0 items-center justify-between gap-3">
                            <span className="min-w-0 break-words text-sm font-bold">
                              {item.label}
                            </span>

                            {item.badge ? (
                              <span className="shrink-0 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#FFB199]">
                                {item.badge}
                              </span>
                            ) : null}
                          </div>

                          {item.helper ? (
                            <div className="mt-1 text-xs leading-5 text-white/35">
                              {item.helper}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative z-10 border-t border-cyan-300/10 bg-[#030913]/90 p-4 pb-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] backdrop-blur-xl md:pb-4">
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
                Jet ski racing results, rankings, events, and athlete profiles.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
