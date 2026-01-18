import { CACHE_TTL, SHORT_LINK_KEY } from '@/lib/cache/cache-keys';
import { cacheGetOrSet } from '@/lib/cache/cache-manager';
import { getShortLinkByCode, trackShortLinkClick } from '@/server/short-links';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params;
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Short code is required' },
        { status: 400 }
      );
    }

    const cacheKey = SHORT_LINK_KEY(code);
    const cachedResult = await cacheGetOrSet(
      cacheKey,
      async () => await getShortLinkByCode(code),
      CACHE_TTL.SHORT_LINK
    );

    const shortLink = cachedResult.data;

    if (!shortLink) {
      return NextResponse.json(
        { success: false, message: 'Short link not found' },
        { status: 404 }
      );
    }

    await trackShortLinkClick(code);

    // Return 301 redirect with appropriate cache headers
    const response = NextResponse.redirect(shortLink.targetUrl, 301);
    response.headers.set(
      'Cache-Control',
      'public, max-age=86400, s-maxage=86400'
    );
    return response;
  } catch (error) {
    console.error('Error redirecting short link:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
