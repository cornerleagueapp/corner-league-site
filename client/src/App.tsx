import { Switch, Route } from "wouter";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/auth" component={AuthPage} />
      {isLoading || !isAuthenticated ? (
        <Route path="/clubs" component={AuthPage} />
      ) : (
        <>
          <Route path="/clubs" component={Clubs} />
          <Route path="/create-club" component={CreateClub} />
          <Route path="/extension" component={Extension} />
          <Route path="/settings" component={Settings} />
        </>
      )}
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
