import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format for readable console output
const consoleFormat = printf(({ level, message, timestamp: time, stack, ...meta }) => {
  const logMessage = stack || message;
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${time}] [${level}]: ${logMessage}${metaString}`;
});

// Custom log format for file output (structured format)
const fileFormat = printf(({ level, message, timestamp: time, stack, ...meta }) => {
  const logMessage = stack || message;
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${time}] [${level.toUpperCase()}]: ${logMessage}${metaString}`;
});

const isProduction = process.env.NODE_ENV === 'production';
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NOW_REGION
);

// Define transports
const transports: winston.transport[] = [
  // Console output (active in all environments including Vercel/serverless)
  new winston.transports.Console({
    level: isProduction ? 'info' : 'debug',
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    ),
  }),
];

// File transports are only attached in non-serverless environments (e.g. local / VPS)
// Vercel serverless environments have a read-only filesystem (/var/task) where creating log directories fails with ENOENT
if (!isServerless) {
  try {
    const logsDir = path.resolve(process.cwd(), 'logs');
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          fileFormat
        ),
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          fileFormat
        ),
      })
    );
  } catch (err) {
    // Graceful fallback to console transport if filesystem is not writable
    console.warn('[logger]: File transports disabled due to filesystem restriction:', err);
  }
}

// Create Winston logger instance
export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  transports,
  exitOnError: false,
});

export default logger;
