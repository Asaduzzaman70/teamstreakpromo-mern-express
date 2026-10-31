import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import config from './config/config.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { securityHeaders, globalRateLimiter } from './middlewares/security.middleware.js';
import authRoutes from './modules/auth/auth.route.js';
import categoryRoutes from './modules/category/category.route.js';
import eventRoutes from './modules/event/event.route.js';
import employeeRoutes from './modules/employee/employee.route.js';
import employeeAuthRoutes from './modules/employeeAuth/employeeAuth.route.js';
import employeePortalRoutes from './modules/employeePortal/employeePortal.route.js';
import { paymentRoutes } from './modules/payment/payment.route.js';
import rewardCategoryRoutes from './modules/rewardCategory/rewardCategory.route.js';
import rewardSubCategoryRoutes from './modules/rewardSubCategory/rewardSubCategory.route.js';
import { MarketplaceRoutes } from './modules/marketplace/marketplace.route.js';
import { orderRoutes } from './modules/order/order.route.js';
import { eventOrderRoutes } from './modules/eventOrder/eventOrder.route.js';
import userRoutes from './modules/user/user.route.js';
import contentRoutes from './modules/content/content.route.js';
import customerSupportRoutes from './modules/customerSupport/customerSupport.route.js';
import reviewRoutes from './modules/review/review.route.js';
import partnerReviewRoutes from './modules/partnerReview/partnerReview.route.js';
import { hostAnalyticsRoutes } from './modules/hostAnalytics/hostAnalytics.route.js';
import { businessPartnerAnalyticsRoutes } from './modules/businessPartnerAnalytics/businessPartnerAnalytics.route.js';
import referralRoutes from './modules/referral/referral.route.js';
import { setupSwagger } from './docs/swagger.js';
import requestLogger from './middlewares/requestLogger.js';

const app = express();

// Trust first proxy (Nginx, Render, AWS ALB, Vercel) for accurate client IP detection
app.set('trust proxy', 1);

// Apply standard security headers & global API rate limiting
app.use(securityHeaders);
app.use(globalRateLimiter);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  ...(config.clientUrl
    ? config.clientUrl.split(',').map((url) => url.trim().replace(/\/$/, ''))
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        config.nodeEnv === 'development';

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    optionsSuccessStatus: 200,
  })
);
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(requestLogger);

// Ensure Database Connection for every request (Serverless & Traditional Server support)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Setup Swagger UI Documentation
setupSwagger(app);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'TeamStreak Promo API is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employee-auth', employeeAuthRoutes);
app.use('/api/employee-portal', employeePortalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reward-categories', rewardCategoryRoutes);
app.use('/api/reward-subcategories', rewardSubCategoryRoutes);
app.use('/api/marketplaces', MarketplaceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/event-orders', eventOrderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/customer-support', customerSupportRoutes);
app.use('/api/support', customerSupportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/partner-reviews', partnerReviewRoutes);
app.use('/api/business-reviews', partnerReviewRoutes);
app.use('/api/host-analytics', hostAnalyticsRoutes);
app.use('/api/business-partner-analytics', businessPartnerAnalyticsRoutes);
app.use('/api/referrals', referralRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
