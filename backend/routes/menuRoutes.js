import { Router } from 'express';
import {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  updateItemStatus,
  updateItemInventory,
  duplicateMenuItem,
  uploadMenuItemImages,
} from '../controllers/menuController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  createCategorySchema,
  updateCategorySchema,
  updateItemStatusSchema,
  updateItemInventorySchema,
} from '../utils/menuValidation.js';

const router = Router();

// Public routes
router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);

// Protected routes (Requires authentication)
router.use(protect);
router.use(restrictTo('restaurant_owner', 'admin'));

// Category Operations
router.post('/category', validate(createCategorySchema), createMenuCategory);
router.put('/category/:id', validate(updateCategorySchema), updateMenuCategory);
router.delete('/category/:id', deleteMenuCategory);

// Menu Item Operations
router.post('/', validate(createMenuItemSchema), createMenuItem);
router.put('/:id', validate(updateMenuItemSchema), updateMenuItem);
router.delete('/:id', deleteMenuItem);

// Status & Inventory updates
router.patch('/:id/status', validate(updateItemStatusSchema), updateItemStatus);
router.patch('/:id/inventory', validate(updateItemInventorySchema), updateItemInventory);

// Duplicate & Media upload
router.post('/:id/duplicate', duplicateMenuItem);
router.post('/:id/upload-images', upload.array('images', 1), uploadMenuItemImages);

export default router;
