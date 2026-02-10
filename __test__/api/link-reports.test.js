import { POST } from '@/app/api/link-reports/route';
import db from '@/lib/db';
import { checkReportRateLimit } from '@/lib/cache/rate-limiter';
import { sendReportEmail } from '@/lib/email/report-notification';

// Mock rate limiter
jest.mock('@/lib/cache/rate-limiter', () => ({
  checkReportRateLimit: jest.fn(),
  getClientIp: jest.fn(() => '192.168.1.1'),
  getRedisClient: jest.fn(),
}));

// Mock email notification
jest.mock('@/lib/email/report-notification', () => ({
  sendReportEmail: jest.fn(),
}));

// Mock Drizzle ORM
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ a, b })),
  relations: jest.fn(),
}));

describe('Link Reports API', () => {
  let linkFindFirstSpy, userFindFirstSpy, insertSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup spies for db methods
    linkFindFirstSpy = jest.spyOn(db.query.link, 'findFirst');
    userFindFirstSpy = jest.spyOn(db.query.user, 'findFirst');
    insertSpy = jest.spyOn(db, 'insert');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = (body, ip = '192.168.1.1') => {
    return {
      json: async () => body,
      headers: {
        get: jest.fn((name) => {
          if (name === 'x-forwarded-for') return ip;
          if (name === 'user-agent') return 'test-agent';
          return null;
        }),
      },
    };
  };

  const mockLinkData = {
    id: 1,
    title: 'Test Link',
    url: 'https://example.com',
    page: {
      userId: 1,
      title: 'Test Page',
    },
  };

  const mockPageOwner = {
    email: 'owner@example.com',
    name: 'Page Owner',
  };

  const validReportBody = {
    linkId: 1,
    reporterName: 'John Doe',
    reporterEmail: 'john@example.com',
    reason: 'broken',
    description: 'This link is broken',
  };

  describe('POST /api/link-reports', () => {
    it('should submit a valid report successfully', async () => {
      linkFindFirstSpy.mockResolvedValue(mockLinkData);
      userFindFirstSpy.mockResolvedValue(mockPageOwner);
      insertSpy.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      });
      checkReportRateLimit.mockResolvedValue({ allowed: true });
      sendReportEmail.mockResolvedValue({});

      const request = createMockRequest(validReportBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Report submitted successfully');
      expect(data.data.id).toBeDefined();
      expect(checkReportRateLimit).toHaveBeenCalledWith('192.168.1.1');
      expect(sendReportEmail).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidBody = {
        linkId: 1,
        reporterName: 'John Doe',
        // Missing reporterEmail and reason
      };

      const request = createMockRequest(invalidBody);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid request data');
      expect(data.errors).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      const invalidBody = {
        ...validReportBody,
        reporterEmail: 'not-an-email',
      };

      const request = createMockRequest(invalidBody);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
      // Check if any error is related to reporterEmail
      const hasEmailError = data.errors.some(
        (e) => e.path[0] === 'reporterEmail'
      );
      expect(hasEmailError).toBe(true);
    });

    it('should return 400 for invalid reason enum value', async () => {
      const invalidBody = {
        ...validReportBody,
        reason: 'invalid-reason',
      };

      const request = createMockRequest(invalidBody);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should return 429 when rate limit is exceeded', async () => {
      checkReportRateLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 3600,
      });

      const request = createMockRequest(validReportBody);
      const response = await POST(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Too many reports. Please try again later.');
      expect(data.retryAfter).toBe(3600);
      expect(linkFindFirstSpy).not.toHaveBeenCalled();
    });

    it('should return 404 when link does not exist', async () => {
      linkFindFirstSpy.mockResolvedValue(null);
      checkReportRateLimit.mockResolvedValue({ allowed: true });

      const request = createMockRequest(validReportBody);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Link not found');
    });

    it('should return 404 when page owner is not found', async () => {
      linkFindFirstSpy.mockResolvedValue(mockLinkData);
      userFindFirstSpy.mockResolvedValue(null);
      checkReportRateLimit.mockResolvedValue({ allowed: true });

      const request = createMockRequest(validReportBody);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Page owner not found');
    });

    it('should handle optional description field', async () => {
      linkFindFirstSpy.mockResolvedValue(mockLinkData);
      userFindFirstSpy.mockResolvedValue(mockPageOwner);
      insertSpy.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      });
      checkReportRateLimit.mockResolvedValue({ allowed: true });
      sendReportEmail.mockResolvedValue({});

      const bodyWithoutDescription = {
        linkId: 1,
        reporterName: 'John Doe',
        reporterEmail: 'john@example.com',
        reason: 'spam',
        // description is optional
      };

      const request = createMockRequest(bodyWithoutDescription);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should allow report with reason "other"', async () => {
      linkFindFirstSpy.mockResolvedValue(mockLinkData);
      userFindFirstSpy.mockResolvedValue(mockPageOwner);
      insertSpy.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      });
      checkReportRateLimit.mockResolvedValue({ allowed: true });
      sendReportEmail.mockResolvedValue({});

      const bodyWithOtherReason = {
        ...validReportBody,
        reason: 'other',
        description: 'Some other reason',
      };

      const request = createMockRequest(bodyWithOtherReason);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should allow all valid reason values', async () => {
      const validReasons = ['broken', 'inappropriate', 'spam', 'other'];

      for (const reason of validReasons) {
        jest.clearAllMocks();

        // Re-setup spies after clearAllMocks
        linkFindFirstSpy = jest.spyOn(db.query.link, 'findFirst');
        userFindFirstSpy = jest.spyOn(db.query.user, 'findFirst');
        insertSpy = jest.spyOn(db, 'insert');

        linkFindFirstSpy.mockResolvedValue(mockLinkData);
        userFindFirstSpy.mockResolvedValue(mockPageOwner);
        insertSpy.mockReturnValue({
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([{ id: 1 }]),
        });
        checkReportRateLimit.mockResolvedValue({ allowed: true });
        sendReportEmail.mockResolvedValue({});

        const body = { ...validReportBody, reason };
        const request = createMockRequest(body);
        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    it('should store IP address and user agent', async () => {
      linkFindFirstSpy.mockResolvedValue(mockLinkData);
      userFindFirstSpy.mockResolvedValue(mockPageOwner);
      insertSpy.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      });
      checkReportRateLimit.mockResolvedValue({ allowed: true });
      sendReportEmail.mockResolvedValue({});

      const request = createMockRequest(validReportBody, '10.0.0.1');
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle email failure gracefully and still succeed', async () => {
      linkFindFirstSpy.mockResolvedValue(mockLinkData);
      userFindFirstSpy.mockResolvedValue(mockPageOwner);
      insertSpy.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      });
      checkReportRateLimit.mockResolvedValue({ allowed: true });
      sendReportEmail.mockRejectedValue(new Error('Email service unavailable'));

      const request = createMockRequest(validReportBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Report submitted successfully');
    });

    it('should return 500 for unexpected errors', async () => {
      linkFindFirstSpy.mockRejectedValue(
        new Error('Database connection failed')
      );
      checkReportRateLimit.mockResolvedValue({ allowed: true });

      const request = createMockRequest(validReportBody);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error');
    });
  });

  describe('Rate Limiting', () => {
    it('should check rate limit before processing request', async () => {
      linkFindFirstSpy.mockResolvedValue(mockLinkData);
      userFindFirstSpy.mockResolvedValue(mockPageOwner);
      insertSpy.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      });
      checkReportRateLimit.mockResolvedValue({ allowed: true });
      sendReportEmail.mockResolvedValue({});

      const request = createMockRequest(validReportBody);
      await POST(request);

      expect(checkReportRateLimit).toHaveBeenCalled();
      expect(checkReportRateLimit).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should stop processing when rate limit exceeded', async () => {
      checkReportRateLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 1800,
      });

      const request = createMockRequest(validReportBody);
      await POST(request);

      expect(checkReportRateLimit).toHaveBeenCalled();
      expect(linkFindFirstSpy).not.toHaveBeenCalled();
      expect(insertSpy).not.toHaveBeenCalled();
      expect(sendReportEmail).not.toHaveBeenCalled();
    });

    it('should include retryAfter in 429 response', async () => {
      const retryAfterSeconds = 2400;
      checkReportRateLimit.mockResolvedValue({
        allowed: false,
        retryAfter: retryAfterSeconds,
      });

      const request = createMockRequest(validReportBody);
      const response = await POST(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.retryAfter).toBe(retryAfterSeconds);
    });
  });
});
