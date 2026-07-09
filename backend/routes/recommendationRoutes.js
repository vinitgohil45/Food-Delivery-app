import { Router } from 'express';
import {
  getHomeRecommendations,
  getPersonalized,
  getTrending,
  getFrequentlyBoughtTogether,
  getRecentlyViewed,
  postRecentlyViewed,
  getSeasonal,
  trackClick,
} from '../controllers/recommendationController.js';
import { protect, optionalProtect } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import {
  recentlyViewedSchema,
  trackClickSchema,
} from '../utils/recommendationValidation.js';

const router = Router();

router.get('/home', optionalProtect, getHomeRecommendations);
router.get('/personalized', protect, getPersonalized);
router.get('/trending', optionalProtect, getTrending);
router.get('/frequently-bought', optionalProtect, getFrequentlyBoughtTogether);
router.get('/recently-viewed', protect, getRecentlyViewed);
router.post('/recently-viewed', protect, validate(recentlyViewedSchema), postRecentlyViewed);
router.get('/seasonal', optionalProtect, getSeasonal);
router.post('/click', optionalProtect, validate(trackClickSchema), trackClick);

export default router;
