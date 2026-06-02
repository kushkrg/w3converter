import { redis } from "./redis";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `rl:${key}:${Math.floor(now / windowSeconds)}`;
  const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, windowSeconds + 1);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}
