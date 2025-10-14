// src/App.tsx
import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { setTokens, getAccessToken, getRefreshToken } from "@/lib/token";
import Home from "@/pages/home";
import Clubs from "@/pages/clubs";
import CreateClub from "@/pages/create-club";
import ClubSettings from "./pages/clubSettings";
import Settings from "@/pages/settings";
import ContactPage from "@/pages/contact";
import TermsPage from "@/pages/terms";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import ClubDetailsPage from "./pages/clubDetails";
import { useGtagPageview } from "./useGtagPageview";
import ErrorBoundary from "@/components/ErrorBoundary";
import RacerProfilePage from "./pages/racer-profile";
import AppShell from "./layout/AppShell";
import ProfileRedirect from "@/pages/profile";
import UserProfilePage from "./pages/user-profile";
import FeedPage from "@/pages/feed";
import ExploreFeedPage from "@/pages/explore";
import ScoresPage from "@/pages/scores";
import MessagesPage from "@/pages/messages";
import NotificationsPage from "@/pages/notifications";
import WelcomeSplash from "./pages/welcome-splash";

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
        150
      );
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, isLoading, location, navigate]);

  if (isLoading) return null;
  return isAuthenticated ? <Comp /> : null;
}

function BootSanitizeTokens() {
  useEffect(() => {
    const at = getAccessToken();
    const rt = getRefreshToken();
    // re-save to ensure any accidental "Bearer " is stripped
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
          <Route path="/racer/:name">
            {(params) => <RacerProfilePage nameParam={params.name} />}
          </Route>
          <Route path="/profile" component={ProfileRedirect} />
          <Route path="/feed" component={FeedPage} />
          <Route path="/explore" component={ExploreFeedPage} />
          <Route path="/scores" component={ScoresPage} />
          <Route path="/messages" component={MessagesPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/welcome" component={WelcomeSplash} />

          {/* existing club flows */}
          <Route path="/clubs" component={Clubs} />
          <Route path="/create-club" component={CreateClub} />
          <Route path="/clubs/:id" component={ClubDetailsPage} />
          <Route path="/club-settings/:id" component={ClubSettings} />
          <Route path="/settings" component={Settings} />

          {/* final fallback **inside** shell */}
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    </AppShell>
  );
}

function Router() {
  function AuthBootstrap() {
    useEffect(() => {
      queryClient.prefetchQuery({ queryKey: ["/auth/me"] });
    }, []);
    return null;
  }

  return (
    <Switch>
      {/* public */}
      <Route path="/" component={Home} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/auth" component={AuthPage} />

      {/* catch-all → try private area */}
      {/* <Route
        path="/:rest*"
        component={() => <ProtectedRoute component={PrivateRouter} />}
      /> */}
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
