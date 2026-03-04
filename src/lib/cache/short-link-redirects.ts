import { cacheGet, cacheSet } from './cache-manager';
import { SHORT_LINK_KEY, CACHE_TTL } from './cache-keys';
import db from '@/lib/db';
import { shortLink } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface ShortLinkRedirect {
  targetUrl: string;
  shortCode: string;
}

/**
 * In-memory cache for short link redirects
 * Provides O(1) lookup for frequently accessed short links
 *
 * This cache is:
 * - Lazy-loaded on first access per short code
 * - Backed by Redis for persistence across serverless instances
 * - Invalidated when short links are created/updated/deleted
 */
const redirectCache = new Map<string, ShortLinkRedirect>();

/**
 * Get a short link redirect by its short code
 * Uses a three-tier caching strategy:
 * 1. In-memory cache (fastest, O(1))
 * 2. Redis cache (fast, shared across instances)
 * 3. Database lookup (slower, but always fresh)
 *
 * @param shortCode - The short code to look up
 * @returns The redirect info, or null if not found or expired
 */
export async function getShortLinkRedirect(
  shortCode: string
): Promise<ShortLinkRedirect | null> {
  // 1. Check in-memory cache first (O(1))
  const memCached = redirectCache.get(shortCode);
  if (memCached) {
    return memCached;
  }

  // 2. Check Redis cache
  const redisCached = await cacheGet<ShortLinkRedirect>(
    SHORT_LINK_KEY(shortCode)
  );
  if (redisCached.hit && redisCached.data) {
    // Populate in-memory cache from Redis
    redirectCache.set(shortCode, redisCached.data);
    return redisCached.data;
  }

  // 3. Query database
  try {
    const link = await db.query.shortLink.findFirst({
      where: eq(shortLink.shortCode, shortCode),
      columns: { targetUrl: true, shortCode: true, expiresAt: true },
    });

    if (!link) {
      return null;
    }

    // Check expiration
    if (link.expiresAt && link.expiresAt < Date.now()) {
      return null;
    }

    const redirect: ShortLinkRedirect = {
      targetUrl: link.targetUrl,
      shortCode: link.shortCode,
    };

    // Cache in memory and Redis
    redirectCache.set(shortCode, redirect);
    await cacheSet(SHORT_LINK_KEY(shortCode), redirect, CACHE_TTL.SHORT_LINK);

    return redirect;
  } catch (error) {
    console.error('Error fetching short link redirect:', error);
    return null;
  }
}

/**
 * Invalidate the in-memory cache for a specific short code
 * Called when a short link is created, updated, or deleted
 *
 * @param shortCode - The short code to invalidate
 */
export function invalidateShortLinkRedirectCache(shortCode: string): void {
  redirectCache.delete(shortCode);
}

/**
 * Get cache statistics (useful for monitoring)
 * @returns Cache size
 */
export function getShortLinkRedirectCacheStats(): {
  size: number;
} {
  return {
    size: redirectCache.size,
  };
}
