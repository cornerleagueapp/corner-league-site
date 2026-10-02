import type { QueryClient } from "@tanstack/react-query";
const communityKeys = new Set([
  "publishing-list",
  "publishing-detail",
  "publishing-replies",
  "social-posts",
  "social-post",
  "social-comments",
  "social-preferences",
  "social-notifications",
  "social-notification-count",
  "social-user-search",
  "direct-threads",
  "direct-messages",
  "user-follow",
]);
export function clearCommunityCache(client: QueryClient) {
  const predicate = (query: { queryKey: readonly unknown[] }) =>
    communityKeys.has(String(query.queryKey[0]));
  void client.cancelQueries({ predicate });
  client.removeQueries({ predicate });
}
