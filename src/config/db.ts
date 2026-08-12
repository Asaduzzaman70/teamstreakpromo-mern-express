import mongoose from 'mongoose';
import config from './config.js';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[database]: MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[database]: Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};
