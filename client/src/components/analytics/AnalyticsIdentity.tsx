import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clearAnalyticsUser, identifyUser } from "@/lib/analytics";

export function AnalyticsIdentity() {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user?.id) {
      clearAnalyticsUser();
      return;
    }

    const analyticsUser = user as any;

    identifyUser({
      id: String(analyticsUser.id),
      email: analyticsUser.email ?? null,
      username: analyticsUser.username ?? null,
      firstName: analyticsUser.firstName ?? analyticsUser.first_name ?? null,
      lastName: analyticsUser.lastName ?? analyticsUser.last_name ?? null,
      city: analyticsUser.city ?? null,
      state: analyticsUser.state ?? null,
      role: analyticsUser.role ?? null,
      sportsInterests:
        analyticsUser.sportsInterests ??
        analyticsUser.sports_interest ??
        analyticsUser.sports ??
        analyticsUser.sportsOfInterest ??
        null,
    });
  }, [isLoading, isAuthenticated, user?.id]);

  return null;
}
