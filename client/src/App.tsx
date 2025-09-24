// src/App.tsx
import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Extension from "@/pages/extension";
import Clubs from "@/pages/clubs";
import CreateClub from "@/pages/create-club";
import Settings from "@/pages/settings";
import ContactPage from "@/pages/contact";
import TermsPage from "@/pages/terms";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import ClubDetailsPage from "./pages/clubDetails";

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

  if (isLoading) return null; // or a spinner
  return isAuthenticated ? <Comp /> : null;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  function AuthBootstrap() {
    useEffect(() => {
      // If tokens exist, this will hydrate the cache and keep the user signed in
      queryClient.prefetchQuery({ queryKey: ["/auth/me"] });
    }, []);
    return null;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route
        path="/clubs"
        component={() => <ProtectedRoute component={Clubs} />}
      />
      <Route
        path="/create-club"
        component={() => <ProtectedRoute component={CreateClub} />}
      />
      <Route
        path="/extension"
        component={() => <ProtectedRoute component={Extension} />}
      />
      <Route
        path="/settings"
        component={() => <ProtectedRoute component={Settings} />}
      />
      <Route
        path="/clubs/:id"
        component={() => <ProtectedRoute component={ClubDetailsPage} />}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
