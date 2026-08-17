import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './modules/auth/auth.route.js';
import categoryRoutes from './modules/category/category.route.js';
import eventRoutes from './modules/event/event.route.js';
import { setupSwagger } from './docs/swagger.js';

const app = express();

app.use(cors());
app.use(express.json());

// Setup Swagger UI Documentation
setupSwagger(app);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'TeamStreak Promo API is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;