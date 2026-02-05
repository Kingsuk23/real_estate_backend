import type { Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { baseError, errorHandler } from '../utils/Errorhandler';

export const centralizeErrorHandler = (err: Error, req: Request, res: Response) => {
  if (err instanceof baseError && errorHandler.isTrustedError(err)) {
    return res.status(err.httpStatusCode).json({
      name: err.name,
      message: err.message,
    });
  }

  errorHandler.handleError(err as Error);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    name: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    message: 'Internal server error',
  });
};
