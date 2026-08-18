import mongoose from 'mongoose';
import config from './config.js';

let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(config.mongoUri)
      .then((m) => {
        console.log(`[database]: MongoDB Connected: ${m.connection.host}`);
        return m;
      })
      .catch((error) => {
        cachedPromise = null;
        console.error(`[database]: Connection Error: ${(error as Error).message}`);
        throw error;
      });
  }

  return cachedPromise;
};
