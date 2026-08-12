import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    mongoUri: string;
    jwtSecret: string;
    jwtExpiresIn: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/teamstreakpromo',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_teamstreakpromo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export default config;