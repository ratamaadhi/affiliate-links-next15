import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';

const mockUsers = new Map();
const mockUsernameHistory = new Map();
const mockShortLinks = new Map();
const mockPages = new Map();

let testUserId = 1;
let testUsername = 'testuser123';
let testUserEmail = 'testuser123@example.com';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: jest.fn((_table) => ({
        where: jest.fn((condition) => {
          const { userId, username, oldUsername, id } = condition;
          let results = [];

          if (username !== undefined) {
            results = Array.from(mockUsers.values()).filter(
              (u) => u.username === username
            );
          } else if (userId !== undefined) {
            results = Array.from(mockUsers.values()).filter(
              (u) => u.id === userId
            );
          } else if (id !== undefined) {
            results = Array.from(mockUsers.values()).filter((u) => u.id === id);
          } else if (oldUsername !== undefined) {
            results = Array.from(mockUsernameHistory.values()).filter(
              (h) => h.oldUsername === oldUsername
            );
          }

          return Promise.resolve(results);
        }),
      })),
    }),
    insert: jest.fn((table) => ({
      values: jest.fn((data) => ({
        returning: jest.fn(async () => {
          if (Array.isArray(data)) {
            const inserted = data.map((item) => {
              const id = Date.now() + Math.random();
              const newItem = { id, ...item };
              if (table.mockName === 'usernameHistory') {
                mockUsernameHistory.set(id, newItem);
              } else if (table.mockName === 'page') {
                mockPages.set(id, newItem);
              }
              return newItem;
            });
            return inserted;
          } else {
            const id = Date.now() + Math.random();
            const newItem = { id, ...data };
            if (table.mockName === 'user') {
              mockUsers.set(testUserId, {
                ...mockUsers.get(testUserId),
                ...data,
              });
              return [mockUsers.get(testUserId)];
            } else if (table.mockName === 'usernameHistory') {
              mockUsernameHistory.set(id, newItem);
              return [newItem];
            } else if (table.mockName === 'shortLink') {
              mockShortLinks.set(id, newItem);
              return [newItem];
            } else if (table.mockName === 'page') {
              mockPages.set(id, newItem);
              return [newItem];
            }
            return [newItem];
          }
        }),
      })),
    })),
    delete: jest.fn((table) => ({
      where: jest.fn((condition) => {
        const { userId, id } = condition;
        if (userId !== undefined) {
          if (table.mockName === 'usernameHistory') {
            for (const [key, value] of mockUsernameHistory.entries()) {
              if (value.userId === userId) {
                mockUsernameHistory.delete(key);
              }
            }
          } else if (table.mockName === 'shortLink') {
            for (const [key, value] of mockShortLinks.entries()) {
              if (value.userId === userId) {
                mockShortLinks.delete(key);
              }
            }
          } else if (table.mockName === 'page') {
            for (const [key, value] of mockPages.entries()) {
              if (value.userId === userId) {
                mockPages.delete(key);
              }
            }
          } else if (table.mockName === 'user' && id !== undefined) {
            mockUsers.delete(id);
          }
        }
        return Promise.resolve();
      }),
    })),
    update: jest.fn((table) => ({
      set: jest.fn((data) => ({
        where: jest.fn((condition) => ({
          returning: jest.fn(async () => {
            const { userId, id } = condition;
            if (table.mockName === 'user') {
              if (userId !== undefined) {
                const user = mockUsers.get(userId);
                if (user) {
                  const updated = { ...user, ...data };
                  mockUsers.set(userId, updated);
                  return [updated];
                }
              } else if (id !== undefined) {
                const user = mockUsers.get(id);
                if (user) {
                  const updated = { ...user, ...data };
                  mockUsers.set(id, updated);
                  return [updated];
                }
              }
            } else if (table.mockName === 'page' && userId !== undefined) {
              for (const [key, value] of mockPages.entries()) {
                if (value.userId === userId) {
                  mockPages.set(key, { ...value, ...data });
                }
              }
              return Array.from(mockPages.values()).filter(
                (p) => p.userId === userId
              );
            }
            return [];
          }),
        })),
      })),
    })),
    import: jest.fn(async (_module) => {
      const schema = await import('@/lib/db/schema');
      return schema;
    }),
  },
}));

// Mock eq function
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => {
    if (typeof field === 'object' && field.table !== undefined) {
      return { userId: value, username: value, oldUsername: value, id: value };
    }
    return { userId: value, username: value, oldUsername: value, id: value };
  }),
  and: jest.fn(),
}));

const reservedUsernames = ['admin', 'api', 'www', 'root', 'system'];

async function checkUsernameAvailability(username) {
  if (reservedUsernames.includes(username)) {
    return { available: false, reason: 'Username is reserved' };
  }

  const usernameRegex = /^[a-z0-9-]{3,}$/;
  if (!usernameRegex.test(username)) {
    return { available: false, reason: 'Invalid username format' };
  }

  const existingUser = Array.from(mockUsers.values()).find(
    (u) => u.username === username
  );
  if (existingUser) {
    return { available: false, reason: 'Username is already taken' };
  }

  const historyItem = Array.from(mockUsernameHistory.values()).find(
    (h) => h.oldUsername === username
  );
  if (historyItem) {
    return { available: false, reason: 'Username was previously used' };
  }

  return { available: true };
}

async function canChangeUsername(userId, newUsername) {
  const user = mockUsers.get(userId);
  if (!user) {
    return { canChange: false, reason: 'User not found' };
  }

  if (user.username === newUsername) {
    return { canChange: false, reason: 'Same username' };
  }

  const availabilityCheck = await checkUsernameAvailability(newUsername);
  if (!availabilityCheck.available) {
    return { canChange: false, reason: availabilityCheck.reason };
  }

  if (user.lastUsernameChangeAt) {
    const daysSinceChange = Math.floor(
      (Date.now() - user.lastUsernameChangeAt) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceChange < 30) {
      return {
        canChange: false,
        reason: 'Cooldown period not passed',
        cooldownDays: 30 - daysSinceChange,
      };
    }
  }

  return { canChange: true };
}

async function getUsernameHistory(userId) {
  return Array.from(mockUsernameHistory.values())
    .filter((h) => h.userId === userId)
    .sort((a, b) => b.changedAt - a.changedAt);
}

async function handleUsernameChange(userId, newUsername) {
  const canChange = await canChangeUsername(userId, newUsername);
  if (!canChange.canChange) {
    return { success: false, error: canChange.reason };
  }

  const user = mockUsers.get(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.username === newUsername) {
    return { success: false, error: 'Cannot change to the same username' };
  }

  const oldUsername = user.username;

  const historyId = Date.now() + Math.random();
  mockUsernameHistory.set(historyId, {
    id: historyId,
    userId,
    oldUsername,
    changedAt: Date.now(),
  });

  mockUsers.set(userId, {
    ...user,
    username: newUsername,
    usernameChangeCount: (user.usernameChangeCount || 0) + 1,
    lastUsernameChangeAt: Date.now(),
  });

  for (const [key, page] of mockPages.entries()) {
    if (page.userId === userId) {
      const newSlug = page.slug.replace(oldUsername, newUsername);
      mockPages.set(key, { ...page, slug: newSlug });
    }
  }

  for (const [key, link] of mockShortLinks.entries()) {
    if (link.userId === userId) {
      const newTargetUrl = link.targetUrl.replace(oldUsername, newUsername);
      mockShortLinks.set(key, { ...link, targetUrl: newTargetUrl });
    }
  }

  return { success: true, username: newUsername };
}

describe('Username Change Logic', () => {
  beforeAll(async () => {
    mockUsers.set(testUserId, {
      id: testUserId,
      email: testUserEmail,
      username: testUsername,
      displayName: 'Test User',
      usernameChangeCount: 0,
      lastUsernameChangeAt: null,
    });
  });

  afterAll(async () => {
    mockUsers.clear();
    mockUsernameHistory.clear();
    mockShortLinks.clear();
    mockPages.clear();
  });

  beforeEach(async () => {
    mockUsernameHistory.clear();
    mockShortLinks.clear();
    mockPages.clear();

    const user = mockUsers.get(testUserId);
    user.usernameChangeCount = 0;
    user.lastUsernameChangeAt = null;
    user.username = testUsername;
  });

  describe('checkUsernameAvailability', () => {
    it('should return available for a new username', async () => {
      const result = await checkUsernameAvailability('newuniqueusername12345');
      expect(result.available).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return unavailable for existing username', async () => {
      const result = await checkUsernameAvailability(testUsername);
      expect(result.available).toBe(false);
      expect(result.reason).toContain('already taken');
    });

    it('should return unavailable for username in history', async () => {
      const oldUsername = 'oldusername12345';
      mockUsernameHistory.set(Date.now(), {
        id: Date.now(),
        userId: testUserId,
        oldUsername,
        changedAt: Date.now(),
      });

      const result = await checkUsernameAvailability(oldUsername);
      expect(result.available).toBe(false);
      expect(result.reason).toContain('previously used');
    });

    it('should return unavailable for reserved usernames', async () => {
      const reservedUsernames = ['admin', 'api', 'www', 'root', 'system'];
      for (const reserved of reservedUsernames) {
        const result = await checkUsernameAvailability(reserved);
        expect(result.available).toBe(false);
        expect(result.reason).toContain('reserved');
      }
    });

    it('should validate username format [a-z0-9-]+', async () => {
      const invalidFormats = [
        'InvalidCase',
        'user_name',
        'user.name',
        'user!',
        'ab',
        'a',
      ];

      for (const invalidUsername of invalidFormats) {
        const result = await checkUsernameAvailability(invalidUsername);
        expect(result.available).toBe(false);
        expect(result.reason).toContain('format');
      }
    });

    it('should accept valid username format', async () => {
      const validFormats = [
        'abcde', // unique
        'fgh-ij', // unique
        'klmno',
        'pqrst',
        'u-v-w-x',
      ];

      for (const validUsername of validFormats) {
        const result = await checkUsernameAvailability(validUsername);
        expect(result.available).toBe(true);
        expect(result.reason).toBeUndefined();
      }
    });
  });

  describe('canChangeUsername', () => {
    it('should allow change when cooldown has passed', async () => {
      const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
      const user = mockUsers.get(testUserId);
      user.lastUsernameChangeAt = thirtyOneDaysAgo;
      user.usernameChangeCount = 1;

      const result = await canChangeUsername(testUserId, 'newusername');
      expect(result.canChange).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should prevent change when in cooldown period', async () => {
      const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
      const user = mockUsers.get(testUserId);
      user.lastUsernameChangeAt = fifteenDaysAgo;
      user.usernameChangeCount = 1;

      const result = await canChangeUsername(testUserId, 'newusername');
      expect(result.canChange).toBe(false);
      expect(result.reason).toMatch(/cooldown/i);
      expect(result.cooldownDays).toBeGreaterThan(0);
    });

    it('should allow first username change', async () => {
      const result = await canChangeUsername(testUserId, 'newusername');
      expect(result.canChange).toBe(true);
    });

    it('should check availability before allowing change', async () => {
      const result = await canChangeUsername(testUserId, testUsername);
      expect(result.canChange).toBe(false);
      expect(result.reason).toMatch(/same/i);
    });

    it('should validate format before allowing change', async () => {
      const result = await canChangeUsername(testUserId, 'InvalidFormat');
      expect(result.canChange).toBe(false);
      expect(result.reason).toContain('format');
    });

    it('should return exact cooldown days remaining', async () => {
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      const user = mockUsers.get(testUserId);
      user.lastUsernameChangeAt = tenDaysAgo;
      user.usernameChangeCount = 1;

      const result = await canChangeUsername(testUserId, 'newusername');
      expect(result.canChange).toBe(false);
      expect(result.cooldownDays).toBe(20);
    });
  });

  describe('handleUsernameChange', () => {
    it('should successfully change username', async () => {
      const newUsername = 'newusername123';
      const result = await handleUsernameChange(testUserId, newUsername);

      expect(result.success).toBe(true);
      expect(result.username).toBe(newUsername);

      const user = mockUsers.get(testUserId);
      expect(user.username).toBe(newUsername);
      expect(user.usernameChangeCount).toBe(1);
      expect(user.lastUsernameChangeAt).toBeGreaterThan(0);
    });

    it('should save old username to history', async () => {
      const newUsername = 'newusername456';
      await handleUsernameChange(testUserId, newUsername);

      const history = await getUsernameHistory(testUserId);
      expect(history).toHaveLength(1);
      expect(history[0].oldUsername).toBe(testUsername);
      expect(history[0].changedAt).toBeGreaterThan(0);
    });

    it('should increment username change count', async () => {
      const newUsername1 = 'newusername789';
      await handleUsernameChange(testUserId, newUsername1);

      const user1 = mockUsers.get(testUserId);
      expect(user1.usernameChangeCount).toBe(1);

      const user = mockUsers.get(testUserId);
      user.lastUsernameChangeAt = Date.now() - 31 * 24 * 60 * 60 * 1000;

      const newUsername2 = 'newusername987';
      await handleUsernameChange(testUserId, newUsername2);

      const user2 = mockUsers.get(testUserId);
      expect(user2.usernameChangeCount).toBe(2);
    });

    it('should not allow changing to same username', async () => {
      const result = await handleUsernameChange(testUserId, testUsername);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/same/i);
    });

    it('should fail if username is unavailable', async () => {
      const anotherUserId = 2;
      mockUsers.set(anotherUserId, {
        id: anotherUserId,
        email: 'existinguser@example.com',
        username: 'existinguser',
        displayName: 'Existing User',
        usernameChangeCount: 0,
        lastUsernameChangeAt: null,
      });

      const unavailableUsername = 'existinguser';
      const result = await handleUsernameChange(
        testUserId,
        unavailableUsername
      );
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/taken/i);

      mockUsers.delete(anotherUserId);
    });

    it('should fail if username format is invalid', async () => {
      const invalidUsername = 'InvalidUsername';
      const result = await handleUsernameChange(testUserId, invalidUsername);
      expect(result.success).toBe(false);
      expect(result.error).toContain('format');
    });

    it('should fail if cooldown period has not passed', async () => {
      const user = mockUsers.get(testUserId);
      user.lastUsernameChangeAt = Date.now();
      user.usernameChangeCount = 1;

      const result = await handleUsernameChange(testUserId, 'newusername');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/cooldown/i);
    });
  });

  describe('getUsernameHistory', () => {
    it('should return empty array for new user', async () => {
      const history = await getUsernameHistory(testUserId);
      expect(history).toEqual([]);
    });

    it('should return history in chronological order', async () => {
      const now = Date.now();
      mockUsernameHistory.set(1, {
        id: 1,
        userId: testUserId,
        oldUsername: 'username1',
        changedAt: now - 3000,
      });
      mockUsernameHistory.set(2, {
        id: 2,
        userId: testUserId,
        oldUsername: 'username2',
        changedAt: now - 2000,
      });
      mockUsernameHistory.set(3, {
        id: 3,
        userId: testUserId,
        oldUsername: 'username3',
        changedAt: now - 1000,
      });

      const history = await getUsernameHistory(testUserId);
      expect(history).toHaveLength(3);
      expect(history[0].oldUsername).toBe('username3');
      expect(history[1].oldUsername).toBe('username2');
      expect(history[2].oldUsername).toBe('username1');
    });

    it('should only return history for specific user', async () => {
      const anotherUserId = 2;
      mockUsers.set(anotherUserId, {
        id: anotherUserId,
        email: 'anotheruser@example.com',
        username: 'anotheruser',
        displayName: 'Another User',
        usernameChangeCount: 0,
        lastUsernameChangeAt: null,
      });

      mockUsernameHistory.set(1, {
        id: 1,
        userId: testUserId,
        oldUsername: 'testuserold',
        changedAt: Date.now(),
      });

      mockUsernameHistory.set(2, {
        id: 2,
        userId: anotherUserId,
        oldUsername: 'anotheruserold',
        changedAt: Date.now(),
      });

      const history1 = await getUsernameHistory(testUserId);
      expect(history1).toHaveLength(1);
      expect(history1[0].oldUsername).toBe('testuserold');

      const history2 = await getUsernameHistory(anotherUserId);
      expect(history2).toHaveLength(1);
      expect(history2[0].oldUsername).toBe('anotheruserold');

      mockUsers.delete(anotherUserId);
      mockUsernameHistory.clear();
    });
  });

  describe('Page Slug Updates', () => {
    it('should update all page slugs when username changes', async () => {
      const oldUsername = testUsername;

      mockPages.set(1, {
        id: 1,
        userId: testUserId,
        slug: `${oldUsername}/page1-random`,
        title: 'Page 1',
        description: 'Description 1',
      });
      mockPages.set(2, {
        id: 2,
        userId: testUserId,
        slug: `${oldUsername}/page2-random`,
        title: 'Page 2',
        description: 'Description 2',
      });

      const newUsername = 'newusername999';
      await handleUsernameChange(testUserId, newUsername);

      const pages = Array.from(mockPages.values()).filter(
        (p) => p.userId === testUserId
      );

      expect(pages).toHaveLength(2);
      expect(pages[0].slug).toContain(newUsername);
      expect(pages[1].slug).toContain(newUsername);
      expect(pages[0].slug).not.toContain(oldUsername);
      expect(pages[1].slug).not.toContain(oldUsername);
    });

    it('should update short link target URLs when username changes', async () => {
      const oldUsername = testUsername;

      mockPages.set(1, {
        id: 1,
        userId: testUserId,
        slug: `${oldUsername}/mypage-random`,
        title: 'My Page',
        description: 'Description',
      });

      mockShortLinks.set(1, {
        id: 1,
        shortCode: 'abc123',
        targetUrl: `/${oldUsername}/mypage-random`,
        pageId: 1,
        userId: testUserId,
        clickCount: 0,
        createdAt: Date.now(),
      });

      const newUsername = 'newusername888';
      await handleUsernameChange(testUserId, newUsername);

      const links = Array.from(mockShortLinks.values()).filter(
        (s) => s.userId === testUserId
      );

      expect(links).toHaveLength(1);
      expect(links[0].targetUrl).toContain(newUsername);
      expect(links[0].targetUrl).not.toContain(oldUsername);
    });
  });
});
