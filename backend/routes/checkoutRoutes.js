import { Router } from 'express';
import {
  createOrder,
  getCheckoutSummary,
} from '../controllers/checkoutController.js';
import { protect } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import { checkoutSchema } from '../utils/cartValidation.js';

const router = Router();

router.use(protect);

router.post('/', validate(checkoutSchema), createOrder);
router.get('/summary', getCheckoutSummary);

export default router;
