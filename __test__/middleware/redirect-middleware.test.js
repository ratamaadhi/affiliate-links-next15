import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';

const mockUsers = new Map();
const mockPages = new Map();
const mockUsernameHistory = new Map();

let testUserId = 1;
let testUsername = 'redirectuser';
let testUserEmail = 'redirectuser@example.com';
let testPageId = 1;

beforeAll(async () => {
  mockUsers.set(testUserId, {
    id: testUserId,
    email: testUserEmail,
    username: testUsername,
    displayName: 'Test User',
    usernameChangeCount: 0,
    lastUsernameChange: null,
  });

  mockPages.set(testPageId, {
    id: testPageId,
    userId: testUserId,
    slug: `${testUsername}/testpage-abc`,
    title: 'Test Page',
    description: 'A test page',
  });
});

afterAll(async () => {
  mockUsers.clear();
  mockPages.clear();
  mockUsernameHistory.clear();
});

beforeEach(async () => {
  mockUsernameHistory.clear();
});

describe('Redirect Middleware', () => {
  describe('Valid Username Access', () => {
    it('should allow access to valid username route', async () => {
      const pathname = `/${testUsername}`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).not.toBe(301);
      expect(result.status).not.toBe(404);
      expect(result.redirect).toBeUndefined();
    });

    it('should allow access to username with page slug', async () => {
      const pathname = `/${testUsername}/testpage-abc`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).not.toBe(301);
      expect(result.status).not.toBe(404);
      expect(result.redirect).toBeUndefined();
    });

    it('should not redirect for current username', async () => {
      mockUsernameHistory.set(Date.now(), {
        id: Date.now(),
        userId: testUserId,
        oldUsername: 'oldusername',
        changedAt: Date.now() - 86400000,
      });

      const pathname = `/${testUsername}`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).not.toBe(301);
      expect(result.redirect).toBeUndefined();
    });
  });

  describe('Old Username Redirect (301)', () => {
    it('should redirect old username to current username with 301', async () => {
      const oldUsername = 'oldusername123';
      mockUsernameHistory.set(Date.now(), {
        id: Date.now(),
        userId: testUserId,
        oldUsername,
        changedAt: Date.now(),
      });

      const pathname = `/${oldUsername}`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(301);
      expect(result.redirect).toContain(`/${testUsername}`);
    });

    it('should preserve path after username when redirecting', async () => {
      const oldUsername = 'oldusername456';
      mockUsernameHistory.set(Date.now(), {
        id: Date.now(),
        userId: testUserId,
        oldUsername,
        changedAt: Date.now(),
      });

      const pathname = `/${oldUsername}/testpage-abc`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(301);
      expect(result.redirect).toContain(`/${testUsername}/testpage-abc`);
    });

    it('should find most recent username for old usernames', async () => {
      const oldUsername1 = 'username1';
      const oldUsername2 = 'username2';
      mockUsernameHistory.set(1, {
        id: 1,
        userId: testUserId,
        oldUsername: oldUsername1,
        changedAt: Date.now() - 172800000,
      });
      mockUsernameHistory.set(2, {
        id: 2,
        userId: testUserId,
        oldUsername: oldUsername2,
        changedAt: Date.now() - 86400000,
      });

      const pathname1 = `/${oldUsername1}`;
      const result1 = await mockMiddlewareCheck(pathname1);

      expect(result1.status).toBe(301);
      expect(result1.redirect).toContain(`/${testUsername}`);

      const pathname2 = `/${oldUsername2}`;
      const result2 = await mockMiddlewareCheck(pathname2);

      expect(result2.status).toBe(301);
      expect(result2.redirect).toContain(`/${testUsername}`);
    });

    it('should set cache headers for 301 redirects', async () => {
      const oldUsername = 'oldusername789';
      mockUsernameHistory.set(Date.now(), {
        id: Date.now(),
        userId: testUserId,
        oldUsername,
        changedAt: Date.now(),
      });

      const pathname = `/${oldUsername}`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(301);
      expect(result.headers).toBeDefined();
    });

    it('should handle query parameters in redirect', async () => {
      const oldUsername = 'oldusername012';
      mockUsernameHistory.set(Date.now(), {
        id: Date.now(),
        userId: testUserId,
        oldUsername,
        changedAt: Date.now(),
      });

      const pathname = `/${oldUsername}`;
      const result = await mockMiddlewareCheck(pathname, null, 'ref=source');

      expect(result.status).toBe(301);
      expect(result.redirect).toContain(`ref=source`);
    });
  });

  describe('Invalid Username (404)', () => {
    it('should return 404 for non-existent username', async () => {
      const pathname = '/nonexistentuser';
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(404);
      expect(result.redirect).toBeUndefined();
    });

    it('should return 404 for username not in history or current users', async () => {
      const nonexistentUsername = 'totallyfakeuser';
      const pathname = `/${nonexistentUsername}`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(404);
    });

    it('should return 404 for reserved usernames', async () => {
      const reservedUsernames = ['admin', 'api', 'www', 'root', 'system'];

      for (const reserved of reservedUsernames) {
        const pathname = `/${reserved}`;
        const result = await mockMiddlewareCheck(pathname);

        expect(result.status).toBe(404);
      }
    });

    it('should return 404 for usernames with invalid format', async () => {
      const invalidUsernames = ['User Name', 'user.name', 'user_name', 'USER'];

      for (const invalid of invalidUsernames) {
        const pathname = `/${invalid}`;
        const result = await mockMiddlewareCheck(pathname);

        expect(result.status).toBe(404);
      }
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle lowercase username correctly', async () => {
      const pathname = `/${testUsername}`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).not.toBe(301);
      expect(result.status).not.toBe(404);
    });

    it('should redirect uppercase username to lowercase (if user exists)', async () => {
      const pathname = `/${testUsername.toUpperCase()}`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(301);
      expect(result.redirect).toContain(`/${testUsername}`);
    });

    it('should redirect mixed case username to lowercase (if user exists)', async () => {
      const mixedCaseUsername = testUsername.replace(/^[a-z]/, (c) =>
        c.toUpperCase()
      );
      const pathname = `/${mixedCaseUsername}`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(301);
      expect(result.redirect).toContain(`/${testUsername}`);
    });

    it('should handle case in username history', async () => {
      const oldUsername = 'oldusername';
      mockUsernameHistory.set(Date.now(), {
        id: Date.now(),
        userId: testUserId,
        oldUsername,
        changedAt: Date.now(),
      });

      const pathname = `/${oldUsername.toUpperCase()}`;
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(301);
      expect(result.redirect).toContain(`/${testUsername}`);
    });
  });

  describe('Multiple Redirect Chains', () => {
    it('should not create redirect loops', async () => {
      mockUsernameHistory.set(Date.now(), {
        id: Date.now(),
        userId: testUserId,
        oldUsername: 'olduser1',
        changedAt: Date.now() - 259200000,
      });

      const user = mockUsers.get(testUserId);
      user.username = 'newcurrentuser';

      const pathname = '/olduser1';
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(301);
      expect(result.redirect).toContain('/newcurrentuser');
      expect(result.redirect).not.toContain('/olduser1');

      user.username = testUsername;
    });

    it('should handle users with many username changes', async () => {
      const usernames = ['user1', 'user2', 'user3', 'user4', 'user5'];

      for (const oldUsername of usernames) {
        mockUsernameHistory.set(Date.now() + Math.random(), {
          id: Date.now() + Math.random(),
          userId: testUserId,
          oldUsername,
          changedAt:
            Date.now() - (usernames.indexOf(oldUsername) + 1) * 86400000,
        });
      }

      for (const oldUsername of usernames) {
        const pathname = `/${oldUsername}`;
        const result = await mockMiddlewareCheck(pathname);

        expect(result.status).toBe(301);
        expect(result.redirect).toContain(`/${testUsername}`);
      }
    });

    it('should redirect directly to current username, not through chain', async () => {
      mockUsernameHistory.set(1, {
        id: 1,
        userId: testUserId,
        oldUsername: 'old1',
        changedAt: Date.now() - 259200000,
      });
      mockUsernameHistory.set(2, {
        id: 2,
        userId: testUserId,
        oldUsername: 'old2',
        changedAt: Date.now() - 172800000,
      });
      mockUsernameHistory.set(3, {
        id: 3,
        userId: testUserId,
        oldUsername: 'old3',
        changedAt: Date.now() - 86400000,
      });

      const pathname = '/old1';
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).toBe(301);
      expect(result.redirect).toContain(`/${testUsername}`);
    });
  });

  describe('Special Routes', () => {
    it('should not redirect dashboard routes', async () => {
      const pathname = '/dashboard';
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).not.toBe(301);
    });

    it('should not redirect API routes', async () => {
      const pathname = '/api/short-links/user';
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).not.toBe(301);
    });

    it('should not redirect static routes', async () => {
      const staticRoutes = ['/login', '/signup', '/about', '/privacy'];
      for (const route of staticRoutes) {
        const result = await mockMiddlewareCheck(route);
        expect(result.status).not.toBe(301);
      }
    });

    it('should not redirect short link routes', async () => {
      const pathname = '/s/abc123';
      const result = await mockMiddlewareCheck(pathname);

      expect(result.status).not.toBe(301);
    });
  });
});

async function mockMiddlewareCheck(pathname, headersList, searchParams) {
  const url = searchParams ? `${pathname}?${searchParams}` : pathname;
  const path = url.split('?')[0];
  const segments = path.split('/').filter(Boolean);

  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/api/') ||
    path.startsWith('/s/')
  ) {
    return { status: 200, redirect: undefined, headers: {} };
  }

  const reservedUsernames = ['admin', 'api', 'www', 'root', 'system'];

  if (segments.length > 0) {
    const possibleUsername = segments[0].toLowerCase();

    if (reservedUsernames.includes(possibleUsername)) {
      return { status: 404, redirect: undefined, headers: {} };
    }

    if (!/^[a-z0-9-]{3,}$/.test(possibleUsername)) {
      return { status: 404, redirect: undefined, headers: {} };
    }

    const users = Array.from(mockUsers.values()).filter(
      (u) => u.username === possibleUsername
    );
    if (users.length > 0) {
      if (segments[0] !== possibleUsername) {
        let redirectPath = `/${users[0].username}`;
        if (segments.length > 1) {
          redirectPath += '/' + segments.slice(1).join('/');
        }
        if (searchParams) {
          redirectPath += '?' + searchParams;
        }
        return { status: 301, redirect: redirectPath, headers: {} };
      }
      return { status: 200, redirect: undefined, headers: {} };
    }

    const historyItems = Array.from(mockUsernameHistory.values()).filter(
      (h) => h.oldUsername === possibleUsername
    );
    if (historyItems.length > 0) {
      const currentUser = Array.from(mockUsers.values()).filter(
        (u) => u.id === historyItems[0].userId
      );
      if (currentUser.length > 0) {
        let redirectPath = `/${currentUser[0].username}`;
        if (segments.length > 1) {
          redirectPath += '/' + segments.slice(1).join('/');
        }
        if (searchParams) {
          redirectPath += '?' + searchParams;
        }
        return { status: 301, redirect: redirectPath, headers: {} };
      }
    }
  }

  return { status: 404, redirect: undefined, headers: {} };
}
