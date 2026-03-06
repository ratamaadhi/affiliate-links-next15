import { cacheGet, cacheSet } from './cache-manager';
import {
  SHORT_LINK_KEY,
  CACHE_TTL,
  SHORT_LINK_DELETED_KEY,
} from './cache-keys';
import { isShortLinkDeleted } from './middleware-cache';
import db from '@/lib/db';
import { shortLink } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface ShortLinkRedirect {
  targetUrl: string;
  shortCode: string;
  expiresAt?: number;
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
 * Map of pending database queries to prevent cache stampede
 * Ensures only one database query per short code at a time
 */
const pendingQueries = new Map<string, Promise<ShortLinkRedirect | null>>();

/**
 * Get a short link redirect by its short code from cache only
 * This is safe to use in edge runtime/middleware
 * Uses a two-tier caching strategy:
 * 1. In-memory cache (fastest, O(1))
 * 2. Redis cache (fast, shared across instances)
 *
 * @param shortCode - The short code to look up
 * @returns The redirect info, or null if not found in cache
 */
export async function getShortLinkRedirectFromCache(
  shortCode: string
): Promise<ShortLinkRedirect | null> {
  // 1. Check in-memory cache first (O(1))
  const memCached = redirectCache.get(shortCode);
  if (memCached) {
    // Check expiration before returning
    if (memCached.expiresAt && memCached.expiresAt < Date.now()) {
      redirectCache.delete(shortCode);
      return null;
    }
    return memCached;
  }

  // 2. Check Redis cache
  const redisCached = await cacheGet<ShortLinkRedirect>(
    SHORT_LINK_KEY(shortCode)
  );
  if (redisCached.hit && redisCached.data) {
    // Check expiration before returning
    if (redisCached.data.expiresAt && redisCached.data.expiresAt < Date.now()) {
      // Expired - don't cache and return null
      return null;
    }
    // Populate in-memory cache from Redis
    redirectCache.set(shortCode, redisCached.data);
    return redisCached.data;
  }

  // Not in cache - return null (caller can query database)
  return null;
}

/**
 * Get a short link redirect by its short code with database fallback
 * This should NOT be used in edge runtime/middleware
 * Uses a three-tier caching strategy:
 * 1. In-memory cache (fastest, O(1))
 * 2. Redis cache (fast, shared across instances)
 * 3. Database lookup (slower, but always fresh)
 *
 * Uses a promise-guard pattern to prevent cache stampede:
 * Multiple concurrent requests for the same uncached short code
 * will share a single database query.
 *
 * @param shortCode - The short code to look up
 * @returns The redirect info, or null if not found or expired
 */
export async function getShortLinkRedirect(
  shortCode: string
): Promise<ShortLinkRedirect | null> {
  // CRITICAL: Check tombstone FIRST before any cache lookups
  // This prevents returning cached data for deleted short links
  // Two-tier check: 1) Redis tombstone (shared across instances) 2) Local deleted set (fallback)
  try {
    const deletedResult = await cacheGet<boolean>(
      SHORT_LINK_DELETED_KEY(shortCode)
    );
    if (deletedResult.hit && deletedResult.data) {
      // Clean up cache and pending queries to prevent stale data
      redirectCache.delete(shortCode);
      pendingQueries.delete(shortCode);
      return null;
    }
  } catch (error) {
    console.error('Failed to check Redis deleted short link status:', error);
  }

  // Fallback: Check local deleted set (when Redis is not available)
  const isDeleted = isShortLinkDeleted(shortCode);
  if (isDeleted) {
    // CRITICAL: Clean up cache and pending queries to prevent stale data
    // This prevents returning cached data after the deleted entry expires
    redirectCache.delete(shortCode);
    pendingQueries.delete(shortCode);
    return null;
  }

  // 1. Check in-memory cache first (O(1))
  const memCached = redirectCache.get(shortCode);
  if (memCached) {
    // Check expiration before returning
    if (memCached.expiresAt && memCached.expiresAt < Date.now()) {
      redirectCache.delete(shortCode);
      return null;
    }
    // Return cached data directly - no DB query needed
    // Tombstone checks (Redis + local deletedShortLinks) are done above
    return memCached;
  }

  // 2. Check Redis cache
  const redisCached = await cacheGet<ShortLinkRedirect>(
    SHORT_LINK_KEY(shortCode)
  );
  if (redisCached.hit && redisCached.data) {
    // Check expiration before returning
    if (redisCached.data.expiresAt && redisCached.data.expiresAt < Date.now()) {
      // Expired - don't cache and return null
      return null;
    }
    // Populate in-memory cache from Redis
    redirectCache.set(shortCode, redisCached.data);
    return redisCached.data;
  }

  // 3. Check if a query is already in flight (prevent cache stampede)
  let queryPromise = pendingQueries.get(shortCode);
  if (!queryPromise) {
    // No query in flight - start one
    queryPromise = (async () => {
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
          expiresAt: link.expiresAt,
        };

        // Cache in memory and Redis
        redirectCache.set(shortCode, redirect);
        await cacheSet(
          SHORT_LINK_KEY(shortCode),
          redirect,
          CACHE_TTL.SHORT_LINK
        );

        return redirect;
      } catch (error) {
        console.error('Error fetching short link redirect:', error);
        return null;
      } finally {
        // Clean up pending query after completion
        pendingQueries.delete(shortCode);
      }
    })();

    // Store the promise so concurrent requests can share it
    pendingQueries.set(shortCode, queryPromise);
  }

  // Await the query (either we started it, or it was already in flight)
  return queryPromise;
}

/**
 * Invalidate the in-memory cache for a specific short code
 * Called when a short link is created, updated, or deleted
 *
 * CRITICAL: Also clears pending queries to prevent stale data from being returned
 *
 * @param shortCode - The short code to invalidate
 */
export function invalidateShortLinkRedirectCache(shortCode: string): void {
  redirectCache.delete(shortCode);
  // CRITICAL: Also clear pending queries to prevent returning stale data
  pendingQueries.delete(shortCode);
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
