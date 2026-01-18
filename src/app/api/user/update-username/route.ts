import { auth } from '@/lib/auth';
import { handleUsernameChange } from '@/server/username-manager';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      const response = NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      );
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const result = await handleUsernameChange(username, userId);

    if (!result.success) {
      const response = NextResponse.json(result, { status: 400 });
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'private, max-age=0');
    return response;
  } catch (error) {
    console.error('Error updating username:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
