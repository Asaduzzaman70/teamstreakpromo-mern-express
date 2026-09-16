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
const logsDir = path.resolve(process.cwd(), 'logs');

// Define transports
const transports: winston.transport[] = [
  // Console output
  new winston.transports.Console({
    level: isProduction ? 'info' : 'debug',
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    ),
  }),
  // Persistent error log file
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
  // Persistent combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      fileFormat
    ),
  }),
];

// Create Winston logger instance
export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  transports,
  exitOnError: false,
});

export default logger;
