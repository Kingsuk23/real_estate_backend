import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../lib/prisma';

export const ensureUserExists = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Authentication required',
    });
  }

  const user = await prisma.users.findUnique({
    where: {
      id: req.user.id,
    },
  });

  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'User account is not active',
    });
  }

  next();
};
