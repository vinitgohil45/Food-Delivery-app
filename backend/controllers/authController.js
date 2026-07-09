import User from '../models/User.js';
import OTP from '../models/OTP.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateOTP } from '../utils/otp.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { sendTokenResponse, generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user and dispatch email verification OTP
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;

  // 1. Check if user already exists (email or phone)
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    return next(new AppError('A user with this email or phone number already exists', 400));
  }

  // 2. Create the user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
  });

  // 3. Generate and dispatch email verification OTP
  const otpCode = generateOTP(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await OTP.create({
    email,
    otp: otpCode,
    purpose: 'email_verification',
    expiresAt,
  });

  await sendVerificationEmail(email, name, otpCode);

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email with the OTP sent.',
    data: {
      email: user.email,
      role: user.role,
    },
    errors: null,
  });
});

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Confirm email/phone OTP and log the user in
 * @access  Public
 */
export const verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp, purpose } = req.body;

  // 1. Check OTP existence in database
  const record = await OTP.findOne({ email, otp, purpose });
  if (!record) {
    return next(new AppError('Invalid or expired verification code', 400));
  }

  // 2. Fetch user
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User account not found', 404));
  }

  // 3. Mark verification status
  if (purpose === 'email_verification') {
    user.isEmailVerified = true;
  } else if (purpose === 'phone_verification') {
    user.isPhoneVerified = true;
  }

  await user.save();

  // 4. Delete the verified OTP record
  await record.deleteOne();

  // 5. Generate secure session cookies and tokens
  await sendTokenResponse(user, 200, res, 'Account verified and logged in successfully');
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user, assign session JWT cookies, and return profile
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Fetch user including password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 2. Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 3. Check verification status
  if (!user.isEmailVerified) {
    // Re-dispatch OTP automatically if not verified
    const otpCode = generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndDelete({ email, purpose: 'email_verification' });
    await OTP.create({
      email,
      otp: otpCode,
      purpose: 'email_verification',
      expiresAt,
    });

    await sendVerificationEmail(email, user.name, otpCode);

    res.status(403).json({
      success: false,
      message: 'Your email is not verified. A verification code has been resent.',
      data: { isEmailVerified: false, email: user.email },
      errors: ['Email not verified'],
    });
    return;
  }

  // 4. Dispatch tokens
  await sendTokenResponse(user, 200, res, 'Logged in successfully');
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Rotate and refresh Access & Refresh JWT sessions
 * @access  Public (Relies on cookies)
 */
export const refreshToken = asyncHandler(async (req, res, next) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (!rawRefreshToken) {
    return next(new AppError('No session token provided', 401));
  }

  // 1. Check refresh token in database
  const storedToken = await RefreshToken.findOne({ token: rawRefreshToken });
  
  if (!storedToken) {
    // Potential hijacking attempt: User cookie token has been used or is malicious
    try {
      const decoded = jwt.verify(rawRefreshToken, config.jwtRefreshSecret);
      // Revoke all tokens for this user for security compliance
      await RefreshToken.deleteMany({ user: decoded.id });
      return next(new AppError('Session hijacked or invalid. All sessions revoked.', 401));
    } catch {
      return next(new AppError('Session expired or invalid', 401));
    }
  }

  // 2. Check if token is already revoked
  if (storedToken.isRevoked) {
    await RefreshToken.deleteMany({ user: storedToken.user });
    return next(new AppError('Reused session token. All sessions revoked.', 401));
  }

  // 3. Decode & Verify
  let decoded;
  try {
    decoded = jwt.verify(rawRefreshToken, config.jwtRefreshSecret);
  } catch (error) {
    return next(new AppError('Invalid session tokens. Please re-authenticate.', 401));
  }

  // 4. Rotate tokens: Generate new access & refresh tokens
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Mark old token as revoked and save new token
  storedToken.isRevoked = true;
  storedToken.replacedByToken = newRefreshToken;
  await storedToken.save();

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    user: user._id,
    token: newRefreshToken,
    expiresAt,
  });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    expires: expiresAt,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: { accessToken: newAccessToken },
    errors: null,
  });
});

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset OTP
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  // standard security: do not reveal user existence directly
  if (!user) {
    res.status(200).json({
      success: true,
      message: 'If this email is registered, a password reset code has been sent.',
      data: null,
      errors: null,
    });
    return;
  }

  // Generate and dispatch reset code
  const otpCode = generateOTP(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await OTP.findOneAndDelete({ email, purpose: 'password_reset' });
  await OTP.create({
    email,
    otp: otpCode,
    purpose: 'password_reset',
    expiresAt,
  });

  await sendPasswordResetEmail(email, user.name, otpCode);

  res.status(200).json({
    success: true,
    message: 'Password reset code sent successfully',
    data: { email },
    errors: null,
  });
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Change password using reset OTP
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, password } = req.body;

  // 1. Verify OTP record
  const record = await OTP.findOne({ email, otp, purpose: 'password_reset' });
  if (!record) {
    return next(new AppError('Invalid or expired reset code', 400));
  }

  // 2. Fetch User and update password
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User account not found', 404));
  }

  user.password = password;
  await user.save();

  // 3. Delete OTP record
  await record.deleteOne();

  // 4. Revoke active refresh sessions to force all devices to log in again
  await RefreshToken.deleteMany({ user: user._id });

  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please sign in with your new password.',
    data: null,
    errors: null,
  });
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Invalidate user refresh token and wipe session cookie
 * @access  Private/Public
 */
export const logoutUser = asyncHandler(async (req, res, next) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (rawRefreshToken) {
    await RefreshToken.findOneAndDelete({ token: rawRefreshToken });
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.nodeEnv === 'production',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null,
    errors: null,
  });
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get details of current authenticated user session
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'User session active',
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified,
      isPhoneVerified: req.user.isPhoneVerified,
    },
    errors: null,
  });
});
