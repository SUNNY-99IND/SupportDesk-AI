/**
 * MongoDB Database Adapter
 *
 * Connects to MongoDB via Mongoose when MONGO_URL is provided, or
 * transparently uses memoryStore if offline/unconfigured.
 */
import mongoose from 'mongoose';
import { env } from '../config/env';

let isMongoAvailable = false;

export async function initMongo(): Promise<boolean> {
  const connectionString = env.MONGO_URL;
  if (!connectionString) {
    console.info('ℹ️  MONGO_URL not provided. Using in-memory document store.');
    return false;
  }

  try {
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoAvailable = true;
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed. Falling back to in-memory store:', (error as Error).message);
    isMongoAvailable = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isMongoAvailable && mongoose.connection.readyState === 1;
}
