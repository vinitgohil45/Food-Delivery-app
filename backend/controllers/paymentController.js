import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { config } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// Setup gateways with credentials fallback checks
let stripe = null;
let razorpay = null;

if (config.stripeSecretKey && config.stripeSecretKey !== 'your_stripe_secret') {
  stripe = new Stripe(config.stripeSecretKey);
}

if (
  config.razorpayKeyId &&
  config.razorpayKeyId !== 'your_razorpay_key_id' &&
  config.razorpayKeySecret &&
  config.razorpayKeySecret !== 'your_razorpay_secret'
) {
  razorpay = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
}

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Initialize a payment transaction (Stripe clientSecret or Razorpay Order ID)
 * @access  Private
 */
export const createPaymentOrder = asyncHandler(async (req, res, next) => {
  const { orderId, gateway } = req.body;

  const order = await Order.findById(orderId);
  if (!order || order.isDeleted) {
    return next(new AppError('Order not found', 404));
  }

  const amountInPaise = Math.round(order.billing.grandTotal * 100);

  // 1. Stripe payment intent creation
  if (gateway === 'stripe') {
    let clientSecret = `pi_mock_secret_${Date.now()}`;
    let transactionId = `pi_mock_${Date.now()}`;

    if (stripe) {
      try {
        const intent = await stripe.paymentIntents.create({
          amount: amountInPaise,
          currency: 'inr',
          metadata: { orderId: order._id.toString() },
        });
        clientSecret = intent.client_secret;
        transactionId = intent.id;
      } catch (err) {
        logger.error('Stripe session creation failed:', err);
        return next(new AppError('Stripe gateway failure', 502));
      }
    } else {
      logger.warn('Stripe credentials missing. Returning mock clientSecret.');
    }

    // Save preliminary payment record
    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      gateway: 'stripe',
      transactionId,
      amount: order.billing.grandTotal,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Stripe intent created successfully',
      data: {
        paymentId: payment._id,
        clientSecret,
        gateway: 'stripe',
      },
      errors: null,
    });
  }

  // 2. Razorpay order creation
  if (gateway === 'razorpay') {
    let razorpayOrderId = `order_mock_${Date.now()}`;

    if (razorpay) {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.orderNumber,
        });
        razorpayOrderId = razorpayOrder.id;
      } catch (err) {
        logger.error('Razorpay session creation failed:', err);
        return next(new AppError('Razorpay gateway failure', 502));
      }
    } else {
      logger.warn('Razorpay credentials missing. Returning mock Order ID.');
    }

    // Save preliminary payment record
    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      gateway: 'razorpay',
      transactionId: razorpayOrderId,
      amount: order.billing.grandTotal,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        paymentId: payment._id,
        razorpayOrderId,
        gateway: 'razorpay',
      },
      errors: null,
    });
  }

  return next(new AppError('Invalid payment gateway option', 400));
});

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify Razorpay signature parameters and set paid status
 * @access  Private
 */
export const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  let isValidSignature = true;

  if (razorpay) {
    const text = razorpayOrderId + '|' + razorpayPaymentId;
    const generatedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(text)
      .digest('hex');

    isValidSignature = generatedSignature === razorpaySignature;
  } else {
    logger.warn('Simulating signature check (no active Razorpay secrets).');
  }

  if (!isValidSignature) {
    return next(new AppError('Payment verification signature check failed', 400));
  }

  // Find payment and update
  const payment = await Payment.findOne({ transactionId: razorpayOrderId });
  if (!payment) return next(new AppError('Payment session not found', 404));

  payment.status = 'completed';
  payment.transactionId = razorpayPaymentId; // update to final payment ID
  await payment.save();

  // Mark Order as paid
  await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'paid' });

  res.status(200).json({
    success: true,
    message: 'Payment verified and order finalized successfully',
    data: payment,
    errors: null,
  });
});

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Stripe/Razorpay Webhook endpoint to capture updates asynchronously
 * @access  Public
 */
export const handleWebhook = asyncHandler(async (req, res, next) => {
  // Support local developer webhook simulation
  const { simulatedType, orderId } = req.body;
  if (simulatedType === 'stripe_success' && orderId) {
    const payment = await Payment.findOne({ order: orderId });
    if (payment) {
      payment.status = 'completed';
      await payment.save();
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' });
      logger.info(`⚡ Webhook Simulation: Order ${orderId} marked paid.`);
    }
    return res.status(200).json({ success: true, message: 'Simulated webhook processed' });
  }

  // Webhook construction logic (Live mode)
  let event;
  if (stripe && req.headers['stripe-signature']) {
    const sig = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
    } catch (err) {
      logger.error('Stripe webhook validation error:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const targetOrderId = intent.metadata.orderId;
      
      const payment = await Payment.findOne({ transactionId: intent.id });
      if (payment) {
        payment.status = 'completed';
        await payment.save();
        await Order.findByIdAndUpdate(targetOrderId, { paymentStatus: 'paid' });
      }
    }
  }

  res.status(200).json({ received: true });
});

/**
 * @route   POST /api/v1/payments/refund
 * @desc    Refund payment amount (gateway or wallet)
 * @access  Private (admin)
 */
export const refundPayment = asyncHandler(async (req, res, next) => {
  const { paymentId, amount } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) return next(new AppError('Payment record not found', 404));

  if (payment.status !== 'completed') {
    return next(new AppError('Only completed payments can be refunded', 400));
  }

  const refundSum = amount || payment.amount;

  if (payment.gateway === 'stripe' && stripe) {
    try {
      await stripe.refunds.create({
        payment_intent: payment.transactionId,
        amount: Math.round(refundSum * 100),
      });
    } catch (err) {
      return next(new AppError('Stripe refund transaction failed', 502));
    }
  } else if (payment.gateway === 'wallet') {
    let wallet = await Wallet.findOne({ user: payment.user });
    if (wallet) {
      wallet.balance += refundSum;
      await wallet.save();

      await WalletTransaction.create({
        wallet: wallet._id,
        amount: refundSum,
        transactionType: 'credit',
        purpose: 'refund',
        description: `Refund for payment ID ${payment._id}`,
      });
    }
  }

  payment.status = 'refunded';
  payment.refundDetails = {
    refundId: `ref_mock_${Date.now()}`,
    refundedAmount: refundSum,
    refundedAt: new Date(),
    reason: 'Admin requested refund',
  };
  await payment.save();

  // Set order payment status
  await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'refunded' });

  res.status(200).json({
    success: true,
    message: 'Payment refunded successfully',
    data: payment,
    errors: null,
  });
});

/**
 * @route   GET /api/v1/payments/:id
 * @desc    Get detailed payment log by ID
 * @access  Private
 */
export const getPaymentById = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id).populate('order', 'orderNumber status');
  if (!payment) return next(new AppError('Payment not found', 404));

  res.status(200).json({
    success: true,
    message: 'Payment details retrieved',
    data: payment,
    errors: null,
  });
});
