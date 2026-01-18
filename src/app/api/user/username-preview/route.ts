import { auth } from '@/lib/auth';
import { generateUsernamePreview } from '@/server/username-manager';
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
    const username = searchParams.get('username');

    if (!username) {
      const response = NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      );
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const result = await generateUsernamePreview(username, userId);

    if (!result.success) {
      const response = NextResponse.json(result, { status: 400 });
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'private, max-age=0');
    return response;
  } catch (error) {
    console.error('Error generating username preview:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
