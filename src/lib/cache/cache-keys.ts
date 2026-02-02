/**
 * Cache key constants for the application
 * Follows naming convention: {namespace}:{identifier}:{value}
 */

export const CACHE_PREFIX = 'affiliate-links';

/**
 * Username history cache keys
 * Format: username:history:{username}
 */
export const USERNAME_HISTORY_KEY = (username: string): string =>
  `${CACHE_PREFIX}:username:history:${username}`;

/**
 * Username availability cache keys
 * Format: username:availability:{username}:{userId}
 */
export const USERNAME_AVAILABILITY_KEY = (
  username: string,
  userId?: number
): string =>
  userId
    ? `${CACHE_PREFIX}:username:availability:${username}:${userId}`
    : `${CACHE_PREFIX}:username:availability:${username}:anonymous`;

/**
 * Short link cache keys
 * Format: shortlink:{code}
 */
export const SHORT_LINK_KEY = (code: string): string =>
  `${CACHE_PREFIX}:shortlink:${code}`;

/**
 * User pages cache keys
 * Format: user:pages:{userId}
 */
export const USER_PAGES_KEY = (userId: number): string =>
  `${CACHE_PREFIX}:user:pages:${userId}`;

/**
 * Page data cache keys
 * Format: page:{pageId}
 */
export const PAGE_DATA_KEY = (pageId: number): string =>
  `${CACHE_PREFIX}:page:${pageId}`;

/**
 * Page by slug cache keys
 * Format: page:slug:{slug}
 */
export const PAGE_BY_SLUG_KEY = (slug: string): string =>
  `${CACHE_PREFIX}:page:slug:${slug}`;

/**
 * User default page cache keys
 * Format: user:default-page:{username}
 */
export const USER_DEFAULT_PAGE_KEY = (username: string): string =>
  `${CACHE_PREFIX}:user:default-page:${username}`;

/**
 * Cache TTL (Time To Live) constants in seconds
 */
export const CACHE_TTL = {
  USERNAME_HISTORY: 24 * 60 * 60, // 24 hours
  USERNAME_AVAILABILITY: 5 * 60, // 5 minutes
  SHORT_LINK: 60 * 60, // 1 hour
  USER_PAGES: 10 * 60, // 10 minutes
  PAGE_DATA: 15 * 60, // 15 minutes
  PAGE_BY_SLUG: 15 * 60, // 15 minutes
  USER_DEFAULT_PAGE: 10 * 60, // 10 minutes
} as const;
