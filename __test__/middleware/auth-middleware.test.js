import { describe, it, expect } from '@jest/globals';

describe('Auth Middleware - Username Check', () => {
  describe('User Without Username', () => {
    it('should redirect to /new-username when accessing dashboard without username', () => {
      const mockSession = {
        user: {
          id: 'user-id-123',
          email: 'user@example.com',
          username: null,
        },
        session: {
          token: 'mock-token',
          expiresAt: Date.now() + 3600000,
        },
      };

      const pathname = '/dashboard';
      const result = mockAuthMiddlewareCheck(pathname, mockSession);

      expect(result.status).toBe(307);
      expect(result.redirect).toContain('/new-username');
    });

    it('should allow access to /new-username page when user has no username', () => {
      const mockSession = {
        user: {
          id: 'user-id-123',
          email: 'user@example.com',
          username: null,
        },
        session: {
          token: 'mock-token',
          expiresAt: Date.now() + 3600000,
        },
      };

      const pathname = '/new-username';
      const result = mockAuthMiddlewareCheck(pathname, mockSession);

      expect(result.status).toBe(200);
      expect(result.redirect).toBeUndefined();
    });
  });

  describe('User With Username', () => {
    it('should not redirect to /new-username when user has username', () => {
      const mockSession = {
        user: {
          id: 'user-id-456',
          email: 'user@example.com',
          username: 'existinguser',
        },
        session: {
          token: 'mock-token',
          expiresAt: Date.now() + 3600000,
        },
      };

      const pathname = '/dashboard';
      const result = mockAuthMiddlewareCheck(pathname, mockSession);

      expect(result.status).toBe(200);
      expect(result.redirect).toBeUndefined();
    });

    it('should redirect from /new-username to dashboard when user already has username', () => {
      const mockSession = {
        user: {
          id: 'user-id-456',
          email: 'user@example.com',
          username: 'existinguser',
        },
        session: {
          token: 'mock-token',
          expiresAt: Date.now() + 3600000,
        },
      };

      const pathname = '/new-username';
      const result = mockAuthMiddlewareCheck(pathname, mockSession);

      expect(result.status).toBe(307);
      expect(result.redirect).toContain('/dashboard');
    });
  });

  describe('Unauthenticated User', () => {
    it('should redirect to /login when no session exists accessing dashboard', () => {
      const mockSession = null;

      const pathname = '/dashboard';
      const result = mockAuthMiddlewareCheck(pathname, mockSession);

      expect(result.status).toBe(307);
      expect(result.redirect).toContain('/login');
    });

    it('should redirect to /login when no session exists accessing new-username', () => {
      const mockSession = null;

      const pathname = '/new-username';
      const result = mockAuthMiddlewareCheck(pathname, mockSession);

      expect(result.status).toBe(307);
      expect(result.redirect).toContain('/login');
    });
  });
});

function mockAuthMiddlewareCheck(pathname, session) {
  const ONBOARDING_PAGES = ['/new-username'];

  if (!session) {
    return { status: 307, redirect: '/login', headers: {} };
  }

  const user = session.user;
  const userNeedsUsername = !user?.username;
  const isAccessingOnboardingPage = ONBOARDING_PAGES.includes(pathname);
  const isAccessingDashboard = pathname.startsWith('/dashboard');

  if (userNeedsUsername && isAccessingDashboard) {
    return { status: 307, redirect: '/new-username', headers: {} };
  }

  if (!userNeedsUsername && isAccessingOnboardingPage) {
    return { status: 307, redirect: '/dashboard', headers: {} };
  }

  return { status: 200, redirect: undefined, headers: {} };
}
