import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  serverUrl: string;
  clientUrl: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  resetTokenSecret: string;
  resetTokenExpiresIn: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  emailFrom: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  awsS3BucketName: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  serverUrl: process.env.SERVER_URL || 'https://teamstreakpromo-mern-express-indol.vercel.app',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/teamstreakpromo',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_teamstreakpromo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_teamstreakpromo',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  resetTokenSecret: process.env.RESET_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback_reset_secret_teamstreakpromo',
  resetTokenExpiresIn: process.env.RESET_TOKEN_EXPIRES_IN || '15m',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'TeamStreak Promo <noreply@teamstreakpromo.com>',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsS3BucketName: process.env.AWS_S3_BUCKET_NAME || 'teamstreakpromo-bucket',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

if (config.nodeEnv === 'production') {
  const missingOrWeak: string[] = [];

  if (!process.env.MONGO_URI) {
    missingOrWeak.push('MONGO_URI');
  }
  if (!process.env.JWT_SECRET || config.jwtSecret === 'fallback_secret_teamstreakpromo') {
    missingOrWeak.push('JWT_SECRET');
  }
  if (
    !process.env.JWT_REFRESH_SECRET ||
    config.jwtRefreshSecret === 'fallback_refresh_secret_teamstreakpromo'
  ) {
    missingOrWeak.push('JWT_REFRESH_SECRET');
  }
  if (
    !config.resetTokenSecret ||
    config.resetTokenSecret === 'fallback_reset_secret_teamstreakpromo' ||
    config.resetTokenSecret === 'fallback_secret_teamstreakpromo'
  ) {
    missingOrWeak.push('RESET_TOKEN_SECRET');
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    missingOrWeak.push('STRIPE_SECRET_KEY');
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    missingOrWeak.push('STRIPE_WEBHOOK_SECRET');
  }

  if (missingOrWeak.length > 0) {
    throw new Error(
      `[Config Error]: Missing or insecure required environment variables in production: ${missingOrWeak.join(', ')}`
    );
  }
}

export default config;
