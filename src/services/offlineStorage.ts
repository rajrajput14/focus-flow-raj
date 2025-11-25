// Offline storage service for mobile app
// Handles caching data for offline mode

interface CachedData {
  timestamp: number;
  data: any;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class OfflineStorage {
  private static getKey(key: string): string {
    return `offline_${key}`;
  }

  // Store data with timestamp
  static async setItem(key: string, data: any): Promise<void> {
    try {
      const cacheData: CachedData = {
        timestamp: Date.now(),
        data,
      };
      localStorage.setItem(this.getKey(key), JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  // Retrieve data if not expired
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const cached = localStorage.getItem(this.getKey(key));
      if (!cached) return null;

      const cacheData: CachedData = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - cacheData.timestamp > CACHE_DURATION) {
        this.removeItem(key);
        return null;
      }

      return cacheData.data as T;
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
      return null;
    }
  }

  // Remove cached item
  static async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Failed to remove cached data:', error);
    }
  }

  // Clear all offline cache
  static async clearAll(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('offline_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear offline cache:', error);
    }
  }

  // Queue actions for when back online
  static async queueAction(action: string, payload: any): Promise<void> {
    try {
      const queue = await this.getItem<any[]>('action_queue') || [];
      queue.push({
        action,
        payload,
        timestamp: Date.now(),
      });
      await this.setItem('action_queue', queue);
    } catch (error) {
      console.error('Failed to queue action:', error);
    }
  }

  // Get and clear action queue
  static async getActionQueue(): Promise<any[]> {
    try {
      const queue = await this.getItem<any[]>('action_queue') || [];
      await this.removeItem('action_queue');
      return queue;
    } catch (error) {
      console.error('Failed to get action queue:', error);
      return [];
    }
  }
}
