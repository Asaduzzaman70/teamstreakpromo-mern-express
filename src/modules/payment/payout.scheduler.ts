import { PaymentService } from './payment.service.js';
import logger from '../../utils/logger.js';

let payoutIntervalTimer: NodeJS.Timeout | null = null;

/**
 * Starts the automated event payout background task.
 * Automatically checks and processes payouts for events whose end dates have passed.
 *
 * @param intervalMs Check frequency in milliseconds (default: 15 minutes)
 */
export const startPayoutScheduler = (intervalMs = 15 * 60 * 1000): void => {
  if (payoutIntervalTimer) {
    logger.info('[PayoutScheduler]: Scheduler is already running.');
    return;
  }

  const runSweep = async () => {
    try {
      logger.info('[PayoutScheduler]: Running automated payout sweep for completed events...');
      const summary = await PaymentService.processCompletedEventPayouts();
      if (summary.processedCount > 0) {
        logger.info(
          `[PayoutScheduler]: Sweep finished. Processed: ${summary.processedCount}, Success: ${summary.results.length}, Errors: ${summary.errors.length}`
        );
      }
    } catch (err: any) {
      logger.error('[PayoutScheduler]: Error running automated payout sweep:', err?.message || err);
    }
  };

  // Run initial sweep 10 seconds after server startup
  const startupTimer = setTimeout(runSweep, 10000);
  if (typeof startupTimer.unref === 'function') {
    startupTimer.unref();
  }

  // Set recurring interval timer
  payoutIntervalTimer = setInterval(runSweep, intervalMs);
  logger.info(`[PayoutScheduler]: Started automated payout scheduler (interval: ${intervalMs / 1000}s).`);
};

/**
 * Stops the automated payout background task.
 */
export const stopPayoutScheduler = (): void => {
  if (payoutIntervalTimer) {
    clearInterval(payoutIntervalTimer);
    payoutIntervalTimer = null;
    logger.info('[PayoutScheduler]: Stopped payout scheduler.');
  }
};
