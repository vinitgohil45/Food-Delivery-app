import { Router } from 'express';
import {
  createRestaurant,
  getRestaurants,
  getNearbyRestaurants,
  getOwnerRestaurants,
  getRestaurantById,
  updateRestaurant,
  updateRestaurantStatus,
  uploadRestaurantImages,
  getRestaurantAnalytics,
  deleteRestaurant,
} from '../controllers/restaurantController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  updateStatusSchema,
} from '../utils/restaurantValidation.js';

const router = Router();

// Public routes
router.get('/', getRestaurants);
router.get('/nearby', getNearbyRestaurants);
router.get('/:id', getRestaurantById);

// Protected routes (Requires authentication)
router.use(protect);

// Owner/Admin specific operations
router.post(
  '/',
  restrictTo('restaurant_owner', 'admin'),
  validate(createRestaurantSchema),
  createRestaurant
);

router.get(
  '/owner/all',
  restrictTo('restaurant_owner', 'admin'),
  getOwnerRestaurants
);

router.put(
  '/:id',
  restrictTo('restaurant_owner', 'admin'),
  validate(updateRestaurantSchema),
  updateRestaurant
);

router.delete(
  '/:id',
  restrictTo('restaurant_owner', 'admin'),
  deleteRestaurant
);

router.patch(
  '/:id/status',
  restrictTo('restaurant_owner', 'admin'),
  validate(updateStatusSchema),
  updateRestaurantStatus
);

router.post(
  '/:id/upload-images',
  restrictTo('restaurant_owner', 'admin'),
  upload.array('images', 5),
  uploadRestaurantImages
);

router.get(
  '/:id/analytics',
  restrictTo('restaurant_owner', 'admin'),
  getRestaurantAnalytics
);

export default router;
