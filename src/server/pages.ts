'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PageInsert, page as pageSchema } from '@/lib/db/schema';
import { InPagination, SessionUser } from '@/lib/types';
import { and, count, eq, like, or } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';
import { headers } from 'next/headers';
import slugify from 'slug';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5);

export const createHomePageUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session.user as SessionUser;
  const userId = +user?.id;
  if (!userId) {
    return { success: false, message: 'User not found' };
  }
  const username = user?.username || 'user';
  try {
    await db.insert(pageSchema).values({
      title: `${username}'s Home`,
      description: `${username}'s Aff-Link `,
      slug: username,
      userId,
    });
    return { success: true, message: 'Page created successfully' };
  } catch {
    return { success: false, message: 'Failed to create page' };
  }
};

const generateUniqueSlug = async (title: string): Promise<string> => {
  let slug = slugify(title);

  while (true) {
    const existingPage = await db.query.page.findFirst({
      where: eq(pageSchema.slug, slug),
    });

    if (!existingPage) return slug;

    const ids = nanoid();
    slug = `${slugify(title)}-${ids}`;
  }
};

export const createPage = async (
  url,
  { arg }: { arg: Omit<PageInsert, 'slug'> }
) => {
  try {
    const slug = await generateUniqueSlug(arg.title);
    await db.insert(pageSchema).values({ ...arg, slug });
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

export const getPages = async (
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) => {
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = +session?.user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const whereCondition = search
      ? and(
          eq(pageSchema.userId, userId),
          or(
            like(pageSchema.title, `%${search}%`),
            like(pageSchema.description, `%${search}%`),
            like(pageSchema.slug, `%${search}%`)
          )
        )
      : eq(pageSchema.userId, userId);

    const pagesByUser = await db.query.page.findMany({
      where: whereCondition,
      with: {
        links: true,
      },
      limit,
      offset,
    });

    const [totalItems] = await db
      .select({ count: count() })
      .from(pageSchema)
      .where(whereCondition);
    const totalPages = Math.ceil(Number(totalItems.count) / limit);

    const pagination: InPagination = {
      totalItems: Number(totalItems.count),
      itemCount: pagesByUser.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };

    const data = {
      data: pagesByUser,
      pagination,
    };

    return { success: true, data: data };
  } catch {
    return { success: false, message: 'Failed to get pages' };
  }
};

export const getPageInfinite = async (
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) => {
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = +session?.user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const whereCondition = search
      ? and(
          eq(pageSchema.userId, userId),
          or(
            like(pageSchema.title, `%${search}%`),
            like(pageSchema.description, `%${search}%`),
            like(pageSchema.slug, `%${search}%`)
          )
        )
      : eq(pageSchema.userId, userId);

    const pagesByUser = await db.query.page.findMany({
      where: whereCondition,
      with: {
        links: true,
      },
      limit,
      offset,
    });

    return { success: true, data: pagesByUser };
  } catch {
    return { success: false, message: 'Failed to get pages' };
  }
};

export const getPageById = async (id: number) => {
  try {
    const pageById = await db.query.page.findFirst({
      where: eq(pageSchema.id, id),
      with: {
        links: true,
      },
    });

    return { success: true, pageById };
  } catch {
    return { success: false, message: 'Failed to get page' };
  }
};

const updatePageValues = async (id: number, values: Partial<PageInsert>) => {
  await db.update(pageSchema).set(values).where(eq(pageSchema.id, id));
  return { success: true, message: 'Page updated successfully' };
};

export const updatePage = async (
  url,
  { arg }: { arg: { id: number; values: Partial<PageInsert> } }
) => {
  try {
    const newValues: Partial<PageInsert> = { ...arg.values };

    if (!arg.values.title) return await updatePageValues(arg.id, newValues);

    const originalPage = await db.query.page.findFirst({
      where: eq(pageSchema.id, arg.id),
    });

    if (!originalPage || originalPage.title === arg.values.title) {
      return await updatePageValues(arg.id, newValues);
    }

    newValues.slug = await generateUniqueSlug(arg.values.title);
    return await updatePageValues(arg.id, newValues);
  } catch {
    return { success: false, message: 'Failed to update page' };
  }
};

export const deletePage = async (url, { arg }: { arg: { id: number } }) => {
  try {
    await db.delete(pageSchema).where(eq(pageSchema.id, arg.id));
    return { success: true, message: 'Page deleted successfully' };
  } catch {
    return { success: false, message: 'Failed to delete Page' };
  }
};
