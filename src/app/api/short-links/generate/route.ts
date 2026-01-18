import { auth } from '@/lib/auth';
import { createShortLink } from '@/server/short-links';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const userId = +session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { pageId, targetUrl } = await request.json();

    if (!pageId) {
      return NextResponse.json(
        { success: false, message: 'Page ID is required' },
        { status: 400 }
      );
    }

    const result = await createShortLink(pageId, userId, targetUrl);

    if (!result.success) {
      const response = NextResponse.json(result, { status: 400 });
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'private, max-age=0');
    return response;
  } catch (error) {
    console.error('Error generating short link:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
