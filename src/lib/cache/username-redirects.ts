import db from '@/lib/db';
import { usernameHistory } from '@/lib/db/schema';

/**
 * In-memory cache for username redirects
 * Maps old usernames to current usernames for fast redirects
 *
 * This cache is:
 * - Lazy-loaded on first access
 * - Invalidated when usernames change
 * - Lost on redeploy (acceptable given 30-day change frequency)
 */
const redirectCache = new Map<string, string>();
let cacheInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Get the current username for an old username from cache
 * @param oldUsername - The old username to look up
 * @returns The current username, or null if not found
 */
export async function getUsernameRedirect(
  oldUsername: string
): Promise<string | null> {
  // Initialize cache on first use (lazy loading)
  if (!cacheInitialized) {
    if (!initializationPromise) {
      initializationPromise = initializeCache();
    }
    await initializationPromise;
    cacheInitialized = true;
  }

  return redirectCache.get(oldUsername) || null;
}

/**
 * Initialize the redirect cache from the database
 * Loads all username history entries into memory
 */
async function initializeCache(): Promise<void> {
  try {
    const history = await db.query.usernameHistory.findMany({
      with: {
        user: {
          columns: { username: true },
        },
      },
    });

    for (const entry of history) {
      if (entry.user?.username) {
        redirectCache.set(entry.oldUsername, entry.user.username);
      }
    }

    console.log(
      `Username redirect cache initialized with ${redirectCache.size} entries`
    );
  } catch (error) {
    console.error('Failed to initialize username redirect cache:', error);
    // Continue with empty cache - will fall back to database lookup
  }
}

/**
 * Update the cache when a username changes
 * @param oldUsername - The old username
 * @param newUsername - The new username (or null to remove from cache)
 */
export function updateUsernameRedirect(
  oldUsername: string,
  newUsername?: string
): void {
  if (newUsername) {
    redirectCache.set(oldUsername, newUsername);
  } else {
    redirectCache.delete(oldUsername);
  }
}

/**
 * Force a cache re-initialization
 * Useful for testing or after bulk imports
 */
export async function reinitializeUsernameRedirectCache(): Promise<void> {
  redirectCache.clear();
  cacheInitialized = false;
  initializationPromise = null;
  await initializeCache();
  cacheInitialized = true;
}

/**
 * Get cache statistics (useful for monitoring)
 * @returns Cache size and initialization status
 */
export function getUsernameRedirectCacheStats(): {
  size: number;
  initialized: boolean;
} {
  return {
    size: redirectCache.size,
    initialized: cacheInitialized,
  };
}
