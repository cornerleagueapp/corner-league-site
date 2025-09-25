// Cache monitoring and performance tracking
export class CacheMonitor {
  private static logs: { action: string; timestamp: number; data?: any }[] = [];

  static log(action: string, data?: any): void {
    this.logs.push({
      action,
      timestamp: Date.now(),
      data
    });

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    console.log(`[Cache] ${action}`, data);
  }

  static getLogs(): typeof this.logs {
    return [...this.logs];
  }

  static getStats(): Record<string, any> {
    const now = Date.now();
    const recentLogs = this.logs.filter(log => now - log.timestamp < 60000); // Last minute

    const cacheHits = recentLogs.filter(log => log.action.includes('cache')).length;
    const networkRequests = recentLogs.filter(log => log.action.includes('network')).length;
    
    return {
      total_actions: recentLogs.length,
      cache_hits: cacheHits,
      network_requests: networkRequests,
      cache_hit_ratio: networkRequests > 0 ? (cacheHits / (cacheHits + networkRequests) * 100).toFixed(1) + '%' : 'N/A',
      recent_actions: recentLogs.slice(-10).map(log => log.action)
    };
  }

  static clear(): void {
    this.logs = [];
    console.log('[Cache] Monitor logs cleared');
  }
}

// Development helper
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).cacheMonitor = CacheMonitor;
}