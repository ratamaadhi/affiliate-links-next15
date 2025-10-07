import { auth } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Check authentication first
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json(
      {
        error:
          'Authentication required. Please log in to access this endpoint.',
      },
      { status: 401 }
    );
  }

  try {
    const keys = await redis.keys('link-meta:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return NextResponse.json({
      message: `Deleted ${keys.length} cache key(s)`,
    });
  } catch (err) {
    console.error('Redis clear error:', err);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
