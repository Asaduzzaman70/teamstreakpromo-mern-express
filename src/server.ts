import app from './app.js';
import config from './config/config.js';
import { connectDB } from './config/db.js';

const PORT = config.port;

// Connect to Database
connectDB();

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
