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
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

export function useAppSidebarSections(opts?: {
  extra?: SidebarSection[];
  onLogout?: () => void;
  isSuperAdmin?: boolean;
}) {
  const [, navigate] = useLocation();

  return useMemo<SidebarSection[]>(() => {
    const base: SidebarSection[] = [
      ...(opts?.isSuperAdmin
        ? [
            {
              title: "Admin",
              items: [
                {
                  key: "admin-create-racer",
                  label: "Create Racer",
                  selectable: false,
                  matchPaths: ["/admin/create-racer"],
                  onSelect: () => navigate("/admin/create-racer"),
                },
                {
                  key: "admin-athlete-claims",
                  label: "Athlete Claims",
                  selectable: false,
                  matchPaths: ["/admin/athlete-claims"],
                  onSelect: () => navigate("/admin/athlete-claims"),
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
              ],
            },
          ]
        : []),

      {
        title: "Profile",
        items: [
          { key: "profile", label: "Profile" },
          {
            key: "account",
            label: "Account Settings",
            selectable: false,
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
          { key: "my", label: "My Clubs" },
          { key: "discover", label: "Discover Clubs" },
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
  }, [navigate, opts?.extra, opts?.onLogout, opts?.isSuperAdmin]);
}

type Props = {
  /** Mobile open/close */
  isOpen: boolean;
  onClose: () => void;

  /** Which tab is currently active (drives highlight) */
  activeKey: string;
  /** Called when a selectable item is clicked */
  onChange: (key: string) => void;

  /** Sections + items rendered in the panel */
  sections: SidebarSection[];

  /** Logo at the top of the panel */
  logoSrc?: string;
  /** Footer link */
  backHref?: string;
  /** ARIA label for logo image */
  logoAlt?: string;
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
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 z-30"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-700
              bg-[#000000] transition-transform duration-300 ease-in-out
              w-full h-screen md:relative md:w-64 md:h-auto md:translate-x-0
              ${isOpen ? "translate-x-0" : "-translate-x-full"}
              overscroll-contain`}
      >
        {/* Header / Logo */}
        <div className="p-4 border-b border-gray-700 sticky top-0 bg-[#000000] z-10">
          <div className="flex items-center justify-center">
            {logoSrc ? (
              <img src={logoSrc} alt={logoAlt} className="h-8 w-auto" />
            ) : (
              <div className="h-8" />
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 p-4 overflow-y-auto">
          {sections.map((section) => {
            const open = !!openMap[section.title];
            return (
              <div className="mb-2" key={section.title}>
                {/* Clickable section header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md
                    text-gray-100 hover:text-white hover:bg-white/5
                    uppercase tracking-wider text-base font-semibold"
                  aria-expanded={open}
                >
                  <span>{section.title}</span>
                  <Chevron open={open} />
                </button>

                {/* Items only when open */}
                {open && (
                  <div className="mt-2 space-y-1 pl-1">
                    {section.items.map((item) => {
                      const isActive =
                        isRouteMatch(item) ||
                        (item.selectable !== false && activeKey === item.key);
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            item.onSelect?.();
                            if (item.selectable !== false) onChange(item.key);
                            onClose();
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                            isActive
                              ? "bg-gray-800 text-white font-medium"
                              : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/60"
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
          <div className="mt-4 md:hidden">
            <Link href={backHref}>
              <button
                onClick={onClose}
                className="w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors text-left"
              >
                ← Back to Home
              </button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 hidden md:block">
          <Link href={backHref}>
            <button
              onClick={onClose}
              className="w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors text-left"
            >
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
