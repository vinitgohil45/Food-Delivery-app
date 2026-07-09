import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import RefreshToken from '../models/RefreshToken.js';

/**
 * Generate Access Token (short-lived)
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpire }
  );
};

/**
 * Generate Refresh Token (long-lived)
 */
export const generateRefreshToken = (user) => {
  const entropy = Math.random().toString(36).substring(2, 10);
  return jwt.sign(
    { id: user._id, entropy },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpire }
  );
};

/**
 * Send token response and set HTTP-only cookie
 */
export const sendTokenResponse = async (user, statusCode, res, message) => {
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRefreshToken(user);

  // Expiration date calculation for DB and cookie
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Save the refresh token in the database
  await RefreshToken.create({
    user: user._id,
    token: rawRefreshToken,
    expiresAt,
  });

  // Configure cookie options
  const cookieOptions = {
    httpOnly: true,
    expires: expiresAt,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
  };

  // Set the refresh token inside an HTTP-only cookie
  res.cookie('refreshToken', rawRefreshToken, cookieOptions);

  // Return standardized success response
  res.status(statusCode).json({
    success: true,
    message,
    data: {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
    },
    errors: null,
  });
};
