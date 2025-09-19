import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { LocalCache, UserCache, ClubsCache, ChatCache } from "./cache";
import { CacheMonitor } from "./cacheMonitor";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Enhanced query function with caching
export const getCachedQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    // Try cache first for specific endpoints
    if (url === '/api/user') {
      const cached = UserCache.getUser();
      if (cached) {
        CacheMonitor.log('Cache hit: user data');
        return cached;
      }
    } else if (url === '/api/clubs') {
      const cached = ClubsCache.getClubs();
      if (cached) {
        CacheMonitor.log('Cache hit: clubs data');
        return { userClubs: cached };
      }
    } else if (url.includes('/messages')) {
      const clubId = url.split('/')[3]; // Extract club ID from URL
      const cached = ChatCache.getChatHistory(clubId);
      if (cached) {
        CacheMonitor.log('Cache hit: chat history', { clubId });
        return cached;
      }
    }
    
    // Fallback to network request
    CacheMonitor.log('Network request', { url });
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    
    // Cache the response
    if (url === '/api/user') {
      UserCache.setUser(data);
      CacheMonitor.log('Cache stored: user data');
    } else if (url === '/api/clubs') {
      ClubsCache.setClubs(data.userClubs);
      CacheMonitor.log('Cache stored: clubs data');
    } else if (url.includes('/messages')) {
      const clubId = url.split('/')[3];
      ChatCache.setChatHistory(clubId, data);
      CacheMonitor.log('Cache stored: chat history', { clubId });
    }
    
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getCachedQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
