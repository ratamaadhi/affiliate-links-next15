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
    const slug = await generateUniqueSlug(username);
    await db.insert(pageSchema).values({
      title: `${username}'s Home`,
      description: `${username}'s Aff-Link `,
      slug,
      userId,
    });
    return { success: true, message: 'Page created successfully' };
  } catch (error) {
    console.error('Failed to create home page:', error);
    return { success: false, message: 'Failed to create page' };
  }
};

const findPageBySlug = (slug: string) => {
  return db.query.page.findFirst({
    where: eq(pageSchema.slug, slug),
  });
};

const generateUniqueSlug = async (title: string): Promise<string> => {
  let slug = slugify(title);

  while (true) {
    const existingPage = await findPageBySlug(slug);

    if (!existingPage) return slug;

    const ids = nanoid();
    slug = `${slugify(title)}-${ids}`;
  }
};

export type PageCreationArgs = Omit<PageInsert, 'slug' | 'userId'>;

export const createPage = async (
  _url: string,
  { arg }: { arg: PageCreationArgs }
) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = +session?.user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const slug = await generateUniqueSlug(arg.title);
    await db.insert(pageSchema).values({ ...arg, slug, userId });
    return { success: true, message: 'Page created successfully' };
  } catch (error) {
    console.error('Failed to create page:', error);
    return { success: false, message: 'Failed to create page' };
  }
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const buildPageWhereClause = (userId: number, search?: string) => {
  const baseCondition = eq(pageSchema.userId, userId);
  if (!search) return baseCondition;

  return and(
    baseCondition,
    or(
      like(pageSchema.title, `%${search}%`),
      like(pageSchema.description, `%${search}%`),
      like(pageSchema.slug, `%${search}%`)
    )
  );
};

export const getPages = async (
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) => {
  const { page = 1, limit = 5, search = '' } = params;
  const offset = (page - 1) * limit;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = +session?.user?.id;
    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const whereCondition = buildPageWhereClause(userId, search);

    const [pagesByUser, totalItemsResult] = await Promise.all([
      db.query.page.findMany({
        where: whereCondition,
        with: { links: true },
        limit,
        offset,
      }),
      db.select({ count: count() }).from(pageSchema).where(whereCondition),
    ]);

    const totalItems = totalItemsResult[0].count;
    const totalPages = Math.ceil(totalItems / limit);

    const pagination: InPagination = {
      totalItems: Number(totalItems),
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
  } catch (error) {
    console.error('Failed to get pages:', error);
    return { success: false, message: 'Failed to get pages' };
  }
};

export const getPageInfinite = async (
  params: PaginationParams = { page: 1, limit: 5, search: '' }
) => {
  const { page = 1, limit = 5, search = '' } = params;
  const offset = (page - 1) * limit;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = +session?.user?.id;
    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const whereCondition = buildPageWhereClause(userId, search);

    const pagesByUser = await db.query.page.findMany({
      where: whereCondition,
      with: {
        links: true,
      },
      limit,
      offset,
    });

    return { success: true, data: pagesByUser };
  } catch (error) {
    console.error('Failed to get infinite pages:', error);
    return { success: false, message: 'Failed to get pages' };
  }
};

export const getPageById = async (id: number) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = +session?.user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const pageById = await db.query.page.findFirst({
      where: and(eq(pageSchema.id, id), eq(pageSchema.userId, userId)),
      with: {
        links: true,
      },
    });

    if (!pageById) {
      return { success: false, message: 'Page not found' };
    }

    return { success: true, data: pageById };
  } catch (error) {
    console.error('Failed to get page by ID:', error);
    return { success: false, message: 'Failed to get page' };
  }
};

const updatePageValues = async (
  id: number,
  userId: number,
  values: Partial<PageInsert>
) => {
  await db
    .update(pageSchema)
    .set(values)
    .where(and(eq(pageSchema.id, id), eq(pageSchema.userId, userId)));

  return { success: true, message: 'Page updated successfully' };
};

export const updatePage = async (
  _url: string,
  { arg }: { arg: { id: number; values: Partial<PageInsert> } }
) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = +session?.user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const newValues: Partial<PageInsert> = { ...arg.values };

    if (arg.values.title) {
      const originalPage = await db.query.page.findFirst({
        where: and(eq(pageSchema.id, arg.id), eq(pageSchema.userId, userId)),
        columns: { title: true },
      });

      if (originalPage && originalPage.title !== arg.values.title) {
        newValues.slug = await generateUniqueSlug(arg.values.title);
      }
    }

    return await updatePageValues(arg.id, userId, newValues);
  } catch (error) {
    console.error('Failed to update page:', error);
    return { success: false, message: 'Failed to update page' };
  }
};

export const deletePage = async (
  _url: string,
  { arg }: { arg: { id: number } }
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = +session?.user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }
    await db
      .delete(pageSchema)
      .where(and(eq(pageSchema.id, arg.id), eq(pageSchema.userId, userId)));

    return { success: true, message: 'Page deleted successfully' };
  } catch (error) {
    console.error('Failed to delete page:', error);
    return { success: false, message: 'Failed to delete Page' };
  }
};

export const getPageBySlug = async (slug: string) => {
  try {
    const pageBySlug = await findPageBySlug(slug);

    return { success: true, data: pageBySlug };
  } catch (error) {
    console.error('Failed to get page by slug:', error);
    return { success: false, message: 'Failed to get page' };
  }
};
