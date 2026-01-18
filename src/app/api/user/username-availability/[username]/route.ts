import { CACHE_TTL, USERNAME_AVAILABILITY_KEY } from '@/lib/cache/cache-keys';
import { cacheGetOrSet } from '@/lib/cache/cache-manager';
import { checkUsernameAvailability } from '@/server/username-manager';
import { NextRequest, NextResponse } from 'next/server';

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

    const cacheKey = USERNAME_AVAILABILITY_KEY(username);
    const cachedResult = await cacheGetOrSet(
      cacheKey,
      async () => await checkUsernameAvailability(username),
      CACHE_TTL.USERNAME_AVAILABILITY
    );

    const result = cachedResult.data;

    const response = NextResponse.json(result);
    // Username availability can be cached for 5 minutes
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    return response;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
