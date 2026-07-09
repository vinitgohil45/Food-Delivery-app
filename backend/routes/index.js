import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import restaurantRoutes from './restaurantRoutes.js';
import menuRoutes from './menuRoutes.js';
import cartRoutes from './cartRoutes.js';
import checkoutRoutes from './checkoutRoutes.js';
import addressRoutes from './addressRoutes.js';
import orderRoutes from './orderRoutes.js';
import walletRoutes from './walletRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import searchRoutes from './searchRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';

const router = Router();

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu', menuRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/wallet', walletRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/search', searchRoutes);
router.use('/delivery', deliveryRoutes);


/**
 * @route   GET /api/v1/health
 * @desc    Get system health status including database status
 * @access  Public
 */
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'disconnected';
  
  switch(dbState) {
    case 0: dbStatus = 'disconnected'; break;
    case 1: dbStatus = 'connected'; break;
    case 2: dbStatus = 'connecting'; break;
    case 3: dbStatus = 'disconnecting'; break;
  }

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'System is fully operational' : 'Database connection issues',
    data: {
      uptime: process.uptime(),
      timestamp: new Date(),
      services: {
        database: dbStatus,
        server: 'up'
      }
    },
    errors: isHealthy ? null : ['Database connection not established']
  });
});

/**
 * @route   GET /api/v1/version
 * @desc    Get API version info
 * @access  Public
 */
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API version information retrieved',
    data: {
      version: '1.0.0',
      apiPrefix: '/api/v1',
      environment: process.env.NODE_ENV || 'development'
    },
    errors: null
  });
});

export default router;
