import { Router } from 'express';
import {
  getAvailableOrders,
  getMyOrders,
  acceptOrder,
  rejectOrder,
  updateLocation,
  pickupOrder,
  deliverOrder,
} from '../controllers/deliveryController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Apply auth protectors and driver checks to all endpoints
router.use(protect, restrictTo('delivery_partner'));

router.get('/available-orders', getAvailableOrders);
router.get('/my-orders', getMyOrders);
router.post('/accept/:orderId', acceptOrder);
router.post('/reject/:orderId', rejectOrder);
router.patch('/location', updateLocation);
router.patch('/pickup', pickupOrder);
router.patch('/delivered', deliverOrder);

export default router;
