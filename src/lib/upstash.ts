import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let cachedRedis: Redis | null | undefined;
let cachedRateLimit: Ratelimit | null | undefined;

function hasRedisCredentials() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN &&
      process.env.UPSTASH_REDIS_REST_URL !== 'your_redis_url_here'
  );
}

export function getRedisClient() {
  if (cachedRedis !== undefined) {
    return cachedRedis;
  }

  if (!hasRedisCredentials()) {
    cachedRedis = null;
    return cachedRedis;
  }

  try {
    cachedRedis = Redis.fromEnv();
  } catch (error) {
    console.warn('[Upstash] Redis initialization failed:', error);
    cachedRedis = null;
  }

  return cachedRedis;
}

export function getSubmissionRateLimit() {
  if (cachedRateLimit !== undefined) {
    return cachedRateLimit;
  }

  const redis = getRedisClient();
  if (!redis) {
    cachedRateLimit = null;
    return cachedRateLimit;
  }

  cachedRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '10 m'),
    analytics: true,
  });

  return cachedRateLimit;
}
