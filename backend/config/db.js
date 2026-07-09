import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { config } from './env.js';

let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

export const connectDB = async () => {
  try {
    connectionAttempts++;
    logger.info(`Database connection attempt #${connectionAttempts} to ${config.mongoUri.split('@')[1] || 'local database'}`);
    
    await mongoose.connect(config.mongoUri);
    logger.info('🔌 MongoDB database connection established successfully');
    connectionAttempts = 0; // Reset attempts on successful connection
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error.message}`);
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, connectionAttempts - 1);
      logger.warn(`Retrying database connection in ${delay}ms...`);
      setTimeout(connectDB, delay);
    } else {
      logger.error('❌ Failed to connect to MongoDB database after max retry attempts. Exiting process...');
      process.exit(1);
    }
  }
};

// Monitor mongoose connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('🔌 MongoDB connection disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`🔌 MongoDB error event: ${err.message}`);
});

// Graceful shutdown logic
export const closeDatabaseConnection = async () => {
  try {
    logger.info('Gracefully terminating MongoDB connection...');
    await mongoose.connection.close();
    logger.info('🔌 MongoDB connection closed successfully');
  } catch (error) {
    logger.error(`Error terminating MongoDB connection: ${error.message}`);
  }
};
