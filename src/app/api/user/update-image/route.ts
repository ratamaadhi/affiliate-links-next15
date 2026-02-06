import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { user } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// Helper function to set Cache-Control header consistently
function setNoCacheHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'private, max-age=0');
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Safely parse userId with proper validation
    const userId = session?.user?.id ? Number(session.user.id) : null;
    if (!userId || Number.isNaN(userId)) {
      return setNoCacheHeaders(
        NextResponse.json(
          { success: false, message: 'User not authenticated' },
          { status: 401 }
        )
      );
    }

    const { imageUrl } = await request.json();

    // Validate imageUrl: must be null, a non-empty string, or undefined
    if (
      imageUrl !== null &&
      (typeof imageUrl !== 'string' || imageUrl.trim() === '')
    ) {
      return setNoCacheHeaders(
        NextResponse.json(
          { success: false, message: 'Invalid imageUrl value' },
          { status: 400 }
        )
      );
    }

    await db
      .update(user)
      .set({ image: imageUrl, updatedAt: Date.now() })
      .where(eq(user.id, userId));

    return setNoCacheHeaders(
      NextResponse.json({
        success: true,
        message: 'Profile image updated successfully',
      })
    );
  } catch (error) {
    console.error('Error updating profile image:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
