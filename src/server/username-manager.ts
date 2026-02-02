'use server';

import {
  invalidatePageBySlugCache,
  invalidateUserCache,
  invalidateUsernameCache,
} from '@/lib/cache/cache-manager';
import { updateUsernameRedirect } from '@/lib/cache/username-redirects';
import db from '@/lib/db';
import { page, shortLink, user, usernameHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const RESERVED_USERNAMES = [
  'admin',
  'api',
  'www',
  'mail',
  'support',
  'help',
  'docs',
  'blog',
  'static',
  'assets',
  'cdn',
  's',
  'auth',
  'login',
  'signup',
  'reset',
  'forgot',
  'verify',
  'dashboard',
  'settings',
  'profile',
];

const USERNAME_REGEX = /^[a-z0-9-]+$/;
const MIN_USERNAME_LENGTH = 3;
const COOLDOWN_DAYS = 30;
const RELEASE_USERNAME_AFTER_MONTHS = 6; // Username can be reused after 6 months

export const canChangeUsername = async (
  newUsername: string,
  userId: number
): Promise<{ canChange: boolean; message?: string }> => {
  try {
    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        username: true,
        lastUsernameChangeAt: true,
      },
    });

    if (!userData) {
      return { canChange: false, message: 'User not found' };
    }

    if (userData.username === newUsername) {
      return { canChange: false, message: 'Username is the same as current' };
    }

    if (!USERNAME_REGEX.test(newUsername)) {
      return {
        canChange: false,
        message:
          'Username can only contain lowercase letters, numbers, and hyphens',
      };
    }

    if (newUsername.length < MIN_USERNAME_LENGTH) {
      return {
        canChange: false,
        message: 'Username must be at least 3 characters long',
      };
    }

    if (RESERVED_USERNAMES.includes(newUsername.toLowerCase())) {
      return { canChange: false, message: 'Username is reserved' };
    }

    // OPTIMIZATION: Uses unique index on user.username (created in migration 0001)
    // This query is highly optimized with O(log n) lookup time
    const existingUser = await db.query.user.findFirst({
      where: eq(user.username, newUsername),
      columns: { id: true },
    });

    if (existingUser) {
      return { canChange: false, message: 'Username is already taken' };
    }

    if (userData.lastUsernameChangeAt) {
      const daysSinceLastChange = Math.floor(
        (Date.now() - userData.lastUsernameChangeAt) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastChange < COOLDOWN_DAYS) {
        const daysRemaining = COOLDOWN_DAYS - daysSinceLastChange;
        return {
          canChange: false,
          message: `You must wait ${daysRemaining} more days before changing your username`,
        };
      }
    }

    return { canChange: true };
  } catch (error) {
    console.error('Error checking username change eligibility:', error);
    return { canChange: false, message: 'Internal server error' };
  }
};

export const handleUsernameChange = async (
  newUsername: string,
  userId: number
): Promise<{ success: boolean; message?: string }> => {
  try {
    const validation = await canChangeUsername(newUsername, userId);

    if (!validation.canChange) {
      return { success: false, message: validation.message };
    }

    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        username: true,
        usernameChangeCount: true,
      },
    });

    if (!userData) {
      return { success: false, message: 'User not found' };
    }

    const oldUsername = userData.username;

    await db.insert(usernameHistory).values({
      userId,
      oldUsername,
      changedAt: Date.now(),
    });

    await db
      .update(user)
      .set({
        username: newUsername,
        usernameChangeCount: userData.usernameChangeCount + 1,
        lastUsernameChangeAt: Date.now(),
      })
      .where(eq(user.id, userId));

    // Update the default page slug (the page that has the old username as slug)
    const defaultPage = await db.query.page.findFirst({
      where: eq(page.slug, oldUsername),
      columns: { id: true },
    });

    if (defaultPage) {
      await db
        .update(page)
        .set({ slug: newUsername, updatedAt: Date.now() })
        .where(eq(page.id, defaultPage.id));

      // Invalidate cache for both old and new slugs
      await invalidatePageBySlugCache(oldUsername);
      await invalidatePageBySlugCache(newUsername);
    }

    // Update in-memory redirect cache (O(1) operation)
    updateUsernameRedirect(oldUsername, newUsername);

    // Invalidate cache for old username
    await invalidateUsernameCache(oldUsername);

    // Invalidate cache for new username
    await invalidateUsernameCache(newUsername);

    // Invalidate user cache
    await invalidateUserCache(userId);

    return { success: true, message: 'Username changed successfully' };
  } catch (error) {
    console.error('Error handling username change:', error);
    return { success: false, message: 'Failed to change username' };
  }
};

export const checkUsernameAvailability = async (
  username: string,
  currentUserId?: number
): Promise<{
  available: boolean;
  message?: string;
  isOwnOldUsername?: boolean;
}> => {
  try {
    if (!USERNAME_REGEX.test(username)) {
      return {
        available: false,
        message:
          'Username can only contain lowercase letters, numbers, and hyphens',
      };
    }

    if (username.length < MIN_USERNAME_LENGTH) {
      return {
        available: false,
        message: 'Username must be at least 3 characters long',
      };
    }

    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      return { available: false, message: 'Username is reserved' };
    }

    // OPTIMIZATION: Uses unique index on user.username (created in migration 0001)
    // This query is highly optimized with O(log n) lookup time
    const existingUser = await db.query.user.findFirst({
      where: eq(user.username, username),
      columns: { id: true },
    });

    if (existingUser) {
      return { available: false, message: 'Username is already taken' };
    }

    // OPTIMIZATION: Uses index on username_history.old_username (created in migration 0006)
    // This query is optimized with O(log n) lookup time
    const existingHistory = await db.query.usernameHistory.findFirst({
      where: eq(usernameHistory.oldUsername, username),
      columns: { userId: true, changedAt: true },
    });

    if (existingHistory) {
      // Allow if it's the current user's own old username
      if (currentUserId && existingHistory.userId === currentUserId) {
        return { available: true, isOwnOldUsername: true };
      }

      // Check if the release period has passed
      const monthsSinceChange =
        (Date.now() - existingHistory.changedAt) / (1000 * 60 * 60 * 24 * 30); // Convert milliseconds to months

      if (monthsSinceChange < RELEASE_USERNAME_AFTER_MONTHS) {
        const monthsRemaining = Math.ceil(
          RELEASE_USERNAME_AFTER_MONTHS - monthsSinceChange
        );
        return {
          available: false,
          message: `This username has been used before. It will be available in ${monthsRemaining} month(s).`,
        };
      }

      // Release period has passed, username is available
      return { available: true };
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking username availability:', error);
    return { available: false, message: 'Internal server error' };
  }
};

export const generateUsernamePreview = async (
  newUsername: string,
  userId: number
): Promise<{
  success: boolean;
  data?: {
    username: string;
    homePageUrl: string;
    examplePageUrl?: string;
    shortUrl?: string;
    warning: string;
  };
  message?: string;
}> => {
  try {
    const userInfo = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        username: true,
      },
    });

    if (!userInfo) {
      return { success: false, message: 'User not found' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aff.link';
    const homePageUrl = `${baseUrl}/${newUsername}`;

    // OPTIMIZATION: Uses index on page.userId (created in migration 0011)
    // This query efficiently retrieves the first page for a user
    const firstPage = await db.query.page.findFirst({
      where: eq(page.userId, userId),
      columns: { slug: true },
      orderBy: (page, { asc }) => [asc(page.id)],
    });

    let examplePageUrl: string | undefined;
    if (firstPage) {
      examplePageUrl = `${baseUrl}/${newUsername}/${firstPage.slug}`;
    }

    // OPTIMIZATION: Uses index on short_link.user_id (created in migration 0006)
    // This query efficiently retrieves the first short link for a user
    const firstShortLink = await db.query.shortLink.findFirst({
      where: eq(shortLink.userId, userId),
      columns: { shortCode: true },
      orderBy: (shortLink, { asc }) => [asc(shortLink.id)],
    });

    const shortUrl = firstShortLink
      ? `${baseUrl}/s/${firstShortLink.shortCode}`
      : undefined;

    const warning = [
      '⚠️ Important: Changing your username will:',
      '• Update your profile URLs',
      '• Redirect old links to new username (301 redirect)',
      '• Generate new short URLs for sharing',
      `• You cannot change username again for ${COOLDOWN_DAYS} days`,
      '',
      'Are you sure you want to continue?',
    ].join('\n');

    return {
      success: true,
      data: {
        username: newUsername,
        homePageUrl,
        examplePageUrl,
        shortUrl,
        warning,
      },
    };
  } catch (error) {
    console.error('Error generating username preview:', error);
    return { success: false, message: 'Failed to generate preview' };
  }
};

export const getUsernameHistory = async (userId: number) => {
  try {
    // OPTIMIZATION: Uses index on username_history.user_id (created in migration 0006)
    // This query efficiently retrieves username history for a user, ordered by most recent
    const userInfoHistory = await db.query.usernameHistory.findMany({
      where: eq(usernameHistory.userId, userId),
      orderBy: (usernameHistory, { desc }) => [desc(usernameHistory.changedAt)],
    });

    return { success: true, data: userInfoHistory };
  } catch (error) {
    console.error('Error getting username history:', error);
    return { success: false, message: 'Failed to get username history' };
  }
};
