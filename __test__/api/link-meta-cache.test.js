import { POST as CLEAR_CACHE } from '@/app/api/link-meta/cache/clear/route';
import { GET as GET_CACHE } from '@/app/api/link-meta/cache/route';
import { redis } from '@/lib/redis';

// Mock redis
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

// Mock Next.js headers and URL
const createMockRequest = (url, method = 'GET', authenticated = true) => {
  const { auth } = require('@/lib/auth');

  // Mock authenticated session
  if (authenticated) {
    auth.api.getSession.mockResolvedValue({
      user: { id: 1, email: 'test@example.com' },
      session: { id: 'session123' },
    });
  } else {
    auth.api.getSession.mockResolvedValue(null);
  }

  return {
    url: url,
    method: method,
    headers: {
      get: jest.fn(),
    },
    nextUrl: new URL(url),
  };
};

describe('Link Meta Cache API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/link-meta/cache', () => {
    it('should return 401 for unauthenticated request', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache', 'GET', false
      );
      const response = await GET_CACHE(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication required. Please log in to access this endpoint.');
    });

    it('should return cached entries', async () => {
      const mockKeys = [
        'link-meta:https://example.com',
        'link-meta:https://test.com',
      ];
      const mockValues = [
        JSON.stringify({
          title: 'Example',
          description: 'Example description',
        }),
        JSON.stringify({ title: 'Test', description: 'Test description' }),
      ];

      redis.keys.mockResolvedValue(mockKeys);
      redis.get.mockImplementation((key) => {
        const index = mockKeys.indexOf(key);
        return Promise.resolve(mockValues[index]);
      });

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache', 'GET', true
      );
      const response = await GET_CACHE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.count).toBe(2);
      expect(data.entries).toHaveLength(2);
      expect(data.entries[0].key).toBe('link-meta:https://example.com');
      expect(data.entries[0].value.title).toBe('Example');
    });

    it('should respect limit parameter', async () => {
      const mockKeys = ['link-meta:1', 'link-meta:2', 'link-meta:3'];
      const mockValues = ['{"title":"1"}', '{"title":"2"}', '{"title":"3"}'];

      redis.keys.mockResolvedValue(mockKeys);
      redis.get.mockImplementation((key) => {
        const index = mockKeys.indexOf(key);
        return Promise.resolve(mockValues[index]);
      });

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache?limit=2', 'GET', true
      );
      const response = await GET_CACHE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.count).toBe(2);
      expect(data.entries).toHaveLength(2);
    });

    it('should handle empty cache', async () => {
      redis.keys.mockResolvedValue([]);

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache', 'GET', true
      );
      const response = await GET_CACHE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.count).toBe(0);
      expect(data.entries).toHaveLength(0);
    });

    it('should handle Redis errors gracefully', async () => {
      redis.keys.mockRejectedValue(new Error('Redis connection error'));

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache', 'GET', true
      );
      const response = await GET_CACHE(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to list cache');
    });

    it('should handle invalid JSON in cache', async () => {
      const mockKeys = ['link-meta:valid', 'link-meta:invalid'];
      const mockValues = ['{"title":"Valid"}', 'invalid-json-string'];

      redis.keys.mockResolvedValue(mockKeys);
      redis.get.mockImplementation((key) => {
        const index = mockKeys.indexOf(key);
        return Promise.resolve(mockValues[index]);
      });

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache', 'GET', true
      );
      const response = await GET_CACHE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.entries).toHaveLength(2);
      expect(data.entries[0].value.title).toBe('Valid');
      expect(data.entries[1].value).toBe('invalid-json-string');
    });

    it('should handle null cache values', async () => {
      const mockKeys = ['link-meta:empty'];

      redis.keys.mockResolvedValue(mockKeys);
      redis.get.mockResolvedValue(null);

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache', 'GET', true
      );
      const response = await GET_CACHE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.entries).toHaveLength(1);
      expect(data.entries[0].value).toBeNull();
    });
  });

  describe('POST /api/link-meta/cache/clear', () => {
    it('should return 401 for unauthenticated request', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache/clear', 'POST', false
      );
      const response = await CLEAR_CACHE(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication required. Please log in to access this endpoint.');
    });

    it('should clear all cache entries', async () => {
      const mockKeys = ['link-meta:1', 'link-meta:2', 'link-meta:3'];
      redis.keys.mockResolvedValue(mockKeys);
      redis.del.mockResolvedValue(3);

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache/clear', 'POST', true
      );
      const response = await CLEAR_CACHE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Deleted 3 cache key(s)');
      expect(redis.keys).toHaveBeenCalledWith('link-meta:*');
      expect(redis.del).toHaveBeenCalledWith(...mockKeys);
    });

    it('should handle empty cache', async () => {
      redis.keys.mockResolvedValue([]);

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache/clear', 'POST', true
      );
      const response = await CLEAR_CACHE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Deleted 0 cache key(s)');
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      redis.keys.mockRejectedValue(new Error('Redis connection error'));

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta/cache/clear', 'POST', true
      );
      const response = await CLEAR_CACHE(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to clear cache');
    });
  });
});
