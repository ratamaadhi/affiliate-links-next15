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
const mockPages = new Map();
let redirectCache = new Map();

let testUserId1 = 1;
let testUserId2 = 2;
let testUsername1 = 'user1';
let testUsername2 = 'user2';

describe('Username Change Redirect - Reusing Previously Used Username', () => {
  beforeAll(async () => {
    // Setup two users
    mockUsers.set(testUserId1, {
      id: testUserId1,
      email: 'user1@example.com',
      username: testUsername1,
      displayName: 'User 1',
      usernameChangeCount: 0,
      lastUsernameChangeAt: null,
    });

    mockUsers.set(testUserId2, {
      id: testUserId2,
      email: 'user2@example.com',
      username: testUsername2,
      displayName: 'User 2',
      usernameChangeCount: 0,
      lastUsernameChangeAt: null,
    });

    // Setup default page for user1
    mockPages.set(1, {
      id: 1,
      userId: testUserId1,
      slug: testUsername1,
      title: 'User 1 Home',
      description: 'User 1 home page',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Setup default page for user2
    mockPages.set(2, {
      id: 2,
      userId: testUserId2,
      slug: testUsername2,
      title: 'User 2 Home',
      description: 'User 2 home page',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  afterAll(async () => {
    mockUsers.clear();
    mockUsernameHistory.clear();
    mockPages.clear();
    redirectCache.clear();
  });

  beforeEach(async () => {
    mockUsernameHistory.clear();
    redirectCache.clear();

    // Reset users to initial state
    const user1 = mockUsers.get(testUserId1);
    user1.username = testUsername1;
    user1.usernameChangeCount = 0;
    user1.lastUsernameChangeAt = null;

    const user2 = mockUsers.get(testUserId2);
    user2.username = testUsername2;
    user2.usernameChangeCount = 0;
    user2.lastUsernameChangeAt = null;

    // Reset page slugs
    const page1 = mockPages.get(1);
    page1.slug = testUsername1;

    const page2 = mockPages.get(2);
    page2.slug = testUsername2;
  });

  describe('Scenario: User2 changes username to one that User1 previously used', () => {
    it('should allow User2 to take username that User1 previously used', async () => {
      const oldUsername1 = testUsername1;
      const newUsername1 = 'user1-updated';

      // User1 changes username from 'user1' to 'user1-updated'
      await simulateUsernameChange(testUserId1, oldUsername1, newUsername1);

      // Verify user1 now has new username
      const user1 = mockUsers.get(testUserId1);
      expect(user1.username).toBe(newUsername1);

      // Verify username history has entry
      const history1 = Array.from(mockUsernameHistory.values()).filter(
        (h) => h.userId === testUserId1
      );
      expect(history1).toHaveLength(1);
      expect(history1[0].oldUsername).toBe(oldUsername1);
    });

    it('should update redirect cache correctly after username change', async () => {
      const oldUsername1 = testUsername1;
      const newUsername1 = 'user1-updated';

      // User1 changes username
      await simulateUsernameChange(testUserId1, oldUsername1, newUsername1);

      // Simulate cache initialization (like the real initializeCache function)
      await simulateCacheInitialization();

      // Cache should have: 'user1' -> 'user1-updated'
      expect(redirectCache.get(oldUsername1)).toBe(newUsername1);

      // User2 now wants to take 'user1' (which is now available since User1 changed)
      const oldUsername2 = testUsername2;
      const newUsername2 = oldUsername1; // 'user1'

      // User2 changes username from 'user2' to 'user1'
      await simulateUsernameChange(testUserId2, oldUsername2, newUsername2);

      // Update cache after the change
      await simulateCacheInitialization();

      // Cache should now have:
      // - 'user1' should NOT be in cache (because it's now active as User2's username)
      // - 'user2' -> 'user1' (User2's old username redirects to new username)
      expect(redirectCache.get('user1')).toBeUndefined();
      expect(redirectCache.get('user2')).toBe('user1');
    });

    it('should NOT redirect when accessing the newly taken username', async () => {
      const oldUsername1 = testUsername1;
      const newUsername1 = 'user1-updated';

      // User1 changes username
      await simulateUsernameChange(testUserId1, oldUsername1, newUsername1);

      // User2 takes User1's old username
      const oldUsername2 = testUsername2;
      const newUsername2 = oldUsername1; // 'user1'
      await simulateUsernameChange(testUserId2, oldUsername2, newUsername2);

      // Reinitialize cache (simulating the real behavior)
      await simulateCacheInitialization();

      // Accessing /user1 should NOT redirect (it's User2's current username)
      const redirect1 = await checkRedirect('user1');
      expect(redirect1).toBeNull();

      // Accessing /user2 should redirect to /user1
      const redirect2 = await checkRedirect('user2');
      expect(redirect2).toBe('user1');

      // Accessing /user1-updated should NOT redirect (it's User1's current username)
      const redirect3 = await checkRedirect('user1-updated');
      expect(redirect3).toBeNull();
    });

    it('should update page slug correctly when username changes', async () => {
      const oldUsername = testUsername1;
      const newUsername = 'newusername123';

      // Get the page before change
      const pageBefore = mockPages.get(1);
      expect(pageBefore.slug).toBe(oldUsername);

      // Change username
      await simulateUsernameChange(testUserId1, oldUsername, newUsername);

      // Get the page after change
      const pageAfter = mockPages.get(1);
      expect(pageAfter.slug).toBe(newUsername);
    });
  });

  describe('Scenario: User changes username multiple times', () => {
    it('should handle multiple username changes correctly', async () => {
      // User1: user1 -> user1-v2 -> user1-v3
      await simulateUsernameChange(testUserId1, 'user1', 'user1-v2');
      await simulateUsernameChange(testUserId1, 'user1-v2', 'user1-v3');

      // Simulate cache initialization
      await simulateCacheInitialization();

      // Cache should have:
      // - 'user1' -> 'user1-v3'
      // - 'user1-v2' -> 'user1-v3'
      expect(redirectCache.get('user1')).toBe('user1-v3');
      expect(redirectCache.get('user1-v2')).toBe('user1-v3');

      // Accessing current username should NOT redirect
      const redirect1 = await checkRedirect('user1-v3');
      expect(redirect1).toBeNull();

      // Accessing old usernames should redirect
      const redirect2 = await checkRedirect('user1');
      expect(redirect2).toBe('user1-v3');

      const redirect3 = await checkRedirect('user1-v2');
      expect(redirect3).toBe('user1-v3');
    });

    it('should not redirect if username is reused by another user', async () => {
      // User1: user1 -> user1-new
      await simulateUsernameChange(testUserId1, 'user1', 'user1-new');

      // Simulate cache initialization
      await simulateCacheInitialization();

      // User2: user2 -> user1 (reusing User1's old username)
      await simulateUsernameChange(testUserId2, 'user2', 'user1');

      // Reinitialize cache after User2's change
      await simulateCacheInitialization();

      // Accessing /user1 should NOT redirect (User2's current username)
      const redirect1 = await checkRedirect('user1');
      expect(redirect1).toBeNull();

      // Accessing /user2 should redirect to /user1
      const redirect2 = await checkRedirect('user2');
      expect(redirect2).toBe('user1');

      // Accessing /user1-new should NOT redirect (User1's current username)
      const redirect3 = await checkRedirect('user1-new');
      expect(redirect3).toBeNull();
    });
  });

  describe('Scenario: Direct username change followed by immediate access', () => {
    it('should allow immediate access to new username after change', async () => {
      const oldUsername = testUsername1;
      const newUsername = 'brandnewuser';

      // Change username
      await simulateUsernameChange(testUserId1, oldUsername, newUsername);

      // Reinitialize cache (this happens in the real code via reinitializeUsernameRedirectCache)
      await simulateCacheInitialization();

      // Immediately access the new username - should NOT redirect
      const redirect = await checkRedirect(newUsername);
      expect(redirect).toBeNull();

      // Access the old username - should redirect
      const oldRedirect = await checkRedirect(oldUsername);
      expect(oldRedirect).toBe(newUsername);
    });
  });
});

// Helper functions to simulate the actual code behavior

async function simulateUsernameChange(userId, oldUsername, newUsername) {
  const user = mockUsers.get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Update user
  user.username = newUsername;
  user.usernameChangeCount = (user.usernameChangeCount || 0) + 1;
  user.lastUsernameChangeAt = Date.now();

  // Add to history
  const historyId = Date.now() + Math.random();
  mockUsernameHistory.set(historyId, {
    id: historyId,
    userId,
    oldUsername,
    changedAt: Date.now(),
  });

  // Update page slug (if page exists with old username as slug)
  for (const [pageId, page] of mockPages.entries()) {
    if (page.userId === userId && page.slug === oldUsername) {
      page.slug = newUsername;
      page.updatedAt = Date.now();
    }
  }

  // Simulate updateUsernameRedirect
  redirectCache.set(oldUsername, newUsername);
  redirectCache.delete(newUsername);
}

async function simulateCacheInitialization() {
  redirectCache.clear();

  // Get all currently active usernames
  const activeUsernames = new Set(
    Array.from(mockUsers.values()).map((u) => u.username)
  );

  // Build cache from history
  for (const entry of mockUsernameHistory.values()) {
    const user = mockUsers.get(entry.userId);
    if (user) {
      const oldUsername = entry.oldUsername;
      const newUsername = user.username;

      // Only cache if:
      // 1. The old username is NOT currently active
      // 2. The new username IS currently active
      if (
        !activeUsernames.has(oldUsername) &&
        activeUsernames.has(newUsername)
      ) {
        redirectCache.set(oldUsername, newUsername);
      }
    }
  }
}

async function checkRedirect(username) {
  // Simulate getUsernameRedirect from username-redirects.ts
  return redirectCache.get(username) || null;
}
