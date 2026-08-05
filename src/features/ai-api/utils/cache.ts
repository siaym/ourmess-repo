/**
 * A simple in-memory cache for generic read-only endpoints.
 * Never cache personal user data (e.g. balances).
 */

const cacheStore = new Map<string, { value: any; expiry: number }>();

export const aiCache = {
  get: <T>(key: string): T | null => {
    const item = cacheStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      cacheStore.delete(key);
      return null;
    }
    return item.value as T;
  },
  
  set: (key: string, value: any, ttlSeconds: number = 60) => {
    cacheStore.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  },

  delete: (key: string) => {
    cacheStore.delete(key);
  },

  clear: () => {
    cacheStore.clear();
  }
};
