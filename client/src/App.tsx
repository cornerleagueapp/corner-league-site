// src/App.tsx
import { useEffect } from "react";
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
import { useGtagPageview } from "./useGtagPageview";
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
import AdminAthleteClaimsPage from "./pages/admin/admin-athlete-claims";
import OrgEventDetailsPage from "./pages/organizations/org-event-details";

import UpdateEventPage from "./pages/organizations/updateEventPage";
import CreateEventPage from "./pages/organizations/createEventPage";
import EventListPage from "./pages/organizations/eventListPage";
import RaceClassEditor from "./pages/organizations/raceClassEditor";
import ClassMatchManagePage from "./pages/organizations/classMatchManagePage";

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

          {/* clubs */}
          <Route path="/clubs" component={Clubs} />
          <Route path="/create-club" component={CreateClub} />
          <Route path="/clubs/:id" component={ClubDetailsPage} />
          <Route path="/club-settings/:id" component={ClubSettings} />

          {/* admin */}
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
      {/* public landing + public sports media */}
      <Route path="/" component={ScoresLandingPage} />
      <Route path="/home" component={Home} />
      <Route path="/about" component={Home} />
      <Route path="/scores" component={ScoresPage} />
      <Route path="/scores/aqua" component={ScoresPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/auth" component={AuthPage} />

      {/* public org + event content */}
      <Route path="/aqua-organizations" component={AquaOrganizationsPage} />
      <Route
        path="/aqua-organizations/:id"
        component={AquaOrganizationDetailsPage}
      />
      <Route path="/aqua-organizations/event-details/:id">
        {(params) => <OrgEventDetailsPage params={{ id: params.id }} />}
      </Route>

      {/* public racer profile */}
      <Route path="/racer/:idOrSlug">
        {(params) => <RacerProfilePage idOrSlugParam={params.idOrSlug} />}
      </Route>

      {/* everything else protected */}
      <Route>{() => <ProtectedRoute component={PrivateRouter} />}</Route>
    </Switch>
  );
}

function App() {
  useGtagPageview();

  return (
    <QueryClientProvider client={queryClient}>
      <BootSanitizeTokens />
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
