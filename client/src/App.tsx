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
import Extension from "@/pages/extension";
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

import AppShell from "./layout/AppShell";
import ProfilePage from "@/pages/profile";
import FeedPage from "@/pages/feed";
import ExploreFeedPage from "@/pages/explore";
import ScoresPage from "@/pages/scores";
import MessagesPage from "@/pages/messages";
import NotificationsPage from "@/pages/notifications";

function ProtectedRoute({
  component: Comp,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const next = encodeURIComponent(location);
      navigate(`/auth?next=${next}`, { replace: true });
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
      <Switch>
        <Route path="/profile" component={ProfilePage} />
        <Route path="/feed" component={FeedPage} />
        <Route path="/explore" component={ExploreFeedPage} />
        <Route path="/scores" component={ScoresPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/notifications" component={NotificationsPage} />

        {/* existing club flows */}
        <Route path="/clubs" component={Clubs} />
        <Route path="/create-club" component={CreateClub} />
        <Route path="/clubs/:id" component={ClubDetailsPage} />
        <Route path="/settings" component={Settings} />

        {/* final fallback **inside** shell */}
        <Route component={NotFound} />
      </Switch>
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
      <Route
        path="/:rest*"
        component={() => <ProtectedRoute component={PrivateRouter} />}
      />
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
