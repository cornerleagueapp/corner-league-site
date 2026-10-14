import { MarketingPreferences } from "@/components/marketing/MarketingPreferences";
import { PageSEO } from "@/seo/usePageSEO";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  safeLocalHref,
  loadNotifications,
  socialRequest,
} from "@/lib/socialApi";
import {
  Pagination,
  SocialFailure,
  socialBox,
  socialButton,
} from "@/components/community/SocialPosts";
export default function NotificationsPage() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["social-notifications", user?.id, page],
    queryFn: () => loadNotifications(page),
    enabled: !!user?.id,
    retry: false,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
  const read = useMutation({
    mutationFn: (id?: string) =>
      socialRequest(
        "PUT",
        id ? `me/notifications/${id}/read` : "me/notifications/read",
      ),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({
          queryKey: ["social-notifications", user?.id],
        }),
        cache.invalidateQueries({
          queryKey: ["social-notification-count", user?.id],
        }),
      ]);
    },
  });
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4 py-8 text-cl-ink">
      <PageSEO title="Notifications" canonicalPath="/notifications" noindex />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Notifications</h1>
          <p className="mt-2 text-sm text-cl-muted">
            {query.data
              ? `${query.data.unreadCount} unread`
              : "Your community updates"}
          </p>
        </div>
        <Link href="/settings" className={socialButton}>
          Preferences
        </Link>
      </header>
      <MarketingPreferences />
      <div className="flex flex-wrap gap-2">
        <button className={socialButton} onClick={() => void query.refetch()}>
          Refresh
        </button>
        <button
          className={socialButton}
          disabled={read.isPending || !query.data?.unreadCount}
          onClick={() => read.mutate(undefined)}
        >
          Mark all read
        </button>
      </div>
      {read.isError && <SocialFailure error={read.error} />}
      {query.isPending ? (
        <p role="status">Loading notifications…</p>
      ) : query.isError ? (
        <SocialFailure error={query.error} />
      ) : (
        <>
          {!query.data.items.length && (
            <div className={socialBox}>No notifications yet.</div>
          )}
          {query.data.items.map((alert) => (
            <article
              key={alert.id}
              className={`${socialBox} ${!alert.isRead ? "border-cl-accent/30" : ""}`}
            >
              <p className="break-words text-sm text-cl-ink">{alert.content}</p>
              <p className="mt-2 text-xs text-cl-muted">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {safeLocalHref(alert.href) && (
                  <Link
                    href={safeLocalHref(alert.href)!}
                    className={socialButton}
                    onClick={() => read.mutate(alert.id)}
                  >
                    View
                  </Link>
                )}
                {!alert.isRead && (
                  <button
                    className={socialButton}
                    disabled={read.isPending}
                    onClick={() => read.mutate(alert.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
          <Pagination
            page={page}
            hasNext={query.data.hasNextPage}
            setPage={setPage}
          />
        </>
      )}
    </main>
  );
}
