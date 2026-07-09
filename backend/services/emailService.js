import logger from '../utils/logger.js';

/**
 * Mock email dispatcher service for development
 * Easily swappable with Nodemailer, SendGrid, or AWS SES
 */
export const sendVerificationEmail = async (email, name, otp) => {
  logger.info(`
    ==================================================
    📧 MOCK EMAIL DISPATCHER: VERIFICATION
    ==================================================
    To: ${name} <${email}>
    Subject: Verify Your CraveGo Account
    
    Hi ${name},
    
    Thank you for registering with CraveGo!
    Your one-time verification code is: ${otp}
    
    This code is valid for 10 minutes.
    ==================================================
  `);
  return true;
};

export const sendPasswordResetEmail = async (email, name, otp) => {
  logger.info(`
    ==================================================
    📧 MOCK EMAIL DISPATCHER: PASSWORD RESET
    ==================================================
    To: ${name} <${email}>
    Subject: Reset Your CraveGo Password
    
    Hi ${name},
    
    You requested to reset your password.
    Your one-time password reset code is: ${otp}
    
    This code is valid for 10 minutes. If you did
    not request this, please ignore this email.
    ==================================================
  `);
  return true;
};

export const sendWelcomeEmail = async (email, name) => {
  logger.info(`
    ==================================================
    📧 MOCK EMAIL DISPATCHER: WELCOME EMAIL
    ==================================================
    To: ${name} <${email}>
    Subject: Welcome to CraveGo! 🍔
    
    Hi ${name},
    
    Welcome to CraveGo! We are excited to have you join our food community.
    Explore top local restaurants, build orders, and track deliveries.
    ==================================================
  `);
  return true;
};

export const sendOrderConfirmationEmail = async (email, name, orderNumber, total) => {
  logger.info(`
    ==================================================
    📧 MOCK EMAIL DISPATCHER: ORDER CONFIRMATION
    ==================================================
    To: ${name} <${email}>
    Subject: Order Confirmed: ${orderNumber}
    
    Hi ${name},
    
    Your order ${orderNumber} has been successfully placed!
    Grand Total: ₹${total}
    
    Our restaurant partner is preparing your treats now!
    ==================================================
  `);
  return true;
};

export const sendPaymentConfirmationEmail = async (email, name, orderNumber, amount, method) => {
  logger.info(`
    ==================================================
    📧 MOCK EMAIL DISPATCHER: PAYMENT CONFIRMATION
    ==================================================
    To: ${name} <${email}>
    Subject: Payment Received: ORD-${orderNumber}
    
    Hi ${name},
    
    We received a payment of ₹${amount} via ${method} for your order.
    Thank you for choosing CraveGo!
    ==================================================
  `);
  return true;
};

export const sendRestaurantVerificationEmail = async (email, name, status) => {
  logger.info(`
    ==================================================
    📧 MOCK EMAIL DISPATCHER: MERCHANT VERIFICATION
    ==================================================
    To: ${name} <${email}>
    Subject: Restaurant Verification Update: ${status.toUpperCase()}
    
    Hi ${name},
    
    Your restaurant profile verification status has been updated to: ${status.toUpperCase()}.
    Please log in to your dashboard to manage your catalog items.
    ==================================================
  `);
  return true;
};
