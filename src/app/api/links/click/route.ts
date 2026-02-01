import { trackLinkClick } from '@/server/links';
import { NextRequest, NextResponse } from 'next/server';
import { checkClickRateLimit, getClientIp } from '@/lib/cache/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const { linkId } = await request.json();

    // Validate linkId - accept both number and numeric string
    const numericLinkId =
      typeof linkId === 'string' ? parseInt(linkId, 10) : linkId;
    if (linkId === null || linkId === undefined || isNaN(numericLinkId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid link ID' },
        { status: 400 }
      );
    }

    // Check rate limit before tracking click
    const ip = getClientIp(request);
    const rateLimit = await checkClickRateLimit(ip, numericLinkId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Rate limit exceeded',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    const result = await trackLinkClick(numericLinkId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to track click' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking link click:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
