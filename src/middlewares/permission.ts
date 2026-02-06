import { NextFunction, Request, Response } from 'express';
import { getPermissions, Permission } from '../utils/roles';
import { StatusCodes } from 'http-status-codes';

const checkPermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = getPermissions(req.user?.role as string);

    if (!permissions.includes(permission)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: 'Access denied',
      });
    }

    next();
  };
};

export default checkPermission;
