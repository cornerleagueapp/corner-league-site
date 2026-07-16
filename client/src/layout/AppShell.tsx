import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import SidebarPanel, { useAppSidebarSections } from "@/components/sidebarPanel";
import RacerSearchModal from "@/components/RacerSearchModal";
import cornerLeagueLogo from "@assets/CL_Logo.png";
import { logout } from "@/lib/logout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { clearTokens } from "@/lib/token";

const keyToPath: Record<string, string> = {
  account: "/settings",
  logout: "/auth",
  feed: "/feed",
  explore: "/explore",
  scores: "/scores",
  my: "/clubs",
  discover: "/clubs",
  messages: "/messages",
  alerts: "/notifications",
};

function activeKeyFromPath(pathnameWithQuery: string): string {
  const [pathname, queryString = ""] = pathnameWithQuery.split("?");
  const params = new URLSearchParams(queryString);

  void params;

  if (pathname === "/profile") {
    return "your-profile";
  }

  if (pathname.startsWith("/profile/")) {
    return "your-profile";
  }

  if (pathname === "/settings") {
    return "account";
  }

  if (pathname === "/scores" || pathname === "/scores/aqua") {
    return "racing-hub";
  }

  if (pathname === "/registration") {
    return "race-registration";
  }

  if (pathname.startsWith("/registration/")) {
    return "race-registration";
  }

  if (pathname.startsWith("/racer/")) {
    return "search-racers";
  }

  if (pathname === "/aqua-organizations") {
    return "race-organizations";
  }

  if (pathname.startsWith("/aqua-organizations")) {
    return "race-organizations";
  }

  if (pathname === "/event-map") {
    return "event-map";
  }

  if (pathname === "/podcast-episodes") {
    return "podcast-episodes";
  }

  if (pathname === "/top-trends") {
    return "top-trends";
  }

  if (pathname === "/polls" || pathname.startsWith("/polls/")) {
    return "polls";
  }

  if (pathname === "/arcade") {
    return "arcade";
  }

  if (pathname === "/clubs") {
    return "my";
  }

  if (pathname.startsWith("/clubs/discover")) {
    return "discover";
  }

  if (pathname.startsWith("/clubs/")) {
    return "my";
  }

  if (pathname === "/messages") {
    return "messages";
  }

  if (pathname === "/notifications") {
    return "alerts";
  }

  if (pathname === "/racepod" || pathname.startsWith("/racepod/")) {
    return "racepod";
  }

  return "";
}

export default function AppShell({
  children,
  guestMode = false,
}: {
  children: React.ReactNode;
  guestMode?: boolean;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem("cornerLeague.sidebarCollapsed") === "true";
  });

  const [location, navigate] = useLocation();

  const { user, isAuthenticated } = useAuth();
  const effectiveGuestMode = guestMode && !isAuthenticated;

  const { toast } = useToast();

  const isSuperAdmin =
    String((user as any)?.role ?? "").toUpperCase() === "SUPER_ADMIN";

  const [clubsSubKey, setClubsSubKey] = useState<"" | "my" | "discover">("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [racerSearchOpen, setRacerSearchOpen] = useState(false);

  useEffect(() => {
    const hardLogout = () => {
      clearTokens();
      queryClient.setQueryData(["/auth/me"], null);
      queryClient.cancelQueries();
    };

    const onLogout = () => {
      hardLogout();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "auth:logout" || event.key === "auth:expired") {
        hardLogout();
      }
    };

    window.addEventListener("auth:logout", onLogout);
    window.addEventListener("auth:expired", onLogout);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("auth:expired", onLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!showLogoutConfirm) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLogoutConfirm(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [showLogoutConfirm]);

  useEffect(() => {
    const handler = (event: Event) => {
      setClubsSubKey((event as CustomEvent<"my" | "discover">).detail);
    };

    window.addEventListener("clubs:activeTab", handler as EventListener);

    return () => {
      window.removeEventListener("clubs:activeTab", handler as EventListener);
    };
  }, []);

  useEffect(() => {
    const onOpenRacerSearch = () => {
      setRacerSearchOpen(true);
    };

    window.addEventListener("racer-search:open", onOpenRacerSearch);

    return () => {
      window.removeEventListener("racer-search:open", onOpenRacerSearch);
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    localStorage.setItem(
      "cornerLeague.sidebarCollapsed",
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed]);

  const locationWithQuery = `${location}${
    typeof window !== "undefined" ? window.location.search : ""
  }`;

  const pathKey = useMemo(
    () => activeKeyFromPath(locationWithQuery),
    [locationWithQuery],
  );

  const activeKey = location === "/clubs" ? clubsSubKey || "my" : pathKey || "";

  const sections = useAppSidebarSections({
    onLogout: () => setShowLogoutConfirm(true),
    isSuperAdmin,
    guestMode: effectiveGuestMode,
  });

  const guestBlockedKeys = new Set([
    "your-profile",
    "account",
    "logout",
    "my",
    "discover",
    "messages",
    "alerts",
    "feed",
    "explore",
    "racepod",
  ]);

  function sendGuestToAuthentication() {
    const next = encodeURIComponent(
      `${location}${
        typeof window !== "undefined" ? window.location.search : ""
      }`,
    );

    navigate(`/auth?next=${next}`);
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-black text-white">
      <button
        type="button"
        onClick={() => setIsSidebarOpen((value) => !value)}
        className="fixed left-4 top-4 z-50 rounded-2xl border border-cyan-300/15 bg-[#07111F]/90 p-2 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur transition hover:border-cyan-300/30 hover:bg-cyan-300/10 md:hidden"
        aria-label={isSidebarOpen ? "Close main menu" : "Open main menu"}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isSidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      <SidebarPanel
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeKey={activeKey}
        onChange={(key) => {
          const isGuestBlocked =
            effectiveGuestMode && guestBlockedKeys.has(key);

          if (isGuestBlocked) {
            toast({
              title: "Please log in to access",
              description: "That section requires an account.",
            });

            sendGuestToAuthentication();
            return;
          }

          if (key === activeKey) {
            setIsSidebarOpen(false);
            return;
          }

          if (key === "my" || key === "discover") {
            if (location === "/clubs") {
              setClubsSubKey(key);

              window.dispatchEvent(
                new CustomEvent<"my" | "discover">("clubs:setTab", {
                  detail: key,
                }),
              );

              setIsSidebarOpen(false);
              return;
            }

            navigate("/clubs");
            setIsSidebarOpen(false);
            return;
          }

          if (key === "your-profile") {
            const username = (user as any)?.username;

            const destination = username
              ? `/profile/${encodeURIComponent(username)}`
              : "/profile";

            if (location !== destination) {
              navigate(destination);
            }

            setIsSidebarOpen(false);
            return;
          }

          const path = keyToPath[key];

          if (path && location !== path) {
            navigate(path);
          }

          setIsSidebarOpen(false);
        }}
        sections={sections}
        logoSrc={cornerLeagueLogo}
        collapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
        backHref="/"
        showSignIn={effectiveGuestMode}
        signInHref={`/auth?next=${encodeURIComponent(
          `${location}${
            typeof window !== "undefined" ? window.location.search : ""
          }`,
        )}`}
        onGuestPrompt={() => {
          toast({
            title: "Please log in to access",
            description: "That section requires an account.",
          });

          sendGuestToAuthentication();
        }}
      />

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden transition-[margin] duration-150 ${
          isSidebarCollapsed ? "md:ml-[88px]" : "md:ml-72"
        }`}
      >
        {children}
      </div>

      <RacerSearchModal
        open={racerSearchOpen}
        onClose={() => setRacerSearchOpen(false)}
        onSelectRacer={(racer) => {
          setRacerSearchOpen(false);

          const id = encodeURIComponent(String(racer.id));

          navigate(`/racer/${id}`);
        }}
      />

      {showLogoutConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close logout confirmation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowLogoutConfirm(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="relative z-10 w-full max-w-sm rounded-[30px] border border-cyan-300/10 bg-[#07111F] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
              Account
            </div>

            <h2
              id="logout-title"
              className="mt-2 text-2xl font-black uppercase text-white"
            >
              Log out?
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-300">
              Are you sure you want to log out?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout("/auth");
                }}
                className="rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#FFB199] transition hover:bg-[#FF6B35]/20 hover:text-white"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
