import app from './app.js';
import config from './config/config.js';
import { connectDB } from './config/db.js';

const PORT = config.port;

// Connect to Database on startup for long-running server mode (VPS)
connectDB().catch((err) => {
  console.error('[server]: Failed to establish DB connection on startup:', err);
});

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
