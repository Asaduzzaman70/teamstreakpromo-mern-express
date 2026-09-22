import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const statusCode = res.statusCode;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    const logMessage = `${method} ${originalUrl} ${statusCode} - ${duration}ms [IP: ${clientIp}]`;

    if (statusCode >= 500) {
      logger.error(`[HTTP] ${logMessage}`);
    } else if (statusCode >= 400) {
      logger.warn(`[HTTP] ${logMessage}`);
    } else {
      logger.http(`[HTTP] ${logMessage}`);
    }
  });

  next();
};

export default requestLogger;
