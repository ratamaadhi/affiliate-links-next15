import { getRedisClient, isRedisReady } from './redis';

/**
 * Cache result type
 */
export type CacheResult<T> = {
  hit: boolean;
  data: T | null;
  fromCache: boolean;
};

/**
 * Get data from cache
 * @param key - Cache key
 * @returns Cache result with hit status and data
 */
export const cacheGet = async <T>(key: string): Promise<CacheResult<T>> => {
  const client = getRedisClient();

  if (!client || !isRedisReady()) {
    return { hit: false, data: null, fromCache: false };
  }

  try {
    const cachedData = await client.get(key);

    if (cachedData === null) {
      return { hit: false, data: null, fromCache: false };
    }

    const parsedData = JSON.parse(cachedData) as T;
    return { hit: true, data: parsedData, fromCache: true };
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return { hit: false, data: null, fromCache: false };
  }
};

/**
 * Set data in cache with TTL
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds
 * @returns Success status
 */
export const cacheSet = async <T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> => {
  const client = getRedisClient();

  if (!client || !isRedisReady()) {
    return false;
  }

  try {
    const serializedValue = JSON.stringify(value);
    await client.setex(key, ttlSeconds, serializedValue);
    return true;
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete a specific cache key
 * @param key - Cache key to delete
 * @returns Success status
 */
export const cacheDelete = async (key: string): Promise<boolean> => {
  const client = getRedisClient();

  if (!client || !isRedisReady()) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete multiple cache keys by pattern
 * @param pattern - Cache key pattern (supports wildcards)
 * @returns Number of keys deleted
 */
export const cacheDeletePattern = async (pattern: string): Promise<number> => {
  const client = getRedisClient();

  if (!client || !isRedisReady()) {
    return 0;
  }

  try {
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`Error deleting cache pattern ${pattern}:`, error);
    return 0;
  }
};

/**
 * Get or set pattern - fetch from cache or compute and cache
 * @param key - Cache key
 * @param fetchFn - Function to fetch data if not in cache
 * @param ttlSeconds - Time to live in seconds
 * @returns Cache result with data
 */
export const cacheGetOrSet = async <T>(
  key: string,
  fetchFn: () => Promise<T | null>,
  ttlSeconds: number
): Promise<CacheResult<T>> => {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);

  if (cached.hit && cached.data !== null) {
    return cached;
  }

  // Cache miss, fetch data
  try {
    const data = await fetchFn();

    if (data !== null) {
      await cacheSet(key, data, ttlSeconds);
    }

    return { hit: false, data, fromCache: false };
  } catch (error) {
    console.error(`Error in cacheGetOrSet for key ${key}:`, error);
    return { hit: false, data: null, fromCache: false };
  }
};

/**
 * Invalidate all cache keys for a specific user
 * @param userId - User ID
 * @returns Number of keys invalidated
 */
export const invalidateUserCache = async (userId: number): Promise<number> => {
  const client = getRedisClient();

  if (!client || !isRedisReady()) {
    return 0;
  }

  try {
    const patterns = [
      `affiliate-links:user:pages:${userId}`,
      `affiliate-links:page:${userId}:*`,
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
        totalDeleted += keys.length;
      }
    }

    return totalDeleted;
  } catch (error) {
    console.error(`Error invalidating user cache for user ${userId}:`, error);
    return 0;
  }
};

/**
 * Invalidate all cache keys for a specific username
 * @param username - Username
 * @returns Number of keys invalidated
 */
export const invalidateUsernameCache = async (
  username: string
): Promise<number> => {
  const client = getRedisClient();

  if (!client || !isRedisReady()) {
    return 0;
  }

  try {
    const patterns = [
      `affiliate-links:username:history:${username}`,
      `affiliate-links:username:availability:${username}`,
      `affiliate-links:user:default-page:${username}`,
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
        totalDeleted += keys.length;
      }
    }

    return totalDeleted;
  } catch (error) {
    console.error(
      `Error invalidating username cache for username ${username}:`,
      error
    );
    return 0;
  }
};

/**
 * Invalidate short link cache
 * @param code - Short code
 * @returns Success status
 */
export const invalidateShortLinkCache = async (
  code: string
): Promise<boolean> => {
  return cacheDelete(`affiliate-links:shortlink:${code}`);
};

/**
 * Invalidate page cache
 * @param pageId - Page ID
 * @returns Success status
 */
export const invalidatePageCache = async (pageId: number): Promise<boolean> => {
  return cacheDelete(`affiliate-links:page:${pageId}`);
};

/**
 * Invalidate page by slug cache
 * @param slug - Page slug
 * @returns Success status
 */
export const invalidatePageBySlugCache = async (
  slug: string
): Promise<boolean> => {
  return cacheDelete(`affiliate-links:page:slug:${slug}`);
};

/**
 * Clear all cache (use with caution)
 * @returns Number of keys deleted
 */
export const clearAllCache = async (): Promise<number> => {
  const client = getRedisClient();

  if (!client || !isRedisReady()) {
    return 0;
  }

  try {
    const keys = await client.keys('affiliate-links:*');

    if (keys.length === 0) {
      return 0;
    }

    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return 0;
  }
};
