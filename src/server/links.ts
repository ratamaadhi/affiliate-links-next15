'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import {
  LinkInsert,
  link as linkSchema,
  page as pageSchema,
  shortLink,
} from '@/lib/db/schema';
import { checkUrlHealth, type HealthCheckResult } from '@/lib/health-check';
import { InPagination, SessionUser } from '@/lib/types';
import { and, asc, count, eq, like, or, sql } from 'drizzle-orm';
import { headers } from 'next/headers';

// Helper function to get authenticated user
const getAuthenticatedUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session.user as SessionUser;
  if (!user?.id) {
    return null;
  }
  return user;
};

// OPTIMIZATION: Uses primary key index on link.id and foreign key index on link.page_id
// The LEFT JOIN is optimized by the foreign key relationship
const verifyLinkOwnership = async (linkId: number, userId: number) => {
  const [link] = await db
    .select({
      id: linkSchema.id,
      isActive: linkSchema.isActive,
      pageId: linkSchema.pageId,
      ownerId: pageSchema.userId,
    })
    .from(linkSchema)
    .leftJoin(pageSchema, eq(linkSchema.pageId, pageSchema.id))
    .where(eq(linkSchema.id, linkId));

  if (!link) {
    throw new Error('Link not found');
  }

  if (link.ownerId !== userId) {
    throw new Error(
      'Forbidden: You do not have permission to modify this link.'
    );
  }

  return link;
};

export const createLink = async (
  _url: string,
  { arg }: { arg: LinkInsert }
) => {
  let defaultPageId = arg.pageId;
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!arg.pageId) {
      // OPTIMIZATION: Uses index on page.slug (created in migration 0011)
      // This query efficiently retrieves the default page for a user
      const getPageByUsername = await db.query.page.findFirst({
        where: eq(pageSchema.slug, user.username),
      });
      if (!getPageByUsername) {
        return { success: false, message: 'Default page not found for user' };
      }
      defaultPageId = getPageByUsername.id;
    }

    let newDisplayOrder = arg.displayOrder || 1;

    // If displayOrder is provided, calculate the fractional index
    if (arg.displayOrder) {
      // OPTIMIZATION: Uses composite index on (page_id, display_order) (created in migration 0011)
      // This query efficiently retrieves all links for a page in display order
      const allLinks = await db.query.link.findMany({
        where: eq(linkSchema.pageId, defaultPageId),
        orderBy: [asc(linkSchema.displayOrder)],
      });

      const targetIndex = arg.displayOrder - 1;
      const prevLink = allLinks[targetIndex - 1];
      const nextLink = allLinks[targetIndex];

      const prevOrder = prevLink ? prevLink.displayOrder : 0;
      const nextOrder = nextLink ? nextLink.displayOrder : prevOrder + 2;

      newDisplayOrder = (prevOrder + nextOrder) / 2;
    } else {
      // Default behavior if no displayOrder provided
      // OPTIMIZATION: Uses composite index on (page_id, display_order) (created in migration 0011)
      // This query efficiently retrieves the first link for a page
      const firstLink = await db.query.link.findFirst({
        where: eq(linkSchema.pageId, defaultPageId),
        orderBy: [asc(linkSchema.displayOrder)],
      });
      newDisplayOrder = firstLink ? firstLink.displayOrder / 2 : 1;
    }

    const result = await db
      .insert(linkSchema)
      .values({
        ...arg,
        pageId: defaultPageId,
        displayOrder: newDisplayOrder,
      })
      .returning();

    const newLinkId = result[0].id;

    // Trigger async health check in background
    checkLinkHealth('', { arg: { linkId: newLinkId } }).catch((error) => {
      console.error('Background health check failed:', error);
    });

    return { success: true, message: 'Link created successfully' };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to create link';
    console.error('Failed to create link:', e);
    return { success: false, message };
  }
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
};

async function fetchPaginatedLinks(
  params: PaginationParams & { pageId: number }
) {
  const { page = 1, limit = 5, search, pageId } = params;
  const offset = (page - 1) * limit;

  const whereCondition = search
    ? and(
        eq(linkSchema.pageId, pageId),
        or(
          like(linkSchema.title, `%${search}%`),
          like(linkSchema.description, `%${search}%`),
          like(linkSchema.url, `%${search}%`)
        )
      )
    : eq(linkSchema.pageId, pageId);

  // OPTIMIZATION: Uses composite index on (page_id, display_order) (created in migration 0011)
  // When search is provided, uses LIKE queries (not indexed, but acceptable for search)
  // The Promise.all executes all three queries in parallel for better performance
  const [links, [totalItems], pageShortLink] = await Promise.all([
    db.query.link.findMany({
      where: whereCondition,
      orderBy: (links, { asc }) => [asc(links.displayOrder)],
      limit,
      offset,
    }),
    db.select({ count: count() }).from(linkSchema).where(whereCondition),
    db.query.shortLink.findFirst({
      where: eq(shortLink.pageId, pageId),
      columns: { shortCode: true },
    }),
  ]);

  const totalPages = Math.ceil(Number(totalItems.count) / limit);

  const pagination: InPagination = {
    totalItems: Number(totalItems.count),
    itemCount: links.length,
    itemsPerPage: limit,
    totalPages,
    currentPage: page,
  };

  const shortUrl = pageShortLink
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/s/${pageShortLink.shortCode}`
    : null;

  return {
    data: links,
    pagination,
    shortUrl,
  };
}

async function fetchPaginatedActiveLinks(
  params: PaginationParams & { pageId: number }
) {
  const { page = 1, limit = 5, search, pageId } = params;
  const offset = (page - 1) * limit;

  const whereCondition = search
    ? and(
        eq(linkSchema.pageId, pageId),
        eq(linkSchema.isActive, true),
        or(
          like(linkSchema.url, `%${search}%`),
          like(linkSchema.title, `%${search}%`),
          like(linkSchema.description, `%${search}%`)
        )
      )
    : and(eq(linkSchema.pageId, pageId), eq(linkSchema.isActive, true));

  // OPTIMIZATION: Uses composite index on (page_id, is_active, display_order) (created in migration 0011)
  // When search is provided, uses LIKE queries (not indexed, but acceptable for search)
  // The Promise.all executes all queries in parallel for better performance
  // Fetch ALL links (active + inactive) for this page to calculate positions
  // This matches the admin panel logic in update-position-button.tsx
  const [links, [totalItems], pageShortLink, allLinksForPage] =
    await Promise.all([
      db.query.link.findMany({
        where: whereCondition,
        orderBy: (links, { asc }) => [asc(links.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(linkSchema).where(whereCondition),
      db.query.shortLink.findFirst({
        where: eq(shortLink.pageId, pageId),
        columns: { shortCode: true },
      }),
      // Fetch ALL links (active + inactive) for this page to calculate positions
      // This matches the admin panel logic in update-position-button.tsx
      db.query.link.findMany({
        where: eq(linkSchema.pageId, pageId), // NO isActive filter - get ALL links
        orderBy: (links, { asc }) => [asc(links.displayOrder)],
      }),
    ]);

  // Calculate position for each link (same logic as admin panel)
  // Position is based on rank among ALL links (active + inactive)
  // OPTIMIZATION: Build a Map for O(1) position lookups instead of O(n) findIndex
  const positionMap = new Map(allLinksForPage.map((l, i) => [l.id, i + 1]));
  const linksWithPosition = links.map((link) => ({
    ...link,
    position: positionMap.get(link.id) ?? 0,
  }));

  const totalPages = Math.ceil(Number(totalItems.count) / limit);

  const pagination: InPagination = {
    totalItems: Number(totalItems.count),
    itemCount: links.length,
    itemsPerPage: limit,
    totalPages,
    currentPage: page,
  };

  const shortUrl = pageShortLink
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/s/${pageShortLink.shortCode}`
    : null;

  return {
    data: linksWithPosition,
    pagination,
    shortUrl,
  };
}

export const getLinks = async (
  params: PaginationParams & { pageId?: number }
) => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    let resolvedPageId = params.pageId;
    if (!resolvedPageId) {
      // OPTIMIZATION: Uses index on page.slug (created in migration 0011)
      // This query efficiently retrieves the default page for a user
      const userDefaultPage = await db.query.page.findFirst({
        where: eq(pageSchema.slug, user.username),
        columns: { id: true },
      });
      if (!userDefaultPage) {
        throw new Error('Default page not found for user');
      }
      resolvedPageId = userDefaultPage.id;
    }

    const data = await fetchPaginatedLinks({
      ...params,
      pageId: resolvedPageId,
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get links';
    return { success: false, message };
  }
};

export const switchIsActiveLink = async (
  _url: string,
  { arg }: { arg: { id: number } }
) => {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.id) {
      return { success: false, message: 'User not found' };
    }

    const link = await verifyLinkOwnership(arg.id, +user.id);

    await db
      .update(linkSchema)
      .set({ isActive: !link.isActive })
      .where(eq(linkSchema.id, arg.id));
    return { success: true, message: 'Link status updated' };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to switch active Link';
    console.error('Failed to switch active Link:', error);
    return { success: false, message };
  }
};

export const deleteLink = async (
  _url: string,
  { arg }: { arg: { id: number } }
) => {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.id) {
      return { success: false, message: 'User not found' };
    }
    await verifyLinkOwnership(arg.id, +user.id);
    await db.delete(linkSchema).where(eq(linkSchema.id, arg.id));
    return { success: true, message: 'Link deleted successfully' };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete Link';
    console.error('Failed to delete link:', error);
    return { success: false, message };
  }
};

export const updateLinkOrder = async (
  _url: string,
  { arg }: { arg: { id: number; displayOrder: number } }
) => {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.id) {
      return { success: false, message: 'User not found' };
    }

    await verifyLinkOwnership(arg.id, +user.id);

    await db
      .update(linkSchema)
      .set({ displayOrder: arg.displayOrder })
      .where(eq(linkSchema.id, arg.id));

    return { success: true, message: 'Link order updated successfully' };
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : 'Failed to update link order';
    console.error('Failed to update link order:', e);
    return { success: false, message };
  }
};

export const updateLink = async (
  _url: string,
  { arg }: { arg: { id: number; values: Partial<LinkInsert> } }
) => {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.id) {
      return { success: false, message: 'User not found' };
    }

    const link = await verifyLinkOwnership(arg.id, +user.id);

    let updateValues = { ...arg.values };

    // Handle displayOrder update
    if (arg.values.displayOrder !== undefined) {
      // OPTIMIZATION: Uses composite index on (page_id, display_order) (created in migration 0011)
      // This query efficiently retrieves all links for a page in display order
      const allLinks = await db.query.link.findMany({
        where: eq(linkSchema.pageId, link.pageId),
        orderBy: [asc(linkSchema.displayOrder)],
      });

      const targetIndex = arg.values.displayOrder - 1;
      const filteredLinks = allLinks.filter((l) => l.id !== arg.id);

      const prevLink = filteredLinks[targetIndex - 1];
      const nextLink = filteredLinks[targetIndex];

      const prevOrder = prevLink ? prevLink.displayOrder : 0;
      const nextOrder = nextLink ? nextLink.displayOrder : prevOrder + 2;

      updateValues.displayOrder = (prevOrder + nextOrder) / 2;
    }

    await db
      .update(linkSchema)
      .set(updateValues)
      .where(eq(linkSchema.id, arg.id));
    return { success: true, message: 'Link updated successfully' };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update link';
    console.error('Failed to update link:', error);
    return { success: false, message };
  }
};

export const getLinksForPage = async (
  params: PaginationParams & { pageId: number }
) => {
  if (!params.pageId) {
    return { success: false, data: { data: [], pagination: {} } };
  }

  try {
    const data = await fetchPaginatedActiveLinks(params);
    return { success: true, data };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get page';
    console.error('Failed to get links for page:', error);
    return { success: false, message };
  }
};

export const trackLinkClick = async (linkId: number) => {
  try {
    const result = await db
      .update(linkSchema)
      .set({
        clickCount: sql`${linkSchema.clickCount} + 1`,
        updatedAt: Date.now(),
      })
      .where(eq(linkSchema.id, linkId))
      .returning();

    // Check if any rows were updated (link exists)
    if (result.length === 0) {
      return { success: false, message: 'Link not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to track link click:', error);
    return { success: false, message: 'Failed to track click' };
  }
};

export const checkLinkHealth = async (
  _url: string,
  { arg }: { arg: { linkId: number } }
) => {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.id) {
      return { success: false, message: 'User not found' };
    }

    // Get the link's URL
    const [linkData] = await db
      .select({ url: linkSchema.url })
      .from(linkSchema)
      .where(eq(linkSchema.id, arg.linkId));

    if (!linkData) {
      return { success: false, message: 'Link not found' };
    }

    // Perform the health check
    const healthResult: HealthCheckResult = await checkUrlHealth(linkData.url);

    // Update the link with health check results
    await db
      .update(linkSchema)
      .set({
        lastCheckedAt: Date.now(),
        healthStatus: healthResult.status,
        statusCode: healthResult.statusCode,
        responseTime: healthResult.responseTime,
        errorMessage: healthResult.error,
        updatedAt: Date.now(),
      })
      .where(eq(linkSchema.id, arg.linkId));

    return {
      success: true,
      message: 'Health check completed',
      data: healthResult,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to check link health';
    console.error('Failed to check link health:', error);
    return { success: false, message };
  }
};
