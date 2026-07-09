import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';
import asyncHandler from './asyncHandler.js';

/**
 * Access token protector middleware
 * Assert that a request holds a valid JWT access token
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check headers for authorization bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // 1. Verify token signature
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your login token has expired. Please refresh session.', 401));
    }
    return next(new AppError('Invalid token signature. Please log in again.', 401));
  }

  // 2. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 3. Attach user record to request context
  req.user = currentUser;
  next();
});

/**
 * Role authorization guard middleware
 * Restrict access to specific roles (e.g., 'admin', 'restaurant_owner')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User session context not established', 500));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access Denied. You do not have permissions to perform this action.', 403));
    }
    next();
  };
};

/**
 * Optional access token protector middleware
 * Attaches user to req.user if a valid token is provided, else proceeds as guest
 */
export const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const currentUser = await User.findById(decoded.id);
    if (currentUser) {
      req.user = currentUser;
    }
  } catch (error) {
    // Ignore invalid tokens for optional protection
  }
  next();
});
