'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import {
  link as linkSchema,
  PageInsert,
  page as pageSchema,
} from '@/lib/db/schema';
import { InPagination, SessionUser } from '@/lib/types';
import { and, count, eq, like, or } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';
import { headers } from 'next/headers';
import slugify from 'slug';
import { createShortLink } from './short-links';

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
    const slug = await generateUniqueSlug(username, userId);
    const [newPage] = await db
      .insert(pageSchema)
      .values({
        title: `${username}'s Home`,
        description: `${username}'s Aff-Link `,
        slug,
        userId,
      })
      .returning();

    if (newPage && newPage.id) {
      try {
        await createShortLink(newPage.id, userId);
      } catch (shortLinkError) {
        // Log the error but don't fail the page creation
        console.error(
          'Failed to create short link for home page:',
          shortLinkError
        );
      }
    }

    return { success: true, message: 'Page created successfully' };
  } catch (error) {
    console.error('Failed to create home page:', error);
    return { success: false, message: 'Failed to create page' };
  }
};

// OPTIMIZATION: Uses index on (user_id, slug) composite index (created in migration 0010)
// When userId is provided, only checks for slug conflicts within that user's pages
// Note: Global slug lookup (without userId) is for backward compatibility only.
// In production, userId should always be provided as slugs are only unique per-user
// since the composite index was added in migration 0010.
export const findPageBySlug = async (slug: string, userId?: number) => {
  return db.query.page.findFirst({
    where: userId
      ? and(eq(pageSchema.slug, slug), eq(pageSchema.userId, userId))
      : eq(pageSchema.slug, slug),
  });
};

export const generateUniqueSlug = async (
  title: string,
  userId?: number,
  excludePageId?: number
): Promise<string> => {
  let slug = slugify(title);

  while (true) {
    const existingPage = await findPageBySlug(slug, userId);

    if (!existingPage || existingPage.id === excludePageId) {
      return slug;
    }

    const ids = nanoid();
    slug = `${slugify(title)}-${ids}`;
  }
};

export type PageCreationArgs = Omit<PageInsert, 'userId' | 'slug'> &
  Partial<Pick<PageInsert, 'slug'>>;

export const createPage = async (
  _url: string,
  { arg }: { arg: PageCreationArgs }
) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session.user as SessionUser;
    const userId = +user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    let slug = arg.slug;

    if (!slug) {
      slug = await generateUniqueSlug(arg.title, userId);
    } else {
      const slugFormat = /^[a-z0-9-]+$/;
      if (!slugFormat.test(slug)) {
        return {
          success: false,
          message:
            'Slug can only contain lowercase letters, numbers, and hyphens',
        };
      }

      const existingPage = await findPageBySlug(slug, userId);
      if (existingPage) {
        return {
          success: false,
          message: 'Slug already taken. Please try another one.',
        };
      }
    }

    const [newPage] = await db
      .insert(pageSchema)
      .values({ ...arg, slug, userId })
      .returning();

    if (newPage && newPage.id) {
      try {
        await createShortLink(newPage.id, userId);
      } catch (shortLinkError) {
        // Log the error but don't fail the page creation
        console.error('Failed to create short link for page:', shortLinkError);
      }
    }

    return {
      success: true,
      message: 'Page created successfully',
      data: { slug },
    };
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

    // OPTIMIZATION: Uses index on page.userId (created in migration 0011)
    // When search is provided, uses LIKE queries (not indexed, but acceptable for search)
    // The Promise.all executes both queries in parallel for better performance
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

    // OPTIMIZATION: Uses index on page.userId (created in migration 0011)
    // When search is provided, uses LIKE queries (not indexed, but acceptable for search)
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

    // OPTIMIZATION: Uses primary key index on page.id and index on page.userId (created in migration 0011)
    // This query efficiently retrieves a page by ID and verifies ownership
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
  // OPTIMIZATION: Uses primary key index on page.id and index on page.userId (created in migration 0011)
  // This update query efficiently updates a page and verifies ownership
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
    const user = session.user as SessionUser;
    const userId = +user?.id;
    const userUsername = user?.username;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const newValues: Partial<PageInsert> = { ...arg.values };

    if (arg.values.slug) {
      const slugFormat = /^[a-z0-9-]+$/;
      if (!slugFormat.test(arg.values.slug)) {
        return {
          success: false,
          message:
            'Slug can only contain lowercase letters, numbers, and hyphens',
        };
      }

      const existingPage = await findPageBySlug(arg.values.slug, userId);
      if (existingPage && existingPage.id !== arg.id) {
        return {
          success: false,
          message: 'Slug already taken. Please try another one.',
        };
      }
    }

    if (arg.values.title) {
      // OPTIMIZATION: Uses primary key index on page.id and index on page.userId (created in migration 0011)
      // This query efficiently retrieves the original page title and slug
      const originalPage = await db.query.page.findFirst({
        where: and(eq(pageSchema.id, arg.id), eq(pageSchema.userId, userId)),
        columns: { title: true, slug: true },
      });

      if (originalPage) {
        // Check if this is the default page (slug matches username)
        const isDefaultPage = originalPage.slug === userUsername;

        // Only regenerate slug if NOT the default page AND title changed
        if (!isDefaultPage && originalPage.title !== arg.values.title) {
          newValues.slug = await generateUniqueSlug(arg.values.title, userId);
        }

        // If it's the default page, ensure slug is NOT in newValues
        // This preserves the slug as the username
        if (isDefaultPage) {
          delete newValues.slug;
        }
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
    const user = session.user as SessionUser;
    const userId = +user?.id;
    const userUsername = user?.username;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    // Check if the page to delete is the default page
    const pageToDelete = await db.query.page.findFirst({
      where: and(eq(pageSchema.id, arg.id), eq(pageSchema.userId, userId)),
      columns: { slug: true },
    });

    if (pageToDelete?.slug === userUsername) {
      return {
        success: false,
        message: 'Cannot delete default page. This is your main page.',
      };
    }

    // First, delete all links associated with this page
    // OPTIMIZATION: Uses index on link.page_id (created in migration 0011)
    // This delete query efficiently removes all links for a page
    await db.delete(linkSchema).where(eq(linkSchema.pageId, arg.id));

    // Then delete the page
    // OPTIMIZATION: Uses primary key index on page.id and index on page.userId (created in migration 0011)
    // This delete query efficiently removes a page and verifies ownership
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
