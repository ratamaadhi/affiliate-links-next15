import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from './lib/auth';
import { SessionUser } from './lib/types';
import { getUsernameRedirect } from './lib/cache/username-redirects';

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password'];
const ONBOARDING_PAGES = ['/new-username'];
const PUBLIC_ROUTE_PREFIXES = ['/api', '/_next', '/s', '/favicon'];

function isPublicRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/s/') ||
    pathname.includes('favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

// Note: /s/{code} routes (short URLs) pass through middleware intentionally.
// The short URL route handler at /app/s/[code]/route.ts performs the actual redirect.

async function handleUsernameRedirect(pathname: string) {
  const username = pathname.split('/')[1];

  if (
    !username ||
    username === 's' ||
    username.startsWith('api') ||
    username.startsWith('_next') ||
    pathname === '/new-username'
  ) {
    return null;
  }

  try {
    // Check in-memory cache first (O(1) lookup)
    const currentUsername = await getUsernameRedirect(username);

    if (currentUsername) {
      const remainingPath = pathname.split('/').slice(2).join('/');
      const newPath = `/${currentUsername}${remainingPath ? '/' + remainingPath : ''}`;
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

  // Skip middleware for static assets and API routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Handle username redirect for public routes
  const usernameRedirect = await handleUsernameRedirect(pathname);
  if (usernameRedirect) {
    return usernameRedirect;
  }

  // Check if accessing public username route (/{username} or /{username}/{slug})
  const usernameMatch = pathname.match(/^\/([^\/]+)(\/.*)?$/);
  const isUsernameRoute =
    usernameMatch &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/signup') &&
    !pathname.startsWith('/forgot-password') &&
    !pathname.startsWith('/reset-password') &&
    !pathname.startsWith('/new-username');

  // For public username routes, allow access without auth but try to get session for context
  if (isUsernameRoute) {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      const response = NextResponse.next();

      if (session?.user) {
        response.headers.set('x-user-info', JSON.stringify(session.user));
      }

      return response;
    } catch {
      // If auth fails, still allow access to public routes
      return NextResponse.next();
    }
  }

  // Auth required for dashboard and other protected routes
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // Allow unauthenticated users to access auth pages
    if (AUTH_PAGES.includes(pathname)) {
      return NextResponse.next();
    }
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
    // Match all routes except static assets, API routes, and internal Next.js routes
    // This handles both protected routes and public username routes
    '/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
