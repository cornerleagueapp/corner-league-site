// src/App.tsx
import { useEffect, useState } from "react";

import { AnalyticsEvents } from "@/lib/analytics-events";

import { initAnalytics, persistUtmParams, trackEvent } from "@/lib/analytics";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  getAccessTokenTimeLeftMs,
} from "@/lib/token";
import {
  cancelProactiveRefresh,
  ensureFreshAuthSession,
} from "@/lib/apiClient";

import Home from "@/pages/landing/home";
import ScoresPage from "@/pages/scores";
import ScoresLandingPage from "@/pages/landing/scores-landing";

import Clubs from "@/pages/clubs/clubs";
import CreateClub from "@/pages/clubs/create-club";
import ClubSettings from "./pages/clubs/clubSettings";
import Settings from "@/pages/profile/settings";
import ContactPage from "@/pages/clubs/contact";
import TermsPage from "@/pages/terms";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import ClubDetailsPage from "./pages/clubs/clubDetails";
import ErrorBoundary from "@/components/ErrorBoundary";
import RacerProfilePage from "./pages/racer-profile";
import AppShell from "./layout/AppShell";
import ProfileRedirect from "@/pages/profile/profile";
import UserProfilePage from "./pages/profile/user-profile";
import FeedPage from "@/pages/profile/feed";
import ExploreFeedPage from "@/pages/profile/explore";
import MessagesPage from "@/pages/profile/messages";
import NotificationsPage from "@/pages/profile/notifications";
import WelcomeSplash from "./pages/welcome-splash";
import AdminCreateRacerPage from "./pages/admin/admin-create-racer";
import AquaOrganizationsPage from "./pages/organizations/aqua-organizations";
import AdminCreateOrganizationPage from "./pages/organizations/admin-create-organization";
import AquaOrganizationDetailsPage from "./pages/organizations/aqua-organization-details";
import AdminRankingsPage from "./pages/admin/admin-rankings";
import AdminAthleteClaimsPage from "./pages/admin/admin-athlete-claims";
import OrgEventDetailsPage from "./pages/organizations/org-event-details";
import EventMapPage from "@/pages/event-map";
import TopTrendsPage from "@/pages/top-trends";
import PodcastEpisodesPage from "@/pages/podcast-episodes";

import AdminRacePodsPage from "./pages/admin/admin-racepods";
import UpdateEventPage from "./pages/organizations/updateEventPage";
import CreateEventPage from "./pages/organizations/createEventPage";
import EventListPage from "./pages/organizations/eventListPage";
import RaceClassEditor from "./pages/organizations/raceClassEditor";
import ClassMatchManagePage from "./pages/organizations/classMatchManagePage";
import { AnalyticsIdentity } from "@/components/analytics/AnalyticsIdentity";
import PollsPage from "@/pages/pollsPage";
import PollsDetailsPage from "@/pages/pollsDetailsPage";
import AdminPollsPage from "@/pages/admin/admin-polls-page";
import RacePodPage from "./pages/profile/racepod";
import RacePodSessionPage from "@/pages/racepod-session";
import RacePodLandingPage from "@/pages/racepod-landing";
import RacePodPublishedSessionsPage from "@/pages/racePods/racePodPublishedSessions";
import AquaFeaturedGalleryPage from "@/pages/organizations/aqua-featured-gallery";

function ProtectedRoute({
  component: Comp,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const next = encodeURIComponent(location);
      const t = setTimeout(
        () => navigate(`/auth?next=${next}`, { replace: true }),
        150,
      );
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, isLoading, location, navigate]);

  if (isLoading) return null;
  return isAuthenticated ? <Comp /> : null;
}

function SuperAdminRoute({
  component: Comp,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, navigate] = useLocation();

  const isSuperAdmin =
    String((user as any)?.role ?? "").toUpperCase() === "SUPER_ADMIN";

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const next = encodeURIComponent(location);
      const t = setTimeout(
        () => navigate(`/auth?next=${next}`, { replace: true }),
        150,
      );
      return () => clearTimeout(t);
    }

    if (isAuthenticated && !isSuperAdmin) {
      const t = setTimeout(() => navigate("/", { replace: true }), 150);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, isLoading, isSuperAdmin, location, navigate]);

  if (isLoading) return null;
  return isAuthenticated && isSuperAdmin ? <Comp /> : null;
}

function BootSanitizeTokens() {
  useEffect(() => {
    const at = getAccessToken();
    const rt = getRefreshToken();
    if (at) setTokens(at, rt ?? undefined);
  }, []);
  return null;
}

function AnalyticsBoot() {
  useEffect(() => {
    initAnalytics();
    persistUtmParams();

    trackEvent(AnalyticsEvents.APP_LOADED, {
      page_path: window.location.pathname,
    });
  }, []);

  return null;
}

export function RouteAnalyticsTracker() {
  const [location] = useLocation();

  useEffect(() => {
    trackEvent(AnalyticsEvents.PAGE_VIEWED, {
      page_path: location,
    });
  }, [location]);

  return null;
}

function PrivateRouter() {
  return (
    <AppShell>
      <ErrorBoundary>
        <Switch>
          <Route path="/profile/:username">
            {(params) => <UserProfilePage username={params.username} />}
          </Route>

          <Route path="/profile" component={ProfileRedirect} />
          <Route path="/feed" component={FeedPage} />
          <Route path="/explore" component={ExploreFeedPage} />
          <Route path="/messages" component={MessagesPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/settings" component={Settings} />
          <Route path="/racepod" component={RacePodPage} />

          <Route path="/clubs" component={Clubs} />
          <Route path="/create-club" component={CreateClub} />
          <Route path="/clubs/:id" component={ClubDetailsPage} />
          <Route path="/club-settings/:id" component={ClubSettings} />

          <Route path="/admin/create-racer">
            {() => <SuperAdminRoute component={AdminCreateRacerPage} />}
          </Route>

          <Route path="/admin/create-organization">
            {() => <SuperAdminRoute component={AdminCreateOrganizationPage} />}
          </Route>

          <Route path="/admin/athlete-claims">
            {() => <SuperAdminRoute component={AdminAthleteClaimsPage} />}
          </Route>

          <Route path="/organization/event-list">
            {() => <SuperAdminRoute component={EventListPage} />}
          </Route>

          <Route path="/admin/racepods">
            {() => <SuperAdminRoute component={AdminRacePodsPage} />}
          </Route>

          <Route path="/admin/rankings">
            {() => <SuperAdminRoute component={AdminRankingsPage} />}
          </Route>

          <Route path="/admin/polls">
            {() => <SuperAdminRoute component={AdminPollsPage} />}
          </Route>

          <Route path="/events/create">
            {() => <SuperAdminRoute component={CreateEventPage} />}
          </Route>

          <Route path="/organization/events/:id">
            {() => <SuperAdminRoute component={UpdateEventPage} />}
          </Route>

          <Route path="/organization/events/:id/classes">
            {() => <SuperAdminRoute component={RaceClassEditor} />}
          </Route>

          <Route path="/organization/events/:eventId/classes/:divisionId/manage">
            {() => <SuperAdminRoute component={ClassMatchManagePage} />}
          </Route>

          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ScoresLandingPage} />
      <Route path="/home" component={Home} />
      <Route path="/about" component={Home} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/welcome" component={WelcomeSplash} />

      <Route path="/racepod/sessions/:sessionId">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <RacePodSessionPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/racepod-info">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <RacePodLandingPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/scores">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <ScoresPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/scores/aqua/racepod">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <RacePodPublishedSessionsPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/scores/aqua/gallery">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <AquaFeaturedGalleryPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/scores/aqua">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <ScoresPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/aqua-organizations">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <AquaOrganizationsPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/aqua-organizations/:id">
        {(params) => (
          <AppShell guestMode>
            <ErrorBoundary>
              <AquaOrganizationDetailsPage params={{ id: params.id }} />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/aqua-organizations/event-details/:id">
        {(params) => (
          <AppShell guestMode>
            <ErrorBoundary>
              <OrgEventDetailsPage params={{ id: params.id }} />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/racer/:idOrSlug">
        {(params) => (
          <AppShell guestMode>
            <ErrorBoundary>
              <RacerProfilePage idOrSlugParam={params.idOrSlug} />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/event-map">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <EventMapPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/top-trends">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <TopTrendsPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/podcast-episodes">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <PodcastEpisodesPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/polls">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <PollsPage />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route path="/polls/:id">
        {(params) => (
          <AppShell guestMode>
            <ErrorBoundary>
              <PollsDetailsPage params={{ id: params.id }} />
            </ErrorBoundary>
          </AppShell>
        )}
      </Route>

      <Route>{() => <ProtectedRoute component={PrivateRouter} />}</Route>
    </Switch>
  );
}

function AuthExpiredModal({
  open,
  onLogin,
  onDismiss,
}: {
  open: boolean;
  onLogin: () => void;
  onDismiss: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close session expired modal"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onDismiss}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F] p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.10),transparent_30%)]" />

        <div className="relative">
          <div className="inline-flex rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
            Session Expired
          </div>

          <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.03em] text-white">
            Please log in again
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            Your login session expired or could not be refreshed. Log in again
            to continue using account features.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onLogin}
              className="rounded-full bg-cyan-300 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] transition hover:bg-cyan-200"
            >
              Log In
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Stay Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthSessionManager() {
  const [location, navigate] = useLocation();
  const [expiredOpen, setExpiredOpen] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      cancelProactiveRefresh();
      clearTokens();
      queryClient.setQueryData(["/auth/me"], null);
      queryClient.removeQueries({ queryKey: ["/auth/me"], exact: true });
      setExpiredOpen(true);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "auth:expired" || event.key === "auth:logout") {
        handleExpired();
      }
    };

    window.addEventListener("auth:expired", handleExpired);
    window.addEventListener("auth:logout", handleExpired);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("auth:expired", handleExpired);
      window.removeEventListener("auth:logout", handleExpired);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const at = getAccessToken();
      const rt = getRefreshToken();

      if (!at && !rt) return;

      const timeLeft = getAccessTokenTimeLeftMs();

      if (timeLeft !== null && timeLeft <= 0) {
        const ok = await ensureFreshAuthSession();

        if (!ok) {
          window.dispatchEvent(
            new CustomEvent("auth:expired", {
              detail: { reason: "access_token_expired" },
            }),
          );
        }

        return;
      }

      if (timeLeft !== null && timeLeft <= 2 * 60 * 1000) {
        const ok = await ensureFreshAuthSession();

        if (!ok) {
          window.dispatchEvent(
            new CustomEvent("auth:expired", {
              detail: { reason: "refresh_failed" },
            }),
          );
        }
      }
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <AuthExpiredModal
      open={expiredOpen}
      onDismiss={() => setExpiredOpen(false)}
      onLogin={() => {
        setExpiredOpen(false);
        const next = encodeURIComponent(location || "/scores/aqua");
        navigate(`/auth?next=${next}`);
      }}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BootSanitizeTokens />
      <AnalyticsBoot />
      <AnalyticsIdentity />
      <RouteAnalyticsTracker />
      <AuthSessionManager />

      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
