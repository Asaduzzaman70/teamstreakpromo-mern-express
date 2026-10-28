import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { User } from '../modules/auth/auth.model.js';
import { Employee } from '../modules/employee/employee.model.js';

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

      const user = await User.findById(decoded.id)
        .select('_id role isActive isSuspend isDeleted')
        .lean();

      if (user) {
        if (user.isDeleted) {
          res.status(403).json({
            success: false,
            message: 'This account has been deleted. Please contact support.',
          });
          return;
        }

        if (user.isSuspend) {
          res.status(403).json({
            success: false,
            message: 'Your account is suspended. Please contact support.',
          });
          return;
        }

        if (!user.isActive) {
          res.status(401).json({
            success: false,
            message: 'Your account is not active.',
          });
          return;
        }

        req.user = { id: user._id.toString(), role: user.role };
        next();
        return;
      }

      // Fallback check for subordinate Employee accounts
      const employee = await Employee.findById(decoded.id)
        .select('_id isActive employerType')
        .lean();

      if (employee) {
        if (!employee.isActive) {
          res.status(401).json({
            success: false,
            message: 'Employee account is inactive.',
          });
          return;
        }
        req.user = { id: employee._id.toString(), role: decoded.role };
        next();
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Not authorized, user account no longer exists',
      });
    } catch {
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
 * If a valid Bearer token is provided and the account is active, populates req.user.
 * If no token or invalid token is provided, proceeds normally as unauthenticated visitor.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
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

        const user = await User.findById(decoded.id)
          .select('_id role isActive isSuspend isDeleted')
          .lean();

        if (user && user.isActive && !user.isSuspend && !user.isDeleted) {
          req.user = { id: user._id.toString(), role: user.role };
        }
      }
    } catch {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};
