// Local storage cache management
export class LocalCache {
  private static readonly PREFIX = 'sports_app_';
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(this.PREFIX + key, JSON.stringify(item));
  }

  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();
      
      // Check if item has expired
      if (now - parsed.timestamp > parsed.ttl) {
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Get fresh data if cache is stale
  static async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    this.set(key, fresh, ttl);
    return fresh;
  }
}

// Chat message cache specifically for real-time updates
export class ChatCache {
  private static readonly CHAT_PREFIX = 'chat_';
  private static readonly CHAT_TTL = 30 * 60 * 1000; // 30 minutes

  static setChatHistory(clubId: string, messages: any[]): void {
    LocalCache.set(`${this.CHAT_PREFIX}${clubId}`, messages, this.CHAT_TTL);
  }

  static getChatHistory(clubId: string): any[] | null {
    return LocalCache.get(`${this.CHAT_PREFIX}${clubId}`);
  }

  static addMessage(clubId: string, message: any): void {
    const existing = this.getChatHistory(clubId) || [];
    const updated = [...existing, message];
    this.setChatHistory(clubId, updated);
  }

  static clearChatHistory(clubId: string): void {
    LocalCache.remove(`${this.CHAT_PREFIX}${clubId}`);
  }
}

// User data cache
export class UserCache {
  static setUser(user: any): void {
    LocalCache.set('current_user', user, 15 * 60 * 1000); // 15 minutes
  }

  static getUser(): any | null {
    return LocalCache.get('current_user');
  }

  static clearUser(): void {
    LocalCache.remove('current_user');
  }
}

// Clubs cache
export class ClubsCache {
  static setClubs(clubs: any[]): void {
    LocalCache.set('user_clubs', clubs, 10 * 60 * 1000); // 10 minutes
  }

  static getClubs(): any[] | null {
    return LocalCache.get('user_clubs');
  }

  static updateClub(updatedClub: any): void {
    const clubs = this.getClubs();
    if (clubs) {
      const index = clubs.findIndex(club => club.id === updatedClub.id);
      if (index !== -1) {
        clubs[index] = updatedClub;
        this.setClubs(clubs);
      }
    }
  }

  static addClub(newClub: any): void {
    const clubs = this.getClubs() || [];
    clubs.push(newClub);
    this.setClubs(clubs);
  }

  static removeClub(clubId: string): void {
    const clubs = this.getClubs();
    if (clubs) {
      const filtered = clubs.filter(club => club.id !== clubId);
      this.setClubs(filtered);
    }
  }

  static clearClubs(): void {
    LocalCache.remove('user_clubs');
  }
}