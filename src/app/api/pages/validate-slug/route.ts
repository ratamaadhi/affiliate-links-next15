import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { page } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { isValid: false, message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { slug } = await request.json();

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { isValid: false, message: 'Slug is required' },
        { status: 400 }
      );
    }

    // Check if slug contains only valid characters
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json({
        isValid: false,
        message:
          'Slug must contain only lowercase letters, numbers, and hyphens',
      });
    }

    // Check if slug already exists for this user
    const existingPage = await db.query.page.findFirst({
      where: and(eq(page.slug, slug), eq(page.userId, userId)),
    });

    if (existingPage) {
      return NextResponse.json({
        isValid: false,
        message: 'Slug already exists. Please choose a different one.',
      });
    }

    return NextResponse.json({
      isValid: true,
      message: 'Slug is available',
    });
  } catch (error) {
    console.error('Error validating slug:', error);
    return NextResponse.json(
      { isValid: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
