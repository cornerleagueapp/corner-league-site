import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { socialRequest } from "@/lib/socialApi";
export async function loadUnreadMessages() {
  const result = await socialRequest<{ unreadCount: number }>(
    "GET",
    "me/threads/unread-count",
  );
  if (
    !result ||
    !Number.isSafeInteger(result.unreadCount) ||
    result.unreadCount < 0
  )
    throw new Error("Unable to read message count.");
  return result;
}
export function useUnreadMessages() {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["direct-message-count", user?.id],
    queryFn: loadUnreadMessages,
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
    refetchInterval: (query) => (query.state.error ? false : 30000),
    refetchIntervalInBackground: false,
    retry: false,
  });
}
