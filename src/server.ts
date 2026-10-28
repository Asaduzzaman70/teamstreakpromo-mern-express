import mongoose from 'mongoose';
import app from './app.js';
import config from './config/config.js';
import { connectDB } from './config/db.js';
import { startPayoutScheduler, stopPayoutScheduler } from './modules/payment/payout.scheduler.js';
import logger from './utils/logger.js';

const PORT = config.port;

// Connect to Database on startup for long-running server mode (VPS)
connectDB()
  .then(() => {
    // Start background automated payout scheduler
    startPayoutScheduler();
  })
  .catch((err) => {
    logger.error('[server]: Failed to establish DB connection on startup:', err);
  });

const server = app.listen(PORT, () => {
  logger.info(`[server]: Server is running at http://localhost:${PORT}`);
});

const gracefulShutdown = (signal: string) => {
  logger.info(`[server]: ${signal} received. Starting graceful shutdown...`);
  stopPayoutScheduler();

  server.close(async () => {
    logger.info('[server]: HTTP server closed.');
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info('[server]: MongoDB connection closed cleanly.');
      }
      process.exit(0);
    } catch (err) {
      logger.error('[server]: Error closing MongoDB connection during shutdown:', err);
      process.exit(1);
    }
  });

  // Force exit if connections do not close within 10 seconds
  setTimeout(() => {
    logger.error('[server]: Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('[server]: Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('[server]: Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});
