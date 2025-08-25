'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PageInsert, page } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';
import { headers } from 'next/headers';
import slugify from 'slug';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5);

export const createPage = async (values: Omit<PageInsert, 'slug'>) => {
  let slug = slugify(values.title);
  let existingSlug = !!(await db.query.page.findFirst({
    where: eq(page.slug, slug),
  }));

  while (existingSlug) {
    const ids = nanoid();
    const idSlug = `${slug}-${ids}`;
    existingSlug = !!(await db.query.page.findFirst({
      where: eq(page.slug, idSlug),
    }));

    if (!existingSlug) {
      slug = idSlug;
      break;
    }
  }

  try {
    await db.insert(page).values({ ...values, slug });
    return { success: true, message: 'Page created successfully' };
  } catch {
    return { success: false, message: 'Failed to create page' };
  }
};

export const getPages = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = +session?.user?.id;

    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const pagesByUser = await db.query.page.findMany({
      where: eq(page.userId, userId),
      with: {
        links: true,
      },
    });

    return { success: true, pages: pagesByUser };
  } catch {
    return { success: false, message: 'Failed to get pages' };
  }
};

export const getPageById = async (id: number) => {
  try {
    const pageById = await db.query.page.findFirst({
      where: eq(page.id, id),
      with: {
        links: true,
      },
    });

    return { success: true, pageById };
  } catch {
    return { success: false, message: 'Failed to get page' };
  }
};

export const updatePage = async (id: number, values: Partial<PageInsert>) => {
  try {
    const newValues: Partial<PageInsert> = { ...values };
    if (values.title) {
      newValues.slug = values.title.toLowerCase().replace(/\s+/g, '-');
    }
    await db.update(page).set(newValues).where(eq(page.id, id));
    return { success: true, message: 'Page updated successfully' };
  } catch {
    return { success: false, message: 'Failed to update page' };
  }
};

export const deletePage = async (id: number) => {
  try {
    await db.delete(page).where(eq(page.id, id));
    return { success: true, message: 'Notebook deleted successfully' };
  } catch {
    return { success: false, message: 'Failed to delete notebook' };
  }
};
