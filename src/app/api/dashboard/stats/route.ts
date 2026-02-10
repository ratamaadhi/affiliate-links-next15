import { auth } from '@/lib/auth';
import { getDashboardStats } from '@/server/dashboard';
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

    const stats = await getDashboardStats();

    const response = NextResponse.json({
      success: true,
      data: stats,
    });
    response.headers.set('Cache-Control', 'private, max-age=30');
    return response;
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    const response = NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'private, max-age=0');
    return response;
  }
}
