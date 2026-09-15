import { PaymentService } from './payment.service.js';

let payoutIntervalTimer: NodeJS.Timeout | null = null;

/**
 * Starts the automated event payout background task.
 * Automatically checks and processes payouts for events whose end dates have passed.
 * 
 * @param intervalMs Check frequency in milliseconds (default: 15 minutes)
 */
export const startPayoutScheduler = (intervalMs = 15 * 60 * 1000): void => {
  if (payoutIntervalTimer) {
    console.log('[PayoutScheduler]: Scheduler is already running.');
    return;
  }

  const runSweep = async () => {
    try {
      console.log('[PayoutScheduler]: Running automated payout sweep for completed events...');
      const summary = await PaymentService.processCompletedEventPayouts();
      if (summary.processedCount > 0) {
        console.log(
          `[PayoutScheduler]: Sweep finished. Processed: ${summary.processedCount}, Success: ${summary.results.length}, Errors: ${summary.errors.length}`
        );
      }
    } catch (err: any) {
      console.error('[PayoutScheduler]: Error running automated payout sweep:', err?.message || err);
    }
  };

  // Run initial sweep 10 seconds after server startup
  setTimeout(runSweep, 10000);

  // Set recurring interval timer
  payoutIntervalTimer = setInterval(runSweep, intervalMs);
  console.log(`[PayoutScheduler]: Started automated payout scheduler (interval: ${intervalMs / 1000}s).`);
};

/**
 * Stops the automated payout background task.
 */
export const stopPayoutScheduler = (): void => {
  if (payoutIntervalTimer) {
    clearInterval(payoutIntervalTimer);
    payoutIntervalTimer = null;
    console.log('[PayoutScheduler]: Stopped payout scheduler.');
  }
};
