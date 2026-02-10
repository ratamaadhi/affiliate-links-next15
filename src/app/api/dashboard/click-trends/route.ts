import { auth } from '@/lib/auth';
import { getClickTrends } from '@/server/dashboard';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const userId = +session?.user?.id;
    if (!userId) {
      const response = NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      );
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = (daysParam ? parseInt(daysParam, 10) : 7) as 7 | 30 | 90;

    if (![7, 30, 90].includes(days)) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Invalid days parameter. Must be 7, 30, or 90.',
        },
        { status: 400 }
      );
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const trends = await getClickTrends(days);

    const response = NextResponse.json({
      success: true,
      data: trends,
    });
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
  } catch (error) {
    console.error('Error getting click trends:', error);
    const response = NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'private, max-age=0');
    return response;
  }
}
