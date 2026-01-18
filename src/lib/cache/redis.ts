import Redis from 'ioredis';

let redisClient: Redis | null = null;
let isRedisAvailable = true;

/**
 * Get or create Redis client instance
 * Implements connection pooling and graceful fallback
 */
export const getRedisClient = (): Redis | null => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn(
      'REDIS_URL environment variable not set. Caching is disabled.'
    );
    isRedisAvailable = false;
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('close', () => {
      console.warn('Redis connection closed');
      isRedisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    isRedisAvailable = false;
    return null;
  }
};

/**
 * Check if Redis is available
 */
export const isRedisReady = (): boolean => {
  return isRedisAvailable && redisClient?.status === 'ready';
};

/**
 * Gracefully close Redis connection
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis connection closed gracefully');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    } finally {
      redisClient = null;
      isRedisAvailable = false;
    }
  }
};

/**
 * Health check for Redis
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
};
