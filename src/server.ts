import app from './app.js';
import config from './config/config.js';
import { connectDB } from './config/db.js';
import { startPayoutScheduler } from './modules/payment/payout.scheduler.js';

const PORT = config.port;

// Connect to Database on startup for long-running server mode (VPS)
connectDB()
  .then(() => {
    // Start background automated payout scheduler
    startPayoutScheduler();
  })
  .catch((err) => {
    console.error('[server]: Failed to establish DB connection on startup:', err);
  });

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
