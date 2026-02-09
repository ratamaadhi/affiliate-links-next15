import { NextRequest } from 'next/server';
import { getRedisClient, isRedisReady } from './redis';

/**
 * Rate limit result type
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds until next allowed request
}

/**
 * Extract client IP from request headers
 * Handles proxies with x-forwarded-for header
 *
 * @param request - Next.js request object
 * @returns Client IP address
 */
export const getClientIp = (request: NextRequest): string => {
  // Check x-forwarded-for header (for production behind proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one (original client)
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0];
  }

  // Check cf-connecting-ip header (Cloudflare)
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Check x-real-ip header (nginx)
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  // For local development, use localhost as identifier
  // This allows rate limiting to work in development
  const host = request.headers.get('host');
  if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
    return '127.0.0.1';
  }

  // Fallback placeholder
  return 'unknown';
};

/**
 * Check rate limit for link clicks
 * Uses Redis INCR with TTL for rate limiting
 *
 * Key format: "affiliate-links:rate-limit:click:{ip}:{linkId}"
 * Window: 60 seconds (configurable)
 * Max requests: 1 per window per link per IP (configurable)
 *
 * @param ip - Client IP address
 * @param linkId - Link ID to rate limit
 * @param windowMs - Time window in milliseconds (default: 60000ms = 1 minute)
 * @param maxRequests - Maximum requests allowed in window (default: 1)
 * @returns Rate limit result with allowed status and optional retryAfter seconds
 */
export const checkClickRateLimit = async (
  ip: string,
  linkId: number,
  windowMs: number = 60000,
  maxRequests: number = 1
): Promise<RateLimitResult> => {
  const client = getRedisClient();

  // Graceful fallback: allow request if Redis is unavailable
  if (!client) {
    console.warn(
      '[RateLimiter] Redis client not available - rate limiting disabled'
    );
    return { allowed: true };
  }

  const key = `affiliate-links:rate-limit:click:${ip}:${linkId}`;
  const windowSeconds = Math.ceil(windowMs / 1000);

  try {
    // Get current count and set to expire
    const currentCount = await client.incr(key);

    // Set expiration on first request (when count is 1)
    if (currentCount === 1) {
      await client.expire(key, windowSeconds);
    }

    console.log(
      `[RateLimiter] IP: ${ip}, Link: ${linkId}, Count: ${currentCount}/${maxRequests}`
    );

    // Check if rate limit exceeded
    if (currentCount > maxRequests) {
      // Calculate TTL for retryAfter
      const ttl = await client.ttl(key);
      console.log(
        `[RateLimiter] Rate limit exceeded for IP ${ip}, link ${linkId}. Retry after: ${ttl}s`
      );
      return {
        allowed: false,
        retryAfter: ttl > 0 ? ttl : windowSeconds,
      };
    }

    return { allowed: true };
  } catch (error) {
    // Graceful fallback: allow request on Redis error
    console.error('[RateLimiter] Rate limit check failed:', error);
    return { allowed: true };
  }
};

/**
 * Reset rate limit for a specific IP and link ID
 * Useful for testing or administrative purposes
 *
 * @param ip - Client IP address
 * @param linkId - Link ID
 * @returns Success status
 */
export const resetClickRateLimit = async (
  ip: string,
  linkId: number
): Promise<boolean> => {
  const client = getRedisClient();

  if (!client || !isRedisReady()) {
    return false;
  }

  try {
    const key = `affiliate-links:rate-limit:click:${ip}:${linkId}`;
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
    return false;
  }
};

/**
 * Check rate limit for link reports
 * Uses Redis INCR with TTL for rate limiting
 *
 * Key format: "affiliate-links:rate-limit:report:{ip}"
 * Window: 3600000ms (1 hour)
 * Max requests: 5 per hour per IP
 *
 * @param ip - Client IP address
 * @param windowMs - Time window in milliseconds (default: 3600000ms = 1 hour)
 * @param maxRequests - Maximum requests allowed in window (default: 5)
 * @returns Rate limit result with allowed status and optional retryAfter seconds
 */
export const checkReportRateLimit = async (
  ip: string,
  windowMs: number = 3600000,
  maxRequests: number = 5
): Promise<RateLimitResult> => {
  const client = getRedisClient();

  // Graceful fallback: allow request if Redis is unavailable
  if (!client) {
    console.warn(
      '[RateLimiter] Redis client not available - report rate limiting disabled'
    );
    return { allowed: true };
  }

  const key = `affiliate-links:rate-limit:report:${ip}`;
  const windowSeconds = Math.ceil(windowMs / 1000);

  try {
    const currentCount = await client.incr(key);

    if (currentCount === 1) {
      await client.expire(key, windowSeconds);
    }

    if (currentCount > maxRequests) {
      const ttl = await client.ttl(key);
      return {
        allowed: false,
        retryAfter: ttl > 0 ? ttl : windowSeconds,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[RateLimiter] Report rate limit check failed:', error);
    return { allowed: true };
  }
};
