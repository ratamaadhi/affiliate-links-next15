import { auth } from '@/lib/auth';
import { deleteShortLink } from '@/server/short-links';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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

    const { id } = params;
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      const response = NextResponse.json(
        { success: false, message: 'Invalid link ID' },
        { status: 400 }
      );
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const result = await deleteShortLink(linkId, userId);

    if (!result.success) {
      const response = NextResponse.json(result, { status: 400 });
      response.headers.set('Cache-Control', 'private, max-age=0');
      return response;
    }

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'private, max-age=0');
    return response;
  } catch (error) {
    console.error('Error deleting short link:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
