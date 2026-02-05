import Redis from 'ioredis';
import env from '../utils/envConfig';

export const redisClient = new Redis(env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});
