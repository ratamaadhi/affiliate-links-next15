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
 * Set of deleted short link codes
 * Used to prevent redirecting to deleted short links
 * This is populated from Redis tombstones by the page component
 */
const deletedShortLinks = new Set<string>();

/**
 * Get a redirect from the middleware cache
 * @param code - Short code to look up
 * @returns The cached redirect info, or null if not found/expired/deleted
 */
export function getMiddlewareRedirect(
  code: string
): MiddlewareCacheEntry | null {
  // Check if this short link has been deleted
  if (deletedShortLinks.has(code)) {
    return null;
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
  deletedShortLinks.add(code);
}

/**
 * Sync deleted short links from Redis tombstones
 * This should be called periodically by the page component to ensure
 * all instances know about recently deleted short links
 * @param deletedCodes - Array of short codes that have been deleted
 */
export function syncDeletedShortLinks(deletedCodes: string[]): void {
  for (const code of deletedCodes) {
    deletedShortLinks.add(code);
    // Also remove from the redirect cache
    cache.delete(code);
  }
}

/**
 * Get cache statistics
 * @returns Cache size and deleted links count
 */
export function getMiddlewareCacheStats(): {
  size: number;
  deletedCount: number;
} {
  return {
    size: cache.size,
    deletedCount: deletedShortLinks.size,
  };
}
