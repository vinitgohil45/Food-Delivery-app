import { searchEngine } from '../services/search/searchEngine.js';
import { autocompleteEngine } from '../services/search/autocompleteEngine.js';
import { voiceSearchEngine } from '../services/search/voiceSearchEngine.js';
import { searchAnalytics } from '../services/search/searchAnalytics.js';
import { searchSuggestions } from '../services/search/searchSuggestions.js';
import SearchHistory from '../models/SearchHistory.js';
import PopularSearch from '../models/PopularSearch.js';
import TrendingSearch from '../models/TrendingSearch.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';

/**
 * @route   GET /api/v1/search
 * @desc    Search catalogs for restaurants and dishes (supports filters and ranking)
 * @access  Public/Optional Auth
 */
export const searchCatalog = asyncHandler(async (req, res, next) => {
  const startTime = Date.now();
  const { query, sort, veg, rating, priceMin, priceMax, minOrderValue, cuisine } = req.query;
  const userId = req.user?._id || null;

  // Build filters object
  const filters = { veg, rating, priceMin, priceMax, minOrderValue, cuisine };

  // Trigger search engine query execution
  const results = await searchEngine.search({
    query,
    filters,
    sort,
    userId,
    bypassCache: req.query.bypassCache === 'true',
  });

  const searchTimeMs = Date.now() - startTime;
  const resultsCount = (results.restaurants?.length || 0) + (results.menuItems?.length || 0);

  // 1. Log search telemetry
  if (query) {
    await searchAnalytics.logSearch({
      query,
      userId,
      searchTimeMs,
      resultsCount,
    });
    
    // Save to suggestions dictionary
    await searchSuggestions.logKeyword(query);
  }

  // 2. Compute "Did you mean?" suggestions if results are low
  let didYouMean = '';
  if (query && resultsCount === 0) {
    didYouMean = await searchSuggestions.getDidYouMean(query);
  }

  res.status(200).json({
    success: true,
    message: 'Search completed successfully',
    data: {
      restaurants: results.restaurants,
      menuItems: results.menuItems,
      didYouMean,
      searchTimeMs,
      resultsCount,
    },
    errors: null,
  });
});

/**
 * @route   GET /api/v1/search/autocomplete
 * @desc    Get autocomplete suggestions on keystrokes
 * @access  Public
 */
export const getAutocompleteSuggestions = asyncHandler(async (req, res, next) => {
  const { query, limit } = req.query;
  const results = await autocompleteEngine.getSuggestions(query, parseInt(limit, 10) || 8);
  res.status(200).json({ success: true, data: results });
});

/**
 * @route   GET /api/v1/search/trending
 * @desc    Get trending keywords query spike list
 * @access  Public
 */
export const getTrending = asyncHandler(async (req, res, next) => {
  const trending = await TrendingSearch.find().sort({ volume: -1 }).limit(8);
  res.status(200).json({ success: true, data: trending.map(t => t.query) });
});

/**
 * @route   GET /api/v1/search/popular
 * @desc    Get popular searches query aggregates
 * @access  Public
 */
export const getPopular = asyncHandler(async (req, res, next) => {
  const popular = await PopularSearch.find().sort({ count: -1 }).limit(8);
  res.status(200).json({ success: true, data: popular.map(p => p.query) });
});

/**
 * @route   GET /api/v1/search/history
 * @desc    Get current user's search history queries
 * @access  Private
 */
export const getSearchHistory = asyncHandler(async (req, res, next) => {
  const history = await SearchHistory.find({ user: req.user._id }).sort({ updatedAt: -1 }).limit(8);
  res.status(200).json({ success: true, data: history.map(h => h.query) });
});

/**
 * @route   POST /api/v1/search/history
 * @desc    Save search query to history
 * @access  Private
 */
export const postSearchHistory = asyncHandler(async (req, res, next) => {
  const { query } = req.body;
  if (!query) {
    return next(new AppError('Please provide search query', 400));
  }

  await SearchHistory.findOneAndUpdate(
    { user: req.user._id, query: query.toLowerCase().trim() },
    { $inc: { count: 1 } },
    { upsert: true }
  );

  res.status(200).json({ success: true, message: 'Query saved to history' });
});

/**
 * @route   DELETE /api/v1/search/history
 * @desc    Clear specific keyword or all history for a user
 * @access  Private
 */
export const deleteSearchHistory = asyncHandler(async (req, res, next) => {
  const { query } = req.body;

  if (query) {
    await SearchHistory.deleteOne({ user: req.user._id, query: query.toLowerCase().trim() });
  } else {
    await SearchHistory.deleteMany({ user: req.user._id });
  }

  res.status(200).json({ success: true, message: 'Search history cleared successfully' });
});

/**
 * @route   POST /api/v1/search/click
 * @desc    Log search CTR targets click action
 * @access  Public/Optional Auth
 */
export const postSearchClick = asyncHandler(async (req, res, next) => {
  const { query, itemId, itemType } = req.body;
  const userId = req.user?._id || null;

  if (!query || !itemId || !itemType) {
    return next(new AppError('Please provide query, itemId, and itemType', 400));
  }

  await searchAnalytics.logClick({ query, userId, itemId, itemType });

  res.status(200).json({ success: true, message: 'Click telemetry recorded' });
});

/**
 * @route   POST /api/v1/search/voice
 * @desc    Parse verbal voice audio transcript query
 * @access  Public
 */
export const postVoiceTranscript = asyncHandler(async (req, res, next) => {
  const { transcript } = req.body;
  if (!transcript) {
    return next(new AppError('Please provide voice transcript text', 400));
  }

  const parsedQuery = await voiceSearchEngine.parseTranscript(transcript);

  res.status(200).json({ success: true, data: parsedQuery });
});
