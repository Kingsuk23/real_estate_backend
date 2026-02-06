import type { NextFunction, Request, Response } from 'express';
import z, { ZodError, ZodIssue } from 'zod';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export const validateQuery = (schema: z.ZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const error_message = error.issues.map((issue: ZodIssue) => ({
          field: `${issue.path}`,
          message: `${issue.message}`,
        }));

        return res.status(StatusCodes.BAD_REQUEST).json({
          message: error_message,
          name: getReasonPhrase(StatusCodes.BAD_REQUEST),
        });
      }
      next(error);
    }
  };
};
