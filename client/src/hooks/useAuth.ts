import { useQuery } from "@tanstack/react-query";
import { UserCache } from "@/lib/cache";
import { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update cache when user data changes
  if (user) {
    UserCache.setUser(user);
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}