import { auth } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET(request) {
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

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit')) || 10;

  try {
    const keys = await redis.keys('link-meta:*');
    const limitedKeys = keys.slice(0, limit);

    const values = await Promise.all(limitedKeys.map((key) => redis.get(key)));

    const data = limitedKeys.map((key, index) => ({
      key,
      value: safeJsonParse(values[index]),
    }));

    return NextResponse.json({ count: data.length, entries: data });
  } catch (err) {
    console.error('Redis list error:', err);
    return NextResponse.json(
      { error: 'Failed to list cache' },
      { status: 500 }
    );
  }
}

function safeJsonParse(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
