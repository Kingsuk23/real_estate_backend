import { StatusCodes } from 'http-status-codes';
import { logger } from './winstonConfig';

export class baseError extends Error {
  public readonly name: string;
  public readonly httpStatusCode: StatusCodes;
  public readonly isOperational: boolean;

  constructor(name: string, httpStatusCode: StatusCodes, description: string, isOperational: boolean) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.httpStatusCode = httpStatusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this);
  }
}

class errorHandlerClass {
  public async handleError(err: Error): Promise<void> {
    await logger.error('Error message from the centralized error-handling component', err);
  }

  public isTrustedError(err: Error) {
    if (err instanceof baseError) {
      return err.isOperational;
    }

    return false;
  }
}

export const errorHandler = new errorHandlerClass();
