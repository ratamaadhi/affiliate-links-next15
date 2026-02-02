import { CACHE_TTL, USERNAME_AVAILABILITY_KEY } from '@/lib/cache/cache-keys';
import { cacheGetOrSet } from '@/lib/cache/cache-manager';
import { checkUsernameAvailability } from '@/server/username-manager';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ username: string }> }
) {
  const params = await props.params;
  try {
    const { username } = params;

    if (!username) {
      const response = NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      );
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    // Get session for user context
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    const userId = session?.user?.id ? +session.user.id : undefined;

    const cacheKey = USERNAME_AVAILABILITY_KEY(username, userId);
    const cachedResult = await cacheGetOrSet(
      cacheKey,
      async () => await checkUsernameAvailability(username, userId),
      CACHE_TTL.USERNAME_AVAILABILITY
    );

    const result = cachedResult.data;

    const response = NextResponse.json(result);
    // Username availability is user-specific, use no-store to prevent caching
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
