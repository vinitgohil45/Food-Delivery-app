import crypto from 'crypto';

/**
 * Generate a cryptographically secure random numeric OTP code
 * @param {Number} length - Code length (default 6)
 * @returns {String}
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
};
