import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { page, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ username: string }> }
) {
  const params = await props.params;
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      );
    }

    // Find user by username
    const userData = await db.query.user.findFirst({
      where: eq(user.username, username),
      columns: {
        id: true,
        name: true,
        username: true,
        displayUsername: true,
        image: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get all pages for this user
    const pages = await db.query.page.findMany({
      where: eq(page.userId, userData.id),
      columns: {
        id: true,
        title: true,
        description: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: (page, { desc }) => [desc(page.updatedAt)],
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        pages,
      },
    });
  } catch (error) {
    console.error('Error fetching public pages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}
