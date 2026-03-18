import "server-only";

import { env } from "@/lib/config/env";

type AttemptRecord = {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
};

const attemptsByKey = new Map<string, AttemptRecord>();
const MAX_TRACKED_KEYS = 5000;

export type RateLimitStatus = {
  allowed: boolean;
  retryAfterMs?: number;
  remaining?: number;
};

const now = (): number => Date.now();

const pruneIfNeeded = (currentTime: number): void => {
  if (attemptsByKey.size < MAX_TRACKED_KEYS) return;

  for (const [key, record] of attemptsByKey) {
    if (record.lockedUntil < currentTime && currentTime - record.firstAttemptAt > env.authRateLimit.windowMs) {
      attemptsByKey.delete(key);
    }

    if (attemptsByKey.size < MAX_TRACKED_KEYS * 0.9) {
      break;
    }
  }
};

export const registerAuthAttempt = (key: string, successful: boolean): RateLimitStatus => {
  const currentTime = now();
  pruneIfNeeded(currentTime);

  const current = attemptsByKey.get(key);

  if (!current) {
    if (!successful) {
      attemptsByKey.set(key, {
        attempts: 1,
        firstAttemptAt: currentTime,
        lockedUntil: 0,
      });
    }

    return {
      allowed: true,
      remaining: Math.max(env.authRateLimit.maxAttempts - 1, 0),
    };
  }

  if (current.lockedUntil > currentTime) {
    return {
      allowed: false,
      retryAfterMs: current.lockedUntil - currentTime,
      remaining: 0,
    };
  }

  if (currentTime - current.firstAttemptAt > env.authRateLimit.windowMs) {
    current.attempts = 0;
    current.firstAttemptAt = currentTime;
    current.lockedUntil = 0;
  }

  if (successful) {
    attemptsByKey.delete(key);
    return { allowed: true, remaining: env.authRateLimit.maxAttempts };
  }

  current.attempts += 1;
  if (current.attempts >= env.authRateLimit.maxAttempts) {
    current.lockedUntil = currentTime + env.authRateLimit.lockMs;
    attemptsByKey.set(key, current);
    return {
      allowed: false,
      retryAfterMs: env.authRateLimit.lockMs,
      remaining: 0,
    };
  }

  attemptsByKey.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(env.authRateLimit.maxAttempts - current.attempts, 0),
  };
};

export const checkAuthRateLimit = (key: string): RateLimitStatus => {
  const currentTime = now();
  const current = attemptsByKey.get(key);

  if (!current) {
    return { allowed: true, remaining: env.authRateLimit.maxAttempts };
  }

  if (current.lockedUntil > currentTime) {
    return {
      allowed: false,
      retryAfterMs: current.lockedUntil - currentTime,
      remaining: 0,
    };
  }

  if (currentTime - current.firstAttemptAt > env.authRateLimit.windowMs) {
    attemptsByKey.delete(key);
    return { allowed: true, remaining: env.authRateLimit.maxAttempts };
  }

  return {
    allowed: true,
    remaining: Math.max(env.authRateLimit.maxAttempts - current.attempts, 0),
  };
};
