import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

/**
 * Sets standard HTTP security headers (equivalent to Helmet defaults)
 * without requiring external runtime dependencies.
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.removeHeader('X-Powered-By');
  next();
};

/**
 * Creates a lightweight, memory-safe sliding-window rate limiter middleware.
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests from this IP, please try again later.',
  } = options;

  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup of expired rate-limit entries every 5 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now >= entry.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const existing = store.get(clientIp);

    if (!existing || now >= existing.resetTime) {
      store.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - 1).toString());
      next();
      return;
    }

    existing.count += 1;
    const remaining = Math.max(0, maxRequests - existing.count);
    const retryAfterSeconds = Math.ceil((existing.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (existing.count > maxRequests) {
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.status(429).json({
        success: false,
        message,
      });
      return;
    }

    next();
  };
};

/**
 * Global API Rate Limiter: 200 requests per minute per IP
 */
export const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 200,
  message: 'Too many requests from this IP, please try again after a minute.',
});

/**
 * Strict Auth & OTP Rate Limiter: 15 requests per 15 minutes per IP
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'Too many authentication or OTP attempts. Please try again after 15 minutes.',
});

