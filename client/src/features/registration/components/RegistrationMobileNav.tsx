import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  registrationNavigationItems,
  type RegistrationNavigationItem,
} from "./RegistrationSidebar";

function normalizePath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return path.replace(/\/+$/, "");
}

function itemMatchesLocation(
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

export default function RegistrationMobileNav() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const activeItem = useMemo(() => {
    return (
      registrationNavigationItems.find((item) =>
        itemMatchesLocation(location, item),
      ) ?? registrationNavigationItems[0]
    );
  }, [location]);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow || "";
    };
  }, [open]);

  const ActiveIcon = activeItem.icon;

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 rounded-[20px] border border-cyan-300/10 bg-[#07111F]/95 px-4 py-3 text-left shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
              <ActiveIcon className="h-4 w-4" />
            </span>

            <span className="min-w-0">
              <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/65">
                Registration
              </span>

              <span className="block truncate text-sm font-black uppercase text-white">
                {activeItem.label}
              </span>
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/55">
            <Menu className="h-4 w-4" />
            Menu
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            type="button"
            aria-label="Close registration navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <div className="absolute inset-x-3 bottom-3 max-h-[88vh] overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#07111F] shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
            <div className="relative border-b border-white/10 p-5">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="absolute -bottom-24 -right-16 h-52 w-52 rounded-full bg-[#FF6B35]/10 blur-3xl" />
              </div>

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                    Corner League
                  </div>

                  <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.03em] text-white">
                    Race Registration
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-white/50">
                    Find events, view racers, and manage your race entries.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav className="max-h-[62vh] space-y-2 overflow-y-auto p-3">
              {registrationNavigationItems.map((item) => {
                const Icon = item.icon;
                const active = itemMatchesLocation(location, item);

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate(item.href);
                    }}
                    className={`flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition ${
                      active
                        ? "border-cyan-300/25 bg-cyan-300/12"
                        : "border-transparent bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${
                        active
                          ? "border-cyan-300/20 bg-cyan-300/12 text-cyan-200"
                          : "border-white/10 bg-white/[0.04] text-white/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-black uppercase text-white">
                          {item.label}
                        </span>

                        {item.protected ? (
                          <span className="rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-[#FFB199]">
                            Account
                          </span>
                        ) : null}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-white/45">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/registration/events");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B35] px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-[0_0_24px_rgba(255,107,53,0.18)] transition hover:bg-[#ff7c4d]"
              >
                Find an event
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
