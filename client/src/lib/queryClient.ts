// src/lib/queryClient.ts
import { QueryClient, type QueryFunction } from "@tanstack/react-query";
import { LocalCache, UserCache, ClubsCache, ChatCache } from "./cache";
import { CacheMonitor } from "./cacheMonitor";
import { apiFetch } from "@/lib/apiClient";

async function throwIfResNotOk(res: Response) {
  if (!res.ok)
    throw new Error(`${res.status}: ${(await res.text()) || res.statusText}`);
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Generic query fn that prefixes API base + sends Bearer token via apiFetch
export const getQueryFn =
  <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const path = String(queryKey[0]);
    const res = await apiFetch(path);

    if (on401 === "returnNull" && res.status === 401) return null as any;
    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

// Enhanced query fn with caches
export const getCachedQueryFn =
  <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const path = String(queryKey[0]);
    const ME_PATH = "/auth/me";

    if (path === ME_PATH) {
      const cached = UserCache.getUser();
      if (cached) {
        CacheMonitor.log("Cache hit: user data");
        return cached as any;
      }
    } else if (path === "/api/clubs") {
      const cached = ClubsCache.getClubs();
      if (cached) {
        CacheMonitor.log("Cache hit: clubs data");
        return { userClubs: cached } as any;
      }
    } else if (path.includes("/messages")) {
      const clubId = path.split("/")[3];
      const cached = ChatCache.getChatHistory(clubId);
      if (cached) {
        CacheMonitor.log("Cache hit: chat history", { clubId });
        return cached as any;
      }
    }

    CacheMonitor.log("Network request", { path });
    const res = await apiFetch(path);

    if (on401 === "returnNull" && res.status === 401) return null as any;
    await throwIfResNotOk(res);
    const data = await res.json();

    if (path === ME_PATH) {
      UserCache.setUser(data);
    } else if (path === "/api/clubs") {
      ClubsCache.setClubs(data.userClubs);
    } else if (path.includes("/messages")) {
      const clubId = path.split("/")[3];
      ChatCache.setChatHistory(clubId, data);
    }

    return data as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getCachedQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
    },
    mutations: { retry: false },
  },
});
