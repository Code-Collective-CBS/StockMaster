export class CachingService {
    constructor() {
      this.cache = {}; // In-memory cache
      this.storage = window.sessionStorage; // Persistent storage
      this.defaultTTL = 24 * 60 * 60 * 1000; // 24 hours default
    }

    // Get from cache (memory or sessionStorage)
    get(key) {
      // First check memory cache
      if (this.cache[key] && this.cache[key].expires > Date.now()) {
        console.log(`Cache hit (memory): ${key}`);
        return this.cache[key].data;
      }

      // Then check sessionStorage
      try {
        const stored = this.storage.getItem(key);
        if (stored) {
          const item = JSON.parse(stored);
          if (item.expires > Date.now()) {
            console.log(`Cache hit (sessionStorage): ${key}`);
            // Also store in memory for faster access next time
            this.cache[key] = item;
            return item.data;
          } else {
            // Expired item, remove it
            this.storage.removeItem(key);
          }
        }
      } catch (e) {
        console.error("Error reading from sessionStorage:", e);
      }

      return null; // Cache miss
    }

    // Set in both memory and sessionStorage
    set(key, data, ttl = this.defaultTTL) {
      const expires = Date.now() + ttl;
      const item = { data, expires };

      // Store in memory
      this.cache[key] = item;

      // Store in sessionStorage
      try {
        this.storage.setItem(key, JSON.stringify(item));
      } catch (e) {
        console.error("Error writing to sessionStorage:", e);
      }
    }

    // Clear specific item
    clear(key) {
      delete this.cache[key];
      try {
        this.storage.removeItem(key);
      } catch (e) {
        console.error("Error removing from sessionStorage:", e);
      }
    }
  }

  // Create and export singleton instance
  export const cachingService = new CachingService();