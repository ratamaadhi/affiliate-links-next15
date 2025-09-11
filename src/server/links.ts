'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import {
  LinkInsert,
  link as linkSchema,
  page as pageSchema,
} from '@/lib/db/schema';
import { InPagination, SessionUser } from '@/lib/types';
import { and, count, eq, like, or } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';
import { headers } from 'next/headers';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5);

export const createLink = async (url, { arg }: { arg: LinkInsert }) => {
  let defaultPageId = arg.pageId;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const user = session.user as SessionUser;
    const username = user.username;

    if (!arg.pageId) {
      const getPageByUsername = await db.query.page.findFirst({
        where: eq(pageSchema.slug, username),
      });
      defaultPageId = getPageByUsername.id;
    }
    await db
      .insert(linkSchema)
      .values({ ...arg, pageId: arg?.pageId ? arg.pageId : defaultPageId });
    return { success: true, message: 'Page created successfully' };
  } catch {
    return { success: false, message: 'Failed to create page' };
  }
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export const getLinks = async (
  params: PaginationParams & { pageId: number } = {
    page: 1,
    limit: 5,
    search: '',
    pageId: null,
  }
) => {
  const { page, limit = 5, search, pageId } = params;
  const offset = (page - 1) * limit;
  let defaultPageId = pageId;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const user = session.user as SessionUser;
    const userId = +user?.id;
    const username = user.username;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    if (!pageId) {
      const getPageByUsername = await db.query.page.findFirst({
        where: eq(pageSchema.slug, username),
      });
      defaultPageId = getPageByUsername.id;
    }

    const whereCondition = search
      ? and(
          eq(linkSchema.pageId, pageId ? pageId : defaultPageId),
          or(
            like(linkSchema.title, `%${search}%`),
            like(linkSchema.url, `%${search}%`)
          )
        )
      : eq(linkSchema.pageId, pageId ? pageId : defaultPageId);

    const links = await db.query.link.findMany({
      where: whereCondition,
      orderBy: (links, { asc }) => [asc(links.displayOrder)],
      limit,
      offset,
    });

    const [totalItems] = await db
      .select({ count: count() })
      .from(linkSchema)
      .where(whereCondition);
    const totalPages = Math.ceil(Number(totalItems.count) / limit);

    const pagination: InPagination = {
      totalItems: Number(totalItems.count),
      itemCount: links.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };

    const data = {
      data: links,
      pagination,
    };

    return { success: true, data: data };
  } catch {
    return { success: false, message: 'Failed to get links' };
  }
};

export const switchIsActiveLink = async (
  url,
  { arg }: { arg: { id: number } }
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const user = session.user as SessionUser;
    const userId = +user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const isActive = (
      await db.query.link.findFirst({
        where: eq(linkSchema.id, arg.id),
        with: {
          page: true,
        },
      })
    ).isActive;

    await db
      .update(linkSchema)
      .set({ isActive: !isActive })
      .where(eq(linkSchema.id, arg.id));
  } catch {
    return { success: false, message: 'Failed to switch active Link' };
  }
};

export const deleteLink = async (url, { arg }: { arg: { id: number } }) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const user = session.user as SessionUser;
    const userId = +user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }
    await db.delete(linkSchema).where(eq(linkSchema.id, arg.id));
    return { success: true, message: 'Link deleted successfully' };
  } catch {
    return { success: false, message: 'Failed to delete Link' };
  }
};

export const updateLinkOrder = async (
  url,
  { arg }: { arg: { id: number; displayOrder: number }[] }
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const user = session.user as SessionUser;
    const userId = +user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    for (const link of arg) {
      await db
        .update(linkSchema)
        .set({ displayOrder: link.displayOrder })
        .where(eq(linkSchema.id, link.id));
    }

    return { success: true, message: 'Link order updated successfully' };
  } catch {
    return { success: false, message: 'Failed to update link order' };
  }
};
