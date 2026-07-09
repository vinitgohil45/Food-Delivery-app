import logger from '../utils/logger.js';

// Custom Error Class to propagate HTTP status codes
export class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Express Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || 'Something went wrong';
  error.statusCode = err.statusCode || 500;

  // Log error using Winston
  logger.error(`${req.method} ${req.originalUrl} - ${error.statusCode} - ${error.message}`, { stack: err.stack });

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new AppError(message, 400);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((val) => val.message);
    error = new AppError('Validation failed', 400, validationErrors);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for field: ${field}. Please use another value.`;
    error = new AppError(message, 400);
  }

  // Handle JWT signature error
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token. Please log in again.', 401);
  }

  // Handle JWT token expired error
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your authentication token has expired. Please log in again.', 401);
  }

  // Send standardized JSON response format
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    data: null,
    errors: error.errors || [error.message],
  });
};
