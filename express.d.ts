import { JwtPayload } from './src/types/jwtTypes';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload['user'];
    }
  }
}

export {};
