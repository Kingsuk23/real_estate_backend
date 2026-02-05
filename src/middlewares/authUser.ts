import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { hashToken } from '../utils/utils';
import { redisClient } from '../lib/redisDb';
import env from '../utils/envConfig';
import { JwtPayload } from '../types/jwtTypes';

const authUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Please authenticate using a valid token',
      name: getReasonPhrase(StatusCodes.UNAUTHORIZED),
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const key = `bl:jwt:${hashToken(token)}`;
    const isBlacklisted = await redisClient.get(key);

    if (isBlacklisted) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Token has been revoked',
        name: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      });
    }
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = decoded.user;
    next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Please authenticate using a valid token',
      name: getReasonPhrase(StatusCodes.UNAUTHORIZED),
    });
  }
};

export default authUser;
