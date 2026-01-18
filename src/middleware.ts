import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from './lib/auth';
import { SessionUser } from './lib/types';
import db from './lib/db';
import { usernameHistory } from './lib/db/schema';
import { eq } from 'drizzle-orm';

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password'];
const ONBOARDING_PAGES = ['/new-username'];

async function handleUsernameRedirect(pathname: string) {
  const username = pathname.split('/')[1];

  if (
    !username ||
    username.startsWith('s') ||
    username.startsWith('api') ||
    username.startsWith('_next') ||
    pathname === '/new-username'
  ) {
    return null;
  }

  try {
    const historyEntry = await db.query.usernameHistory.findFirst({
      where: eq(usernameHistory.oldUsername, username),
      with: {
        user: {
          columns: { username: true },
        },
      },
    });

    if (historyEntry && historyEntry.user) {
      const remainingPath = pathname.split('/').slice(2).join('/');
      const newPath = `/${historyEntry.user.username}${remainingPath ? '/' + remainingPath : ''}`;
      return NextResponse.redirect(
        new URL(newPath, process.env.NEXT_PUBLIC_BASE_URL),
        301
      );
    }
  } catch (error) {
    console.error('Error handling username redirect:', error);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const usernameRedirect = await handleUsernameRedirect(pathname);
  if (usernameRedirect) {
    return usernameRedirect;
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = session.user as SessionUser;

  const userNeedsUsername = !user?.username;
  const isAccessingOnboardingPage = ONBOARDING_PAGES.includes(pathname);
  const isAccessingDashboard = pathname.startsWith('/dashboard');

  // User without username trying to access dashboard -> redirect to onboarding
  if (userNeedsUsername && isAccessingDashboard) {
    return NextResponse.redirect(new URL('/new-username', request.url));
  }

  // User with username trying to access onboarding page -> redirect to dashboard
  if (!userNeedsUsername && isAccessingOnboardingPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // User already logged in trying to access auth pages -> redirect to dashboard
  const isAccessingAuthPage = AUTH_PAGES.includes(pathname);
  if (isAccessingAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();

  response.headers.set('x-user-info', JSON.stringify(user));

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/new-username',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
};
