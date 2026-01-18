import { CACHE_TTL, USER_PAGES_KEY } from '@/lib/cache/cache-keys';
import { cacheGetOrSet } from '@/lib/cache/cache-manager';
import db from '@/lib/db';
import { page, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ username: string }> }
) {
  const params = await props.params;
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      );
    }

    // Find user by username
    const userData = await db.query.user.findFirst({
      where: eq(user.username, username),
      columns: {
        id: true,
        name: true,
        username: true,
        displayUsername: true,
        image: true,
      },
    });

    if (!userData) {
      const response = NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    // Get all pages for this user with caching
    const cacheKey = USER_PAGES_KEY(userData.id);
    const cachedResult = await cacheGetOrSet(
      cacheKey,
      async () => {
        return await db.query.page.findMany({
          where: eq(page.userId, userData.id),
          columns: {
            id: true,
            title: true,
            description: true,
            slug: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: (page, { desc }) => [desc(page.updatedAt)],
        });
      },
      CACHE_TTL.USER_PAGES
    );

    const pages = cachedResult.data || [];

    const response = NextResponse.json({
      success: true,
      data: {
        user: userData,
        pages,
      },
    });
    // Public pages can be cached for 1 hour
    response.headers.set(
      'Cache-Control',
      'public, max-age=3600, s-maxage=3600'
    );
    return response;
  } catch (error) {
    console.error('Error fetching public pages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}
