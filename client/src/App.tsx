// src/App.tsx
import { useEffect } from "react";

import { AnalyticsEvents } from "@/lib/analytics-events";

import { initAnalytics, persistUtmParams, trackEvent } from "@/lib/analytics";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { setTokens, getAccessToken, getRefreshToken } from "@/lib/token";

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

import UpdateEventPage from "./pages/organizations/updateEventPage";
import CreateEventPage from "./pages/organizations/createEventPage";
import EventListPage from "./pages/organizations/eventListPage";
import RaceClassEditor from "./pages/organizations/raceClassEditor";
import ClassMatchManagePage from "./pages/organizations/classMatchManagePage";
import { AnalyticsIdentity } from "@/components/analytics/AnalyticsIdentity";

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
          <Route path="/welcome" component={WelcomeSplash} />
          <Route path="/settings" component={Settings} />

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

          <Route path="/admin/rankings">
            {() => <SuperAdminRoute component={AdminRankingsPage} />}
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

      <Route path="/scores">
        {() => (
          <AppShell guestMode>
            <ErrorBoundary>
              <ScoresPage />
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

      <Route>{() => <ProtectedRoute component={PrivateRouter} />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BootSanitizeTokens />
      <AnalyticsBoot />
      <AnalyticsIdentity />
      <RouteAnalyticsTracker />

      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
