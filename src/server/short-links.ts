'use server';

import { auth } from '@/lib/auth';
import {
  invalidateShortLinkCache,
  invalidateUserCache,
  cacheSet,
} from '@/lib/cache/cache-manager';
import { invalidateShortLinkRedirectCache } from '@/lib/cache/short-link-redirects';
import { deleteMiddlewareRedirect } from '@/lib/cache/middleware-cache';
import { SHORT_LINK_DELETED_KEY, CACHE_TTL } from '@/lib/cache/cache-keys';
import db from '@/lib/db';
import {
  page,
  shortLink,
  user,
  linkClickHistory,
  type ShortLinkSelect,
} from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { headers } from 'next/headers';

const generateShortCode = async (): Promise<string> => {
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const code = nanoid(6);

    // OPTIMIZATION: Uses unique index on short_link.short_code (created in migration 0006)
    // This query is highly optimized with O(log n) lookup time
    const existing = await db.query.shortLink.findFirst({
      where: eq(shortLink.shortCode, code),
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error(
    'Failed to generate unique short code after multiple attempts'
  );
};

export const createShortLink = async (
  pageId: number,
  userId: number,
  targetUrl?: string
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const sessionUserId = +session?.user?.id;

    if (!sessionUserId) {
      return { success: false, message: 'User not authenticated' };
    }

    if (sessionUserId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }

    const shortCode = await generateShortCode();

    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/s/${shortCode}`;

    let finalTargetUrl = targetUrl;

    if (!finalTargetUrl) {
      const pageData = await db.query.page.findFirst({
        where: eq(page.id, pageId),
        columns: { slug: true },
      });

      if (pageData) {
        const userData = await db.query.user.findFirst({
          where: eq(user.id, userId),
          columns: { username: true },
        });

        if (!userData?.username) {
          return {
            success: false,
            message:
              'User not found - cannot generate short link without username',
          };
        }

        // For default page (slug equals username), use /{username}
        // For other pages, use /{username}/{slug}
        const isDefaultPage = pageData.slug === userData.username;
        finalTargetUrl = isDefaultPage
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/${userData.username}`
          : `${process.env.NEXT_PUBLIC_BASE_URL}/${userData.username}/${pageData.slug}`;
      } else {
        return {
          success: false,
          message: 'Page not found - cannot generate short link',
        };
      }
    }

    await db.insert(shortLink).values({
      shortCode,
      targetUrl: finalTargetUrl,
      pageId,
      userId,
      createdAt: Date.now(),
    });

    await invalidateUserCache(userId);

    return { success: true, data: { shortCode, shortUrl } };
  } catch (error) {
    console.error('Failed to create short link:', error);
    return { success: false, message: 'Failed to create short link' };
  }
};

export const getShortLinkByCode = async (
  shortCode: string
): Promise<ShortLinkSelect | null> => {
  try {
    // OPTIMIZATION: Uses unique index on short_link.short_code (created in migration 0006)
    // This query is highly optimized with O(log n) lookup time
    const link = await db.query.shortLink.findFirst({
      where: eq(shortLink.shortCode, shortCode),
    });

    if (!link) {
      return null;
    }

    if (link.expiresAt && link.expiresAt < Date.now()) {
      return null;
    }

    return link;
  } catch (error) {
    console.error('Failed to get short link:', error);
    return null;
  }
};

export const trackShortLinkClick = async (shortCode: string) => {
  try {
    // OPTIMIZATION: Uses unique index on short_link.short_code (created in migration 0006)
    // This update query is optimized with O(log n) lookup time
    // First get the short link ID
    const [shortLinkData] = await db
      .select({ id: shortLink.id })
      .from(shortLink)
      .where(eq(shortLink.shortCode, shortCode));

    if (!shortLinkData) {
      return { success: false };
    }

    // Update click count
    await db
      .update(shortLink)
      .set({
        clickCount: sql`${shortLink.clickCount} + 1`,
      })
      .where(eq(shortLink.shortCode, shortCode));

    // Record click history asynchronously (non-blocking)
    db.insert(linkClickHistory)
      .values({
        shortLinkId: shortLinkData.id,
        clickedAt: Date.now(),
      })
      .catch((err) => {
        // Log error but don't fail the click tracking
        console.error('Failed to record click history:', err);
      });

    return { success: true };
  } catch (error) {
    console.error('Failed to track short link click:', error);
    return { success: false };
  }
};

export const getUserShortLinks = async (userId: number, pageId?: number) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const sessionUserId = +session?.user?.id;

    if (!sessionUserId) {
      return { success: false, message: 'User not authenticated' };
    }

    if (sessionUserId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }

    const whereCondition = pageId
      ? and(eq(shortLink.userId, userId), eq(shortLink.pageId, pageId))
      : eq(shortLink.userId, userId);

    // OPTIMIZATION: Uses index on short_link.user_id (created in migration 0006)
    // When pageId is provided, also uses index on short_link.page_id (created in migration 0006)
    // The JOIN with page table is optimized by foreign key indexes
    const links = await db.query.shortLink.findMany({
      where: whereCondition,
      with: {
        page: {
          columns: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: (shortLink, { desc }) => [desc(shortLink.createdAt)],
    });

    return { success: true, data: links };
  } catch (error) {
    console.error('Failed to get user short links:', error);
    return { success: false, message: 'Failed to get short links' };
  }
};

export const deleteShortLink = async (id: number, userId: number) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const sessionUserId = +session?.user?.id;

    if (!sessionUserId) {
      return { success: false, message: 'User not authenticated' };
    }

    // OPTIMIZATION: Uses primary key index on short_link.id
    // This query is highly optimized with O(log n) lookup time
    const link = await db.query.shortLink.findFirst({
      where: eq(shortLink.id, id),
    });

    if (!link) {
      return { success: false, message: 'Short link not found' };
    }

    if (link.userId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // CRITICAL: Set tombstone FIRST before any cache invalidation or deletion
    // This prevents race conditions where a concurrent request might re-populate
    // the cache with the deleted link data before the tombstone is checked.
    // The tombstone marks the link as deleted across all serverless instances immediately.
    await cacheSet(
      SHORT_LINK_DELETED_KEY(link.shortCode),
      true,
      CACHE_TTL.SHORT_LINK
    );

    // Now safe to delete from database and invalidate all caches
    await db.delete(shortLink).where(eq(shortLink.id, id));

    // Invalidate cache for the deleted short link (Redis, in-memory caches, and middleware)
    await invalidateShortLinkCache(link.shortCode);
    invalidateShortLinkRedirectCache(link.shortCode);
    deleteMiddlewareRedirect(link.shortCode);

    // Invalidate user cache to ensure deleted link is removed from user's list
    await invalidateUserCache(userId);

    return { success: true, message: 'Short link deleted successfully' };
  } catch (error) {
    console.error('Failed to delete short link:', error);
    return { success: false, message: 'Failed to delete short link' };
  }
};

export const createShortLinkForPage = async (
  pageId: number,
  userId: number
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const sessionUserId = +session?.user?.id;

    if (!sessionUserId) {
      return { success: false, message: 'User not authenticated' };
    }

    if (sessionUserId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify page belongs to user
    const pageData = await db.query.page.findFirst({
      where: and(eq(page.id, pageId), eq(page.userId, userId)),
      columns: { id: true, slug: true },
    });

    if (!pageData) {
      return { success: false, message: 'Page not found or unauthorized' };
    }

    // Generate new short code
    const shortCode = await generateShortCode();

    // Build target URL
    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { username: true },
    });

    if (!userData?.username) {
      return { success: false, message: 'User not found' };
    }

    // For default page (slug equals username), use /{username}
    // For other pages, use /{username}/{slug}
    const isDefaultPage = pageData.slug === userData.username;
    const targetUrl = isDefaultPage
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/${userData.username}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/${userData.username}/${pageData.slug}`;
    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/s/${shortCode}`;

    // Create new short link
    const [newLink] = await db
      .insert(shortLink)
      .values({
        shortCode,
        targetUrl,
        pageId,
        userId,
        createdAt: Date.now(),
      })
      .returning();

    // Invalidate cache
    await invalidateShortLinkCache(shortCode);
    await invalidateUserCache(userId);

    return {
      success: true,
      data: {
        shortCode,
        shortUrl,
        link: newLink,
      },
    };
  } catch (error) {
    console.error('Failed to create short link for page:', error);
    return { success: false, message: 'Failed to create short link' };
  }
};

/**
 * Build target URL for a page's short link
 * For default page (slug equals username): /{username}
 * For other pages: /{username}/{slug}
 */
const buildTargetUrl = (username: string, pageSlug: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const isDefaultPage = pageSlug === username;
  return isDefaultPage
    ? `${baseUrl}/${username}`
    : `${baseUrl}/${username}/${pageSlug}`;
};

/**
 * Update all short link URLs for a page when the page's slug changes
 * This ensures short links always redirect to the correct URL
 */
export const updateShortLinksForPageSlug = async (
  pageId: number,
  userId: number,
  newSlug: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const sessionUserId = +session?.user?.id;

    if (!sessionUserId) {
      return { success: false, message: 'User not authenticated' };
    }

    if (sessionUserId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Get user data
    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { username: true },
    });

    if (!userData?.username) {
      return { success: false, message: 'User not found' };
    }

    // Build new target URL
    const newTargetUrl = buildTargetUrl(userData.username, newSlug);

    // Get all short links for this page
    const existingLinks = await db.query.shortLink.findMany({
      where: and(eq(shortLink.pageId, pageId), eq(shortLink.userId, userId)),
      columns: { id: true, shortCode: true, targetUrl: true },
    });

    if (existingLinks.length === 0) {
      // No short links to update
      return { success: true, message: 'No short links to update' };
    }

    // Update all short links with the new target URL
    await db
      .update(shortLink)
      .set({ targetUrl: newTargetUrl })
      .where(and(eq(shortLink.pageId, pageId), eq(shortLink.userId, userId)));

    // Invalidate cache for all affected short codes
    await Promise.all(
      existingLinks.map((link) => invalidateShortLinkCache(link.shortCode))
    );

    // Invalidate user cache
    await invalidateUserCache(userId);

    return {
      success: true,
      message: `Updated ${existingLinks.length} short link(s)`,
    };
  } catch (error) {
    console.error('Failed to update short links for page slug:', error);
    return { success: false, message: 'Failed to update short links' };
  }
};

export { generateShortCode };
