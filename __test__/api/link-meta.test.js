import { GET, OPTIONS } from '@/app/api/link-meta/route';
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

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js headers and URL
const createMockRequest = (url) => {
  return {
    url: url,
    headers: {
      get: jest.fn((name) => {
        if (name === 'x-forwarded-for') return '192.168.1.1';
        if (name === 'x-real-ip') return '192.168.1.1';
        return null;
      }),
    },
    nextUrl: new URL(url),
  };
};

describe('Link Meta API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OPTIONS /api/link-meta', () => {
    it('should handle CORS preflight request', async () => {
      const request = createMockRequest('http://localhost:3000/api/link-meta');
      const response = await OPTIONS(request);

      expect(response.status).toBe(200);

      // Check if headers object exists and has the correct properties
      expect(response.headers).toBeDefined();

      // Check both Map and plain object storage
      const headers = response.headers;
      const plainHeaders = response._headers || {};

      // Try to get from Map first
      if (headers.get && headers.get('Access-Control-Allow-Origin')) {
        expect(headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(headers.get('Access-Control-Allow-Methods')).toBe(
          'GET, POST, OPTIONS'
        );
        expect(headers.get('Access-Control-Allow-Headers')).toBe(
          'Content-Type, Authorization'
        );
      } else {
        // Fall back to plain object
        expect(plainHeaders['Access-Control-Allow-Origin']).toBe('*');
        expect(plainHeaders['Access-Control-Allow-Methods']).toBe(
          'GET, POST, OPTIONS'
        );
        expect(plainHeaders['Access-Control-Allow-Headers']).toBe(
          'Content-Type, Authorization'
        );
      }
    });
  });

  describe('GET /api/link-meta', () => {
    it('should return 400 if URL parameter is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/link-meta');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('URL parameter is required');
    });

    it('should return 400 if URL format is invalid', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/link-meta?url=invalid-url'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid URL format');
    });

    it('should return cached data if available', async () => {
      const cachedData = {
        title: 'Cached Title',
        description: 'Cached Description',
        image: 'cached-image.jpg',
      };

      redis.get.mockResolvedValue(JSON.stringify(cachedData));

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta?url=https://example.com'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.cached).toBe(true);
      expect(data.title).toBe('Cached Title');
      expect(redis.get).toHaveBeenCalledWith('link-meta:https://example.com');
    });

    it('should fetch fresh data if refresh=true', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Title</title>
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="og-image.jpg">
          <meta property="og:url" content="https://example.com">
          <meta property="og:site_name" content="Example Site">
          <meta property="og:type" content="website">
          <link rel="icon" href="favicon.ico">
        </head>
        <body></body>
        </html>
      `;

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      redis.get.mockResolvedValue(null);

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta?url=https://example.com&refresh=true'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.title).toBe('OG Title');
      expect(data.description).toBe('OG Description');
      expect(data.image).toBe('og-image.jpg');
      expect(data.url).toBe('https://example.com');
      expect(data.domain).toBe('example.com');
      expect(data.favicon).toBe('favicon.ico');
      expect(data.siteName).toBe('Example Site');
      expect(data.type).toBe('website');
    });

    it('should handle rate limiting', async () => {
      redis.incr.mockResolvedValue(11); // Exceeds rate limit

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta?url=https://example.com'
      );
      const response = await GET(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Rate limit exceeded. Please try again later.');
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      redis.get.mockResolvedValue(null);
      // Reset rate limit counter to avoid rate limiting
      redis.incr.mockResolvedValue(1);

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta?url=https://example.com'
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch metadata');
      expect(data.details).toBe('Failed to fetch HTML: Network error');
    });

    it('should handle HTTP errors from fetch', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not Found'),
      });

      redis.get.mockResolvedValue(null);
      // Reset rate limit counter to avoid rate limiting
      redis.incr.mockResolvedValue(1);

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta?url=https://example.com'
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch metadata');
    });

    it('should extract metadata from title tag if og:title is missing', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Page Title</title>
          <meta name="description" content="Meta Description">
        </head>
        <body></body>
        </html>
      `;

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      redis.get.mockResolvedValue(null);

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta?url=https://example.com'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.title).toBe('Page Title');
      expect(data.description).toBe('Meta Description');
    });

    it('should include CORS headers in response', async () => {
      redis.get.mockResolvedValue(null);
      redis.incr.mockResolvedValue(1); // Reset rate limit counter
      global.fetch.mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve('<html><head><title>Test</title></head></html>'),
      });

      const request = createMockRequest(
        'http://localhost:3000/api/link-meta?url=https://example.com'
      );
      const response = await GET(request);

      // Check if headers exist and have correct values
      const headers = response.headers;
      const plainHeaders = response._headers || {};
      expect(headers).toBeDefined();

      // Try to get from Map first
      if (headers.get && headers.get('Access-Control-Allow-Origin')) {
        const corsOrigin = headers.get('Access-Control-Allow-Origin');
        const corsMethods = headers.get('Access-Control-Allow-Methods');
        const corsHeaders = headers.get('Access-Control-Allow-Headers');

        expect(corsOrigin).toBe('*');
        expect(corsMethods).toBe('GET, POST, OPTIONS');
        expect(corsHeaders).toBe('Content-Type, Authorization');
      } else {
        // Fall back to plain object
        expect(plainHeaders['Access-Control-Allow-Origin']).toBe('*');
        expect(plainHeaders['Access-Control-Allow-Methods']).toBe(
          'GET, POST, OPTIONS'
        );
        expect(plainHeaders['Access-Control-Allow-Headers']).toBe(
          'Content-Type, Authorization'
        );
      }
    });
  });
});
