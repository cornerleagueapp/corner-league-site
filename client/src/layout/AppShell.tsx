import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import SidebarPanel, { useAppSidebarSections } from "@/components/sidebarPanel";
import cornerLeagueLogo from "@assets/CL_Logo.png";
import { logout } from "@/lib/logout";

// map sidebar item -> route
const keyToPath: Record<string, string> = {
  // Profile section
  profile: "/profile",
  account: "/settings",
  logout: "/auth", // handled by onSelect in the hook, this is a fallback

  // Explore section
  feed: "/feed",
  explore: "/explore",

  // Live Scores
  teams: "/scores/teams",
  scores: "/scores",

  // Clubs
  my: "/clubs",
  discover: "/clubs",

  // Messages / Notifications
  messages: "/messages",
  alerts: "/notifications",
};

function activeKeyFromPath(pathname: string): string {
  // exacts first
  if (pathname === "/profile") return "profile";
  if (pathname === "/settings") return "account";

  if (pathname === "/feed") return "feed";
  if (pathname === "/explore") return "explore";

  if (pathname === "/scores") return "scores";
  if (pathname.startsWith("/scores/")) return "teams";

  if (pathname === "/clubs") return "my";
  if (pathname.startsWith("/clubs/discover")) return "discover";
  if (pathname.startsWith("/clubs/")) return "my";

  if (pathname.startsWith("/clubs/")) return "my";

  if (pathname === "/messages") return "messages";
  if (pathname === "/notifications") return "alerts";

  return ""; // nothing selected
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();

  const [clubsSubKey, setClubsSubKey] = useState<"" | "my" | "discover">("");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const goAuth = () => {
      const next = encodeURIComponent(location);
      navigate(`/auth?next=${next}`, { replace: true });
    };

    const onLogout = () => goAuth();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth:logout") goAuth();
    };

    window.addEventListener("auth:logout", onLogout);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, [location, navigate]);

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setShowLogoutConfirm(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogoutConfirm]);

  useEffect(() => {
    const handler = (e: Event) =>
      setClubsSubKey((e as CustomEvent<"my" | "discover">).detail);
    window.addEventListener("clubs:activeTab", handler as EventListener);
    return () =>
      window.removeEventListener("clubs:activeTab", handler as EventListener);
  }, []);

  const pathKey = useMemo(() => activeKeyFromPath(location), [location]);

  const activeKey = location === "/clubs" ? clubsSubKey || "my" : pathKey || "";

  const sections = useAppSidebarSections({
    onLogout: () => setShowLogoutConfirm(true),
  });

  return (
    <div className="min-h-screen bg-black text-white flex relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen((v) => !v)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors shadow-lg"
      >
        <svg
          className="w-6 h-6"
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
          if (key === "my" || key === "discover") {
            if (location === "/clubs") {
              setClubsSubKey(key);
              window.dispatchEvent(
                new CustomEvent<"my" | "discover">("clubs:setTab", {
                  detail: key,
                })
              );
              return;
            }
            sessionStorage.setItem("clubsTab", key);
            navigate("/clubs");
            return;
          }

          const path = keyToPath[key];
          if (path) navigate(path);
        }}
        sections={sections}
        logoSrc={cornerLeagueLogo}
        backHref="/"
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <button
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowLogoutConfirm(false)}
          />
          {/* Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="relative z-10 w-full max-w-sm rounded-xl border border-gray-700 bg-[#111111] p-5 shadow-xl"
          >
            <h2 id="logout-title" className="text-lg font-semibold text-white">
              Log out?
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Are you sure you want to log out?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-2 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout("/auth");
                }}
                className="px-3 py-2 rounded-md bg-white text-black hover:bg-gray-200 font-medium"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
