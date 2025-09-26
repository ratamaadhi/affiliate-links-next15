'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import {
  LinkInsert,
  link as linkSchema,
  page as pageSchema,
} from '@/lib/db/schema';
import { InPagination, SessionUser } from '@/lib/types';
import { and, asc, count, eq, like, or } from 'drizzle-orm';
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
      const getPageByUsername = await db.query.page.findFirst({
        where: eq(pageSchema.slug, user.username),
      });
      if (!getPageByUsername) {
        return { success: false, message: 'Default page not found for user' };
      }
      defaultPageId = getPageByUsername.id;
    }

    const firstLink = await db.query.link.findFirst({
      where: eq(linkSchema.pageId, defaultPageId),
      orderBy: [asc(linkSchema.displayOrder)],
    });

    const newDisplayOrder = firstLink ? firstLink.displayOrder / 2 : 1;

    await db.insert(linkSchema).values({
      ...arg,
      pageId: defaultPageId,
      displayOrder: newDisplayOrder,
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
          like(linkSchema.url, `%${search}%`)
        )
      )
    : eq(linkSchema.pageId, pageId);

  const [links, [totalItems]] = await Promise.all([
    db.query.link.findMany({
      where: whereCondition,
      orderBy: (links, { asc }) => [asc(links.displayOrder)],
      limit,
      offset,
    }),
    db.select({ count: count() }).from(linkSchema).where(whereCondition),
  ]);

  const totalPages = Math.ceil(Number(totalItems.count) / limit);

  const pagination: InPagination = {
    totalItems: Number(totalItems.count),
    itemCount: links.length,
    itemsPerPage: limit,
    totalPages,
    currentPage: page,
  };

  return {
    data: links,
    pagination,
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

    await verifyLinkOwnership(arg.id, +user.id);

    await db
      .update(linkSchema)
      .set({ ...arg.values })
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
    const data = await fetchPaginatedLinks(params);
    return { success: true, data };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get page';
    console.error('Failed to get links for page:', error);
    return { success: false, message };
  }
};
