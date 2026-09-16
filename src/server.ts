import app from './app.js';
import config from './config/config.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';

const PORT = config.port;

// Connect to Database on startup for long-running server mode (VPS)
connectDB().catch((err) => {
  logger.error('[server]: Failed to establish DB connection on startup:', err);
});

app.listen(PORT, () => {
  logger.info(`[server]: Server is running at http://localhost:${PORT}`);
});
