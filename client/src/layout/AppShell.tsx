import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import SidebarPanel, { useAppSidebarSections } from "@/components/sidebarPanel";
import cornerLeagueLogo from "@assets/CL_Logo.png";
import { logout } from "@/lib/logout";
import { useAuth } from "@/hooks/useAuth";

import { queryClient } from "@/lib/queryClient";
import { clearTokens } from "@/lib/token";

const keyToPath: Record<string, string> = {
  //   profile: "/profile",
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

function activeKeyFromPath(pathname: string): string {
  if (pathname === "/profile") return "profile";
  if (pathname.startsWith("/profile/")) return "";
  if (pathname === "/settings") return "account";

  if (pathname === "/feed") return "feed";
  if (pathname === "/explore") return "explore";

  if (pathname === "/scores") return "scores";

  if (pathname === "/clubs") return "my";
  if (pathname.startsWith("/clubs/discover")) return "discover";
  if (pathname.startsWith("/clubs/")) return "my";

  if (pathname === "/messages") return "messages";
  if (pathname === "/notifications") return "alerts";

  return "";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const isSuperAdmin =
    String((user as any)?.role ?? "").toUpperCase() === "SUPER_ADMIN";

  const [clubsSubKey, setClubsSubKey] = useState<"" | "my" | "discover">("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const goAuth = () => {
      const next = encodeURIComponent(location);
      navigate(`/auth?next=${next}`, { replace: true });
    };

    const hardLogout = () => {
      clearTokens();
      queryClient.setQueryData(["/auth/me"], null);
      queryClient.cancelQueries();
      goAuth();
    };

    const onLogout = () => hardLogout();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth:logout") hardLogout();
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
    isSuperAdmin,
  });

  return (
    <div className="relative flex min-h-screen bg-black text-white">
      <button
        onClick={() => setIsSidebarOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 rounded-md bg-gray-800 p-2 text-white shadow-lg transition-colors hover:bg-gray-700 md:hidden"
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
          if (key === activeKey) return;

          if (key === "my" || key === "discover") {
            if (location === "/clubs") {
              setClubsSubKey(key);
              window.dispatchEvent(
                new CustomEvent<"my" | "discover">("clubs:setTab", {
                  detail: key,
                }),
              );
              return;
            }

            if (location !== "/clubs") navigate("/clubs");
            return;
          }

          if (key === "profile") {
            const uname = (user as any)?.username;
            const to = uname
              ? `/profile/${encodeURIComponent(uname)}`
              : "/profile";

            if (location !== to) navigate(to);
            return;
          }

          const path = keyToPath[key];
          if (path && location !== path) {
            navigate(path);
          }
        }}
        sections={sections}
        logoSrc={cornerLeagueLogo}
        backHref="/"
      />

      <div className="flex flex-1 flex-col">{children}</div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowLogoutConfirm(false)}
          />
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
                className="rounded-md border border-gray-700 px-3 py-2 text-gray-200 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout("/auth");
                }}
                className="rounded-md bg-white px-3 py-2 font-medium text-black hover:bg-gray-200"
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
