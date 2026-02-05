import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { redisClient } from '../lib/redisDb';

export const maxWrongAttemptsByIpParDay = 4;
export const maxConsecutiveFailsByEmailAndIp = 4;

export const limiterSlowBruteByIp = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'loginFailIpPerDay',
  points: maxWrongAttemptsByIpParDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24,
});

export const limiterConsecutiveFailsByEmailAndIp = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'loginFailConsecutiveEmailAndIp',
  points: maxConsecutiveFailsByEmailAndIp,
  duration: 60 * 60 * 24 * 90,
  blockDuration: 60 * 60 * 24 * 2,
});

export const isRateLimiterRes = (obj: object): obj is RateLimiterRes => {
  return obj && typeof obj === 'object' && 'msBeforeNext' in obj && 'consumedPoints' in obj;
};
