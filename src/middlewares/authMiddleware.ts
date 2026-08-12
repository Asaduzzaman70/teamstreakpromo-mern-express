import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
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

      const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
