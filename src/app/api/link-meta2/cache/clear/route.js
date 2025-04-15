import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function POST() {
  try {
    const keys = await redis.keys('link-meta:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }

    return NextResponse.json({
      message: `Deleted ${keys.length} cache key(s)`
    })
  } catch (err) {
    console.error('Redis clear error:', err)
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 })
  }
}
