import {
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Home,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";

export type RegistrationNavigationItem = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  protected?: boolean;
};

export const registrationNavigationItems: RegistrationNavigationItem[] = [
  {
    key: "registration-home",
    label: "Registration Home",
    description: "Browse featured races and registration activity.",
    href: "/registration",
    icon: Home,
  },
  {
    key: "registration-events",
    label: "Find Race Events",
    description: "Search upcoming events and available race classes.",
    href: "/registration/events",
    icon: CalendarDays,
  },
  {
    key: "registration-racers",
    label: "Registered Racers",
    description: "Search confirmed racers across public race entries.",
    href: "/registration/racers",
    icon: Users,
  },
  {
    key: "my-registrations",
    label: "My Registrations",
    description: "View registrations connected to your account.",
    href: "/registration/my-registrations",
    icon: ClipboardList,
    protected: true,
  },
];

function normalizePath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return path.replace(/\/+$/, "");
}

function isNavigationItemActive(
  currentLocation: string,
  item: RegistrationNavigationItem,
) {
  const current = normalizePath(currentLocation);
  const target = normalizePath(item.href);

  if (target === "/registration") {
    return current === target;
  }

  return current === target || current.startsWith(`${target}/`);
}

export default function RegistrationSidebar() {
  const [location, navigate] = useLocation();

  return (
    <aside className="hidden w-[292px] shrink-0 lg:block">
      <div className="sticky top-5 overflow-hidden rounded-[30px] border border-cl-accent/[0.14] bg-cl-canvas shadow-cl-panel">
        <div className="relative overflow-hidden border-b border-cl-border bg-cl-canvas p-5">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-cl-accent/[0.075] blur-3xl" />

            <div className="absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-cl-accent/[0.065] blur-3xl" />

            <div className="absolute inset-0 opacity-[0.022] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:44px_44px]" />
          </div>

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-canvas px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cl-accent">
              <Trophy className="h-3.5 w-3.5" />
              Race Registration
            </div>

            <h2 className="text-2xl font-black uppercase leading-none tracking-[-0.04em] text-cl-ink">
              Enter the race
            </h2>

            <p className="mt-3 text-sm leading-6 text-cl-muted">
              Find an event, select a racer, choose classes, and complete an
              entry through Corner League.
            </p>
          </div>
        </div>

        <nav className="space-y-2 bg-cl-canvas p-3">
          {registrationNavigationItems.map((item) => {
            const Icon = item.icon;
            const active = isNavigationItemActive(location, item);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.href)}
                className={`group flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left shadow-sm transition ${
                  active
                    ? "border-cl-accent/[0.35] bg-cl-canvas text-cl-ink shadow-cl-panel"
                    : "border-cl-border bg-cl-canvas text-cl-muted hover:border-cl-accent/20 hover:bg-cl-canvas hover:text-cl-ink"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition ${
                    active
                      ? "border-cl-accent/25 bg-cl-canvas text-cl-accent"
                      : "border-cl-border bg-cl-canvas text-cl-muted group-hover:text-cl-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block break-words text-sm font-black uppercase tracking-[-0.01em]">
                      {item.label}
                    </span>

                    {/* {item.protected ? (
                      <span className="rounded-full border border-cl-accent/25 bg-cl-canvas px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-cl-accent">
                        Account
                      </span>
                    ) : null} */}
                  </span>

                  <span
                    className={`mt-1 block text-xs leading-5 ${
                      active ? "text-cl-muted" : "text-cl-muted"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>

                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition ${
                    active
                      ? "text-cl-accent"
                      : "text-cl-muted group-hover:translate-x-0.5 group-hover:text-cl-muted"
                  }`}
                />
              </button>
            );
          })}
        </nav>

        <div className="border-t border-cl-border bg-cl-canvas p-4">
          <button
            type="button"
            onClick={() => navigate("/registration/events")}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-cl-accent px-5 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-cl-contrast shadow-cl-panel transition hover:bg-cl-accent"
          >
            <Search className="h-4 w-4" />
            Find a race
          </button>
        </div>
      </div>
    </aside>
  );
}
