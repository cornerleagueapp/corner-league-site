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
    key: "registration-organizations",
    label: "Find Organizations",
    description: "Browse organizations offering race registration.",
    href: "/registration/organizations",
    icon: Building2,
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
      <div className="sticky top-5 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/95 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
        <div className="relative overflow-hidden border-b border-white/10 p-5">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-[#FF6B35]/10 blur-3xl" />

            <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:44px_44px]" />
          </div>

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
              <Trophy className="h-3.5 w-3.5" />
              Race Registration
            </div>

            <h2 className="text-2xl font-black uppercase leading-none tracking-[-0.04em] text-white">
              Enter the race
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Find an event, select a racer, choose classes, and complete an
              entry through Corner League.
            </p>
          </div>
        </div>

        <nav className="space-y-2 p-3">
          {registrationNavigationItems.map((item) => {
            const Icon = item.icon;
            const active = isNavigationItemActive(location, item);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.href)}
                className={`group flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition ${
                  active
                    ? "border-cyan-300/25 bg-cyan-300/12 text-white shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                    : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition ${
                    active
                      ? "border-cyan-300/20 bg-cyan-300/12 text-cyan-200"
                      : "border-white/10 bg-white/[0.04] text-slate-400 group-hover:text-cyan-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block truncate text-sm font-black uppercase tracking-[-0.01em]">
                      {item.label}
                    </span>

                    {item.protected ? (
                      <span className="rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-[#FFB199]">
                        Account
                      </span>
                    ) : null}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {item.description}
                  </span>
                </span>

                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition ${
                    active
                      ? "text-cyan-200"
                      : "text-white/20 group-hover:translate-x-0.5 group-hover:text-white/50"
                  }`}
                />
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => navigate("/registration/events")}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B35] px-5 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-[0_0_26px_rgba(255,107,53,0.18)] transition hover:bg-[#ff7c4d]"
          >
            <Search className="h-4 w-4" />
            Find a race
          </button>
        </div>
      </div>
    </aside>
  );
}
