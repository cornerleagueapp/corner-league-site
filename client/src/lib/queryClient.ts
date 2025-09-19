// src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { LocalCache, UserCache, ClubsCache, ChatCache } from "./cache";
import { CacheMonitor } from "./cacheMonitor";
import { apiFetch } from "@/lib/apiClient";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Generic query fn that prefixes API base + sends Bearer token via apiFetch
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = String(queryKey[0]); // e.g. "/auth/me" or "/api/clubs"
    const res = await apiFetch(path);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

// Enhanced query fn with your caches (now using apiFetch)
export const getCachedQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = String(queryKey[0]); // don't join with '/', we pass a single key
    // Update this to match the real endpoint you use for "me":
    const ME_PATH = "/auth/me"; // <-- change to "/api/user" if your backend uses that

    // cache first
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
      const parts = path.split("/");
      const clubId = parts[3]; // adjust if your path differs
      const cached = ChatCache.getChatHistory(clubId);
      if (cached) {
        CacheMonitor.log("Cache hit: chat history", { clubId });
        return cached as any;
      }
    }

    // network
    CacheMonitor.log("Network request", { path });
    const res = await apiFetch(path);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    const data = await res.json();

    // write-through caching
    if (path === ME_PATH) {
      UserCache.setUser(data);
      CacheMonitor.log("Cache stored: user data");
    } else if (path === "/api/clubs") {
      ClubsCache.setClubs(data.userClubs);
      CacheMonitor.log("Cache stored: clubs data");
    } else if (path.includes("/messages")) {
      const clubId = path.split("/")[3];
      ChatCache.setChatHistory(clubId, data);
      CacheMonitor.log("Cache stored: chat history", { clubId });
    }

    return data;
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
