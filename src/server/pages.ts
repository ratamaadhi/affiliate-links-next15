'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { PageInsert, page } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export const createPage = async (values: PageInsert) => {
  try {
    await db.insert(page).values(values);
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

export const updatePage = async (id: number, values: PageInsert) => {
  try {
    await db.update(page).set(values).where(eq(page.id, id));
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
