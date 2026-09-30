import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { tokenService, TokenService } from '../services/token.service';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error';

export function createAuthMiddleware(tokens: TokenService = tokenService) {
  const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('Authentication token missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Malformed authorization header. Expected Bearer <token>');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const payload = tokens.verifyAccessToken(token);
    req.user = payload;
    next();
  };

  const authorize = (...roles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access forbidden: role '${req.user.role}' is not authorized for this resource`
        );
      }

      next();
    };
  };

  return { authenticate, authorize };
}

const defaultAuth = createAuthMiddleware();
export const authenticate = defaultAuth.authenticate;
export const authorize = defaultAuth.authorize;
