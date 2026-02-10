import { auth } from '@/lib/auth';
import { getTopLinks } from '@/server/dashboard';
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
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const links = await getTopLinks(limit);

    const response = NextResponse.json({
      success: true,
      data: links,
    });
    response.headers.set('Cache-Control', 'private, max-age=30');
    return response;
  } catch (error) {
    console.error('Error getting top links:', error);
    const response = NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'private, max-age=0');
    return response;
  }
}
