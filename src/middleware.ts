import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from './lib/auth';
import { SessionUser } from './lib/types';
import { getUsernameRedirect } from './lib/cache/username-redirects';

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password'];
const ONBOARDING_PAGES = ['/new-username'];
const PUBLIC_PREFIX_PATHS = ['/api', '/_next', '/s/'] as const;

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    PUBLIC_PREFIX_PATHS.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.includes('favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

// Note: /s/{code} routes (short URLs) pass through middleware intentionally.
// The short URL route handler at /app/s/[code]/route.ts performs the actual redirect.

async function handleUsernameRedirect(pathname: string) {
  const username = pathname.split('/')[1];

  if (!username || pathname === '/new-username') {
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
    !AUTH_PAGES.some((page) => pathname.startsWith(page)) &&
    !ONBOARDING_PAGES.some((page) => pathname.startsWith(page));

  // Get session once for both username and protected routes
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  let sessionError = false;

  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    sessionError = true;
  }

  // For public username routes, allow access without auth but use session for context if available
  if (isUsernameRoute) {
    const response = NextResponse.next();

    if (session?.user) {
      response.headers.set('x-user-info', JSON.stringify(session.user));
    }

    return response;
  }

  // Auth required for dashboard and other protected routes
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
