'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PageInsert, page as pageSchema } from '@/lib/db/schema';
import { SessionUser } from '@/lib/types';
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

export const createPage = async (
  url,
  { arg }: { arg: Omit<PageInsert, 'slug'> }
) => {
  let slug = slugify(arg.title);
  let existingSlug = !!(await db.query.page.findFirst({
    where: eq(pageSchema.slug, slug),
  }));

  while (existingSlug) {
    const ids = nanoid();
    const idSlug = `${slug}-${ids}`;
    existingSlug = !!(await db.query.page.findFirst({
      where: eq(pageSchema.slug, idSlug),
    }));

    if (!existingSlug) {
      slug = idSlug;
      break;
    }
  }

  try {
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

    const pagesByUser = await db.query.page.findMany({
      where: search
        ? and(
            eq(pageSchema.userId, userId),
            or(
              like(pageSchema.title, `%${search}%`),
              like(pageSchema.description, `%${search}%`),
              like(pageSchema.slug, `%${search}%`)
            )
          )
        : eq(pageSchema.userId, userId),
      with: {
        links: true,
      },
      limit,
      offset,
    });

    const [totalItems] = await db
      .select({ count: count() })
      .from(pageSchema)
      .where(
        search
          ? and(
              eq(pageSchema.userId, userId),
              or(
                like(pageSchema.title, `%${search}%`),
                like(pageSchema.description, `%${search}%`),
                like(pageSchema.slug, `%${search}%`)
              )
            )
          : eq(pageSchema.userId, userId)
      );
    const totalPages = Math.ceil(Number(totalItems.count) / limit);

    const data = {
      data: pagesByUser,
      pagination: {
        totalItems: Number(totalItems.count),
        itemCount: pagesByUser.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };

    return { success: true, data: data };
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

export const updatePage = async (
  url,
  { arg }: { arg: { id: number; values: Partial<PageInsert> } }
) => {
  try {
    const newValues: Partial<PageInsert> = { ...arg.values };

    if (arg.values.title) {
      const originalPage = await db.query.page.findFirst({
        where: eq(pageSchema.id, arg.id),
      });

      if (originalPage && originalPage.title !== arg.values.title) {
        let slug = slugify(arg.values.title);
        let existingSlug = !!(await db.query.page.findFirst({
          where: eq(pageSchema.slug, slug),
        }));

        while (existingSlug) {
          const ids = nanoid();
          const idSlug = `${slug}-${ids}`;
          existingSlug = !!(await db.query.page.findFirst({
            where: eq(pageSchema.slug, idSlug),
          }));

          if (!existingSlug) {
            slug = idSlug;
            break;
          }
        }
        newValues.slug = slug;
      }
    }

    await db.update(pageSchema).set(newValues).where(eq(pageSchema.id, arg.id));
    return { success: true, message: 'Page updated successfully' };
  } catch {
    return { success: false, message: 'Failed to update page' };
  }
};

export const deletePage = async (url, { arg }: { arg: { id: number } }) => {
  try {
    await db.delete(pageSchema).where(eq(pageSchema.id, arg.id));
    return { success: true, message: 'Notebook deleted successfully' };
  } catch {
    return { success: false, message: 'Failed to delete notebook' };
  }
};
