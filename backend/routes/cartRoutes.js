import { Router } from 'express';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
} from '../controllers/cartController.js';
import { protect } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import {
  addToCartSchema,
  updateCartItemSchema,
  applyCouponSchema,
} from '../utils/cartValidation.js';

const router = Router();

router.use(protect);

router.post('/add', validate(addToCartSchema), addToCart);
router.get('/', getCart);
router.patch('/item', validate(updateCartItemSchema), updateCartItem);
router.delete('/item', removeCartItem);
router.delete('/', clearCart);
router.post('/apply-coupon', validate(applyCouponSchema), applyCoupon);

export default router;
