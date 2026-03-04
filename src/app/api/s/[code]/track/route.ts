import { NextRequest, NextResponse } from 'next/server';
import { trackShortLinkClick } from '@/server/short-links';

/**
 * Track a short link click
 *
 * This endpoint is called by clients after a redirect to track analytics.
 * It's designed to be fire-and-forget - failures don't affect the redirect.
 *
 * Usage:
 * - POST /api/s/{code}/track
 * - Can use navigator.sendBeacon() for reliable tracking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    await trackShortLinkClick(code);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track short link click:', error);
    // Return success even on error to avoid issues with fire-and-forget tracking
    return NextResponse.json({ success: true }, { status: 202 });
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 * Allows cross-origin tracking requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
