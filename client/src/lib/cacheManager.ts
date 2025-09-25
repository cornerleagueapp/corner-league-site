import { LocalCache, UserCache, ClubsCache, ChatCache } from "./cache";
import { queryClient } from "./queryClient";

// Cache management utilities
export class CacheManager {
  // Clear all cache data (useful on logout)
  static clearAll(): void {
    LocalCache.clear();
    queryClient.clear();
    console.log('All cache data cleared');
  }

  // Clear user-specific data
  static clearUserData(): void {
    UserCache.clearUser();
    ClubsCache.clearClubs();
    console.log('User data cache cleared');
  }

  // Clear chat data for a specific club
  static clearClubChat(clubId: string): void {
    ChatCache.clearChatHistory(clubId);
    console.log(`Chat cache cleared for club ${clubId}`);
  }

  // Get cache status for debugging
  static getCacheStatus(): Record<string, any> {
    return {
      user: UserCache.getUser() ? 'cached' : 'empty',
      clubs: ClubsCache.getClubs() ? 'cached' : 'empty',
      localStorage_keys: Object.keys(localStorage).filter(key => 
        key.startsWith('sports_app_')
      ),
      react_query_cache: queryClient.getQueryCache().getAll().length + ' queries cached'
    };
  }

  // Refresh specific cache entries
  static async refreshUserData(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    console.log('User data cache refreshed');
  }

  static async refreshClubsData(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
    console.log('Clubs data cache refreshed');
  }

  // Cache warming - preload important data
  static async warmCache(): Promise<void> {
    try {
      // Prefetch user data
      await queryClient.prefetchQuery({
        queryKey: ['/api/user'],
        staleTime: 1000 * 60 * 5
      });

      // Prefetch clubs data  
      await queryClient.prefetchQuery({
        queryKey: ['/api/clubs'],
        staleTime: 1000 * 60 * 5
      });

      console.log('Cache warmed successfully');
    } catch (error) {
      console.log('Cache warming failed:', error);
    }
  }

  // Smart cache invalidation based on user actions
  static handleUserAction(action: string, data?: any): void {
    switch (action) {
      case 'club_created':
        ClubsCache.addClub(data);
        queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
        break;
        
      case 'club_updated':
        ClubsCache.updateClub(data);
        queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
        break;
        
      case 'club_deleted':
        ClubsCache.removeClub(data.clubId);
        ChatCache.clearChatHistory(data.clubId);
        queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
        break;
        
      case 'message_sent':
        ChatCache.addMessage(data.clubId, data.message);
        break;
        
      case 'logout':
        this.clearAll();
        break;
        
      default:
        console.log('Unknown cache action:', action);
    }
  }
}

// Development helper - add to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).cacheManager = CacheManager;
  (window as any).cacheStatus = () => CacheManager.getCacheStatus();
}