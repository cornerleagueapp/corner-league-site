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
              ],
            },
          ]
        : []),

      {
        title: "Profile",
        items: [
          { key: "profile", label: "Profile", disabled: guest },
          {
            key: "account",
            label: "Account Settings",
            selectable: false,
            disabled: guest,
            onSelect: () => navigate("/settings"),
          },
          {
            key: "logout",
            label: "Logout",
            selectable: false,
            disabled: guest,
            onSelect: () =>
              opts?.onLogout ? opts.onLogout() : void logout("/auth"),
          },
        ],
      },
      // {
      //   title: "Explore",
      //   items: [
      //     { key: "feed", label: "My Feed" },
      //     { key: "explore", label: "Explore Feed" },
      //   ],
      // },
      {
        title: "Live Scores",
        items: [{ key: "scores", label: "All Scores" }],
      },
      {
        title: "Clubs",
        items: [
          { key: "my", label: "My Clubs", disabled: guest },
          { key: "discover", label: "Discover Clubs", disabled: guest },
        ],
      },
      // {
      //   title: "Messages",
      //   items: [{ key: "messages", label: "Direct Messages" }],
      // },
      // {
      //   title: "Notifications",
      //   items: [{ key: "alerts", label: "My Alerts" }],
      // },
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
          className="fixed inset-0 z-30 bg-black/70 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[86vw] max-w-[320px] flex-col border-r border-gray-700 bg-[#000000] transition-transform duration-300 ease-in-out md:w-64 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } overscroll-contain`}
      >
        <div className="sticky top-0 z-10 border-b border-gray-700 bg-[#000000] p-4">
          <div className="flex items-center justify-center">
            {logoSrc ? (
              <img src={logoSrc} alt={logoAlt} className="h-8 w-auto" />
            ) : (
              <div className="h-8" />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sections.map((section) => {
            const open = !!openMap[section.title];
            return (
              <div className="mb-2" key={section.title}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-base font-semibold uppercase tracking-wider text-gray-100 hover:bg-white/5 hover:text-white"
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
                        (isRouteMatch(item) ||
                          (item.selectable !== false &&
                            activeKey === item.key));

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
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            item.disabled
                              ? "cursor-not-allowed text-gray-600 hover:bg-transparent"
                              : isActive
                                ? "bg-gray-800 font-medium text-white"
                                : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-100"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-700 bg-[#000000] p-4 pb-8 pb-[calc(env(safe-area-inset-bottom)+7.25rem)] md:pb-4">
          <div className="space-y-2 pb-2 md:pb-0">
            {showSignIn ? (
              <Link href={signInHref}>
                <button
                  onClick={onClose}
                  className="w-full rounded-md border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-left text-cyan-200 transition-colors hover:bg-cyan-400/15 hover:text-white"
                >
                  Sign In
                </button>
              </Link>
            ) : null}

            <Link href={backHref}>
              <button
                onClick={onClose}
                className="w-full rounded-md px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                ← Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
