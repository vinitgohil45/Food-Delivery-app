import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  assignDriver,
  rateOrder,
  reorder,
  getOrderInvoice,
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import {
  updateOrderStatusSchema,
  cancelOrderSchema,
  assignDriverSchema,
  rateOrderSchema,
  reorderSchema,
} from '../utils/orderValidation.js';

const router = Router();

router.use(protect);

router.get('/', getOrders);
router.post('/reorder', validate(reorderSchema), reorder);
router.get('/invoice/:id', getOrderInvoice);
router.get('/:id', getOrderById);

router.patch('/:id/status', validate(updateOrderStatusSchema), updateOrderStatus);
router.patch('/:id/cancel', validate(cancelOrderSchema), cancelOrder);
router.patch('/:id/assign-driver', restrictTo('admin', 'restaurant_owner'), validate(assignDriverSchema), assignDriver);
router.patch('/:id/rate', restrictTo('customer'), validate(rateOrderSchema), rateOrder);

export default router;
