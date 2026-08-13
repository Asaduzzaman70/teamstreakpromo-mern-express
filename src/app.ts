import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './modules/auth/auth.route.js';
import { setupSwagger } from './docs/swagger.js';

const app = express();

app.use(cors());
app.use(express.json());

// Setup Swagger UI Documentation
setupSwagger(app);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'TeamStreak Promo API is running!' });
});

// Auth Routes
app.use('/api/auth', authRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;