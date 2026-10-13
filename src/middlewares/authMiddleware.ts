import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        res.status(401).json({ message: 'Not authorized, token missing' });
        return;
      }

      const decoded = jwt.verify(token, config.jwtSecret) as {
        id: string;
        role: string;
      };
      req.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden: role '${req.user?.role || 'none'}' is not authorized to access this route`,
      });
      return;
    }
    next();
  };
};

/**
 * Optional authentication middleware:
 * If a valid Bearer token is provided, populates req.user.
 * If no token or invalid token is provided, proceeds normally as unauthenticated visitor.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, config.jwtSecret) as {
          id: string;
          role: string;
        };
        req.user = { id: decoded.id, role: decoded.role };
      }
    } catch {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};


