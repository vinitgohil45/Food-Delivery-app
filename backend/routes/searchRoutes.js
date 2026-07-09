import { Router } from 'express';
import {
  searchCatalog,
  getAutocompleteSuggestions,
  getTrending,
  getPopular,
  getSearchHistory,
  postSearchHistory,
  deleteSearchHistory,
  postSearchClick,
  postVoiceTranscript,
} from '../controllers/searchController.js';
import { protect, optionalProtect } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import {
  postHistorySchema,
  deleteHistorySchema,
  clickTelemetrySchema,
  voiceTranscriptSchema,
} from '../utils/searchValidation.js';

const router = Router();

router.get('/', optionalProtect, searchCatalog);
router.get('/autocomplete', getAutocompleteSuggestions);
router.get('/trending', getTrending);
router.get('/popular', getPopular);
router.get('/history', protect, getSearchHistory);
router.post('/history', protect, validate(postHistorySchema), postSearchHistory);
router.delete('/history', protect, validate(deleteHistorySchema), deleteSearchHistory);
router.post('/click', optionalProtect, validate(clickTelemetrySchema), postSearchClick);
router.post('/voice', validate(voiceTranscriptSchema), postVoiceTranscript);

export default router;
