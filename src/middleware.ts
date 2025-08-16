import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from './lib/auth';
import { SessionUser } from './lib/types';

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password'];
const ONBOARDING_PAGES = ['/new-username'];
const PROTECTED_AUTH_PAGES = [...AUTH_PAGES, ...ONBOARDING_PAGES];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = session.user as SessionUser;

  const userNeedsUsername = !user.username;
  const isAccessingProtectedAuthPage = PROTECTED_AUTH_PAGES.includes(pathname);

  if (userNeedsUsername && pathname !== '/new-username') {
    const redirectUrl = new URL(
      `/new-username?email=${user.email}`,
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (!userNeedsUsername && isAccessingProtectedAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();

  response.headers.set('x-user-info', JSON.stringify(user));

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/new-username'],
};
