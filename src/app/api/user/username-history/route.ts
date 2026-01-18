import { auth } from '@/lib/auth';
import { getUsernameHistory } from '@/server/username-manager';
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

    const result = await getUsernameHistory(userId);

    if (!result.success) {
      const response = NextResponse.json(result, { status: 400 });
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'private, max-age=0');
    return response;
  } catch (error) {
    console.error('Error getting username history:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
