import db from '@/lib/db';
import { user, usernameHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
 *
 * IMPORTANT: We must exclude usernames that are currently active to prevent
 * redirecting valid usernames to other users.
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

    // Get all currently active usernames
    const activeUsers = await db.query.user.findMany({
      columns: { username: true },
    });
    const activeUsernameSet = new Set(activeUsers.map((u) => u.username));

    for (const entry of history) {
      if (entry.user?.username) {
        const oldUsername = entry.oldUsername;
        const newUsername = entry.user.username;

        // Only cache if:
        // 1. The old username is NOT currently active (prevents redirecting valid usernames)
        // 2. The new username IS currently active (ensures redirect target exists)
        if (
          !activeUsernameSet.has(oldUsername) &&
          activeUsernameSet.has(newUsername)
        ) {
          redirectCache.set(oldUsername, newUsername);
        }
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
    // Add redirect from old to new username
    redirectCache.set(oldUsername, newUsername);

    // IMPORTANT: Remove any existing redirect that has newUsername as the old key
    // This prevents redirecting a newly taken username to its previous owner
    redirectCache.delete(newUsername);
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
