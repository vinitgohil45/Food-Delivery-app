import { Router } from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  updatePreferences,
  updatePushSubscription,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import {
  updatePreferencesSchema,
  markReadSchema,
} from '../utils/notificationValidation.js';

const router = Router();

// Apply auth middleware protection to all endpoints
router.use(protect);

router.get('/', getNotifications);
router.patch('/read', validate(markReadSchema), markRead);
router.patch('/read-all', markAllRead);
router.put('/preferences', validate(updatePreferencesSchema), updatePreferences);
router.post('/push-subscribe', updatePushSubscription);
router.delete('/:id', deleteNotification);

export default router;
