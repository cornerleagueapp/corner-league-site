import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { socialRequest } from "@/lib/socialApi";
export async function loadUnreadNotifications() {
  const result = await socialRequest<{ unreadCount: number }>(
    "GET",
    "me/notifications/unread-count",
  );
  if (
    !result ||
    !Number.isSafeInteger(result.unreadCount) ||
    result.unreadCount < 0
  )
    throw new Error("Unable to read notification count.");
  return result;
}
export function useUnreadNotifications() {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["social-notification-count", user?.id],
    queryFn: loadUnreadNotifications,
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
export function NotificationCount({ count }: { count?: number }) {
  if (count === undefined || count < 1) return null;
  return (
    <span
      aria-label={`${count} unread notifications`}
      className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-cyan-300 px-1.5 py-0.5 text-[10px] font-black leading-4 text-[#06111d]"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
