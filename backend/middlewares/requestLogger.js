import morgan from 'morgan';
import logger from '../utils/logger.js';

// Pipe morgan output into the winston logger stream
const stream = {
  write: (message) => logger.http(message.trim()),
};

// Log all requests in development, and only logs with level warn/error in production
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production'; // For production, we rely on load balancers or application-level errors
};

const requestLogger = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream }
);

export default requestLogger;
