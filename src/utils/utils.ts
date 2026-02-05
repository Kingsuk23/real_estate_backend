import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from './envConfig';
import { redisClient } from '../lib/redisDb';

export const genJwt = async (user: { id: string; role: string }) => {
  return await jwt.sign({ user }, env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const blacklistToken = async (token: string) => {
  const decoded = jwt.decode(token) as { exp?: number };
  if (!decoded?.exp) return;

  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl <= 0) return;

  const key = `bl:jwt:${hashToken(token)}`;

  await redisClient.set(key, '1', 'EX', ttl);
};
