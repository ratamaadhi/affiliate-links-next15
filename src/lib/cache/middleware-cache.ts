/**
 * Shared in-memory cache for middleware short link redirects
 * This avoids Redis/ioredis edge runtime compatibility issues
 *
 * Both the middleware and page components can access this cache.
 * - Middleware: reads from cache for fast 301 redirects
 * - Page component: populates cache after database lookups
 */

export interface MiddlewareCacheEntry {
  targetUrl: string;
  expiresAt?: number;
}

const cache = new Map<string, MiddlewareCacheEntry>();

/**
 * TTL for deleted short links in memory (1 hour)
 * Matches the Redis tombstone TTL to ensure consistency
 */
const DELETED_LINK_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Map of deleted short link codes with their deletion timestamps
 * Used to prevent redirecting to deleted short links
 * This is populated from Redis tombstones by the page component
 *
 * Uses Map instead of Set to track deletion time for automatic cleanup
 */
const deletedShortLinks = new Map<string, number>();

/**
 * Clean up expired entries from the deleted short links map
 * This prevents memory leaks by removing entries older than TTL
 * @param forceCleanup - If true, cleans up all expired entries (default: false)
 * @returns Number of entries removed
 */
function cleanupExpiredDeletedLinks(forceCleanup = false): number {
  const now = Date.now();
  let removed = 0;

  // Only cleanup periodically (every 100 calls) to avoid performance impact
  // unless forceCleanup is true
  const shouldCleanup = forceCleanup || Math.random() < 0.01; // 1% chance

  if (!shouldCleanup) {
    return 0;
  }

  for (const [code, timestamp] of deletedShortLinks.entries()) {
    if (now - timestamp > DELETED_LINK_TTL) {
      deletedShortLinks.delete(code);
      removed++;
    }
  }

  return removed;
}

/**
 * Get a redirect from the middleware cache
 * @param code - Short code to look up
 * @returns The cached redirect info, or null if not found/expired/deleted
 */
export function getMiddlewareRedirect(
  code: string
): MiddlewareCacheEntry | null {
  // Trigger cleanup periodically (this is cheap and runs inline)
  cleanupExpiredDeletedLinks();

  // Check if this short link has been deleted
  const deletionTime = deletedShortLinks.get(code);
  if (deletionTime !== undefined) {
    // Check if the deletion entry has expired
    const now = Date.now();
    if (now - deletionTime > DELETED_LINK_TTL) {
      // Entry expired, remove it and allow the redirect check to continue
      deletedShortLinks.delete(code);
    } else {
      return null;
    }
  }

  const entry = cache.get(code);

  if (!entry) {
    return null;
  }

  // Check expiration
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    cache.delete(code);
    return null;
  }

  return entry;
}

/**
 * Add or update a redirect in the middleware cache
 * @param code - Short code
 * @param targetUrl - Target URL
 * @param expiresAt - Optional expiration timestamp
 */
export function setMiddlewareRedirect(
  code: string,
  targetUrl: string,
  expiresAt?: number
): void {
  cache.set(code, { targetUrl, expiresAt });
}

/**
 * Remove a redirect from the middleware cache
 * Also marks the short link as deleted to prevent future redirects
 * @param code - Short code to remove
 */
export function deleteMiddlewareRedirect(code: string): void {
  cache.delete(code);
  // Store the deletion timestamp for TTL-based cleanup
  deletedShortLinks.set(code, Date.now());
}

/**
 * Sync deleted short links from Redis tombstones
 * This should be called periodically by the page component to ensure
 * all instances know about recently deleted short links
 * @param deletedCodes - Array of short codes that have been deleted
 */
export function syncDeletedShortLinks(deletedCodes: string[]): void {
  const now = Date.now();
  for (const code of deletedCodes) {
    // Store the deletion timestamp (using current time as these come from Redis)
    deletedShortLinks.set(code, now);
    // Also remove from the redirect cache
    cache.delete(code);
  }
}

/**
 * Check if a short link has been deleted (local check)
 * This is used as a fallback when Redis is not available
 * @param code - Short code to check
 * @returns True if the short link has been deleted
 */
export function isShortLinkDeleted(code: string): boolean {
  // Trigger cleanup periodically
  cleanupExpiredDeletedLinks();

  const deletionTime = deletedShortLinks.get(code);
  if (deletionTime === undefined) {
    return false;
  }

  // Check if the deletion entry has expired
  const now = Date.now();
  if (now - deletionTime > DELETED_LINK_TTL) {
    // Entry expired, remove it
    deletedShortLinks.delete(code);
    return false;
  }

  return true;
}

/**
 * Get cache statistics
 * @returns Cache size and deleted links count
 */
export function getMiddlewareCacheStats(): {
  size: number;
  deletedCount: number;
} {
  // Trigger cleanup before returning stats
  cleanupExpiredDeletedLinks();

  return {
    size: cache.size,
    deletedCount: deletedShortLinks.size,
  };
}

/**
 * Manually trigger cleanup of expired deleted link entries
 * This can be called periodically or on demand to free memory
 * @returns Number of entries removed
 */
export function cleanupDeletedLinks(): number {
  return cleanupExpiredDeletedLinks(true);
}
