'use server';

import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { page as pageSchema } from '@/lib/db/schema';
import { SessionUser } from '@/lib/types';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';
import { themeSettingsSchema } from '@/lib/page-theme';

export type UpdatePageThemeArgs = {
  pageId: number;
  themeSettings: z.infer<typeof themeSettingsSchema>;
};

export const updatePageTheme = async (
  _url: string,
  { arg }: { arg: UpdatePageThemeArgs }
) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session.user as SessionUser;
    const userId = +user?.id;

    if (!userId) {
      throw new Error('User not found');
    }

    // Validate theme settings
    const validatedSettings = themeSettingsSchema.parse(arg.themeSettings);

    // Verify page ownership before updating
    const page = await db.query.page.findFirst({
      where: and(eq(pageSchema.id, arg.pageId), eq(pageSchema.userId, userId)),
      columns: { id: true },
    });

    if (!page) {
      throw new Error(
        'Page not found or you do not have permission to edit it'
      );
    }

    // Update page with new theme settings
    await db
      .update(pageSchema)
      .set({
        themeSettings: JSON.stringify(validatedSettings),
        updatedAt: Date.now(),
      })
      .where(eq(pageSchema.id, arg.pageId));

    return {
      success: true,
      message: 'Theme settings updated successfully',
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to update theme settings';
    console.error('Failed to update page theme:', error);
    throw new Error(message);
  }
};
