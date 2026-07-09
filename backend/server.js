import http from 'http';
import app from './app.js';
import { validateEnv, config } from './config/env.js';
import { connectDB, closeDatabaseConnection } from './config/db.js';
import { initSocket } from './socket/socket.js';
import logger from './utils/logger.js';

// 1. Uncaught Exception handler
process.on('uncaughtException', (err) => {
  logger.error('CRITICAL: Uncaught Exception! Shutting down...', err);
  process.exit(1);
});

// 2. Validate Environment Configurations
validateEnv();

// 3. Connect to Database
connectDB();

// 4. Initialize HTTP server
const server = http.createServer(app);

// 5. Initialize WebSockets (Socket.io)
initSocket(server);

// 6. Listen to incoming requests
const PORT = config.port;
const expressServer = server.listen(PORT, () => {
  logger.info(`🚀 CraveGo backend server running in [${config.nodeEnv}] mode on port ${PORT}`);
});

// 7. Unhandled Rejection handler
process.on('unhandledRejection', (err) => {
  logger.error('CRITICAL: Unhandled Rejection! Shutting down...', err);
  expressServer.close(() => {
    closeDatabaseConnection().then(() => {
      process.exit(1);
    });
  });
});

// 8. Graceful Shutdown handlers
const gracefulShutdown = (signal) => {
  logger.warn(`Termination signal [${signal}] received. Commencing graceful shutdown...`);
  
  expressServer.close(async () => {
    logger.info('HTTP server closed.');
    await closeDatabaseConnection();
    logger.info('Process terminated successfully.');
    process.exit(0);
  });

  // Force close after 10s if connections refuse to terminate
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
