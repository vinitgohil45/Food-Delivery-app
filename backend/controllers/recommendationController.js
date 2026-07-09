import { recommendationEngine } from '../services/recommendations/recommendationEngine.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import RecentlyViewed from '../models/RecentlyViewed.js';
import OrderItem from '../models/OrderItem.js';
import RecommendationAnalytics from '../models/RecommendationAnalytics.js';
import UserPreference from '../models/UserPreference.js';
import { AppError } from '../middlewares/errorHandler.js';
import asyncHandler from '../middlewares/asyncHandler.js';

/**
 * Helper to hydrate recommendation records with actual model documents
 */
const hydrateRecommendations = async (recs) => {
  const restIds = recs.filter(r => r.itemType === 'Restaurant').map(r => r.itemId);
  const menuIds = recs.filter(r => r.itemType === 'MenuItem').map(r => r.itemId);

  const [restaurants, menuItems] = await Promise.all([
    Restaurant.find({ _id: { $in: restIds } }),
    MenuItem.find({ _id: { $in: menuIds } }),
  ]);

  return recs.map(rec => {
    let populatedData = null;
    if (rec.itemType === 'Restaurant') {
      populatedData = restaurants.find(r => r._id.toString() === rec.itemId.toString());
    } else {
      populatedData = menuItems.find(m => m._id.toString() === rec.itemId.toString());
    }
    return {
      itemType: rec.itemType,
      itemId: rec.itemId,
      score: rec.score,
      reason: rec.reason,
      confidence: rec.confidence,
      data: populatedData,
    };
  }).filter(r => r.data !== null && r.data !== undefined);
};

/**
 * @route   GET /api/v1/recommendations/home
 * @desc    Aggregate all homepage recommendation blocks in one fetch
 * @access  Public/Optional Auth
 */
export const getHomeRecommendations = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id || null;

  const [personalizedRaw, trendingRaw, seasonalRaw] = await Promise.all([
    recommendationEngine.getRecommendations({ userId, recommendationType: 'personalized', limit: 4 }),
    recommendationEngine.getRecommendations({ userId, recommendationType: 'trending', limit: 4 }),
    recommendationEngine.getRecommendations({ userId, recommendationType: 'seasonal', limit: 4 }),
  ]);

  const [personalized, trending, seasonal] = await Promise.all([
    hydrateRecommendations(personalizedRaw),
    hydrateRecommendations(trendingRaw),
    hydrateRecommendations(seasonalRaw),
  ]);

  // Fetch recently viewed if logged in
  let recentlyViewed = [];
  if (userId) {
    const rv = await RecentlyViewed.findOne({ user: userId })
      .populate({ path: 'restaurants', options: { limit: 4 } })
      .populate({ path: 'menuItems', options: { limit: 4 } });
    
    if (rv) {
      recentlyViewed = [
        ...(rv.restaurants || []).map(r => ({ itemType: 'Restaurant', data: r })),
        ...(rv.menuItems || []).map(m => ({ itemType: 'MenuItem', data: m })),
      ].slice(0, 4);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Home recommendations retrieved successfully',
    data: {
      personalized,
      trending,
      seasonal,
      recentlyViewed,
    },
    errors: null,
  });
});

/**
 * @route   GET /api/v1/recommendations/personalized
 * @desc    Get custom user profile recommendations
 * @access  Private
 */
export const getPersonalized = asyncHandler(async (req, res, next) => {
  const raw = await recommendationEngine.getRecommendations({
    userId: req.user._id,
    recommendationType: 'personalized',
    limit: 12,
  });
  const hydrated = await hydrateRecommendations(raw);
  res.status(200).json({ success: true, data: hydrated });
});

/**
 * @route   GET /api/v1/recommendations/trending
 * @desc    Get global trending dishes
 * @access  Public
 */
export const getTrending = asyncHandler(async (req, res, next) => {
  const raw = await recommendationEngine.getRecommendations({
    userId: req.user?._id,
    recommendationType: 'trending',
    limit: 12,
  });
  const hydrated = await hydrateRecommendations(raw);
  res.status(200).json({ success: true, data: hydrated });
});

/**
 * @route   GET /api/v1/recommendations/frequently-bought
 * @desc    Get market basket association items commonly purchased with a menuItem
 * @access  Public
 */
export const getFrequentlyBoughtTogether = asyncHandler(async (req, res, next) => {
  const { menuItemId } = req.query;
  if (!menuItemId) {
    return next(new AppError('Please provide a menuItemId', 400));
  }

  // 1. Find orders containing target item
  const matchingItems = await OrderItem.find({ menuItem: menuItemId });
  const orderIds = matchingItems.map(m => m.order);

  // 2. Aggregate co-occurrences of other items in those orders
  const coOccurrences = await OrderItem.aggregate([
    {
      $match: {
        order: { $in: orderIds },
        menuItem: { $ne: menuItemId },
      },
    },
    {
      $group: {
        _id: '$menuItem',
        count: { $sum: '$quantity' },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 6,
    },
  ]);

  const itemIds = coOccurrences.map(c => c._id);
  const items = await MenuItem.find({ _id: { $in: itemIds }, isAvailable: true });

  const totalMatchingOrders = orderIds.length;

  const results = items.map(item => {
    const agg = coOccurrences.find(c => c._id.toString() === item._id.toString());
    const count = agg ? agg.count : 0;
    
    // Support, Confidence, Lift calculation
    const support = count / Math.max(1, totalMatchingOrders);
    const confidence = support * 1.2; // simulated scaling

    return {
      itemType: 'MenuItem',
      itemId: item._id,
      score: Math.min(1.0, 0.5 + confidence),
      confidence,
      reason: 'Frequently bought together with this dish',
      data: item,
    };
  });

  res.status(200).json({
    success: true,
    data: results,
  });
});

/**
 * @route   GET /api/v1/recommendations/recently-viewed
 * @desc    Get user browse history
 * @access  Private
 */
export const getRecentlyViewed = asyncHandler(async (req, res, next) => {
  const rv = await RecentlyViewed.findOne({ user: req.user._id })
    .populate('restaurants')
    .populate('menuItems');

  res.status(200).json({
    success: true,
    data: rv || { restaurants: [], menuItems: [], categories: [], searches: [] },
  });
});

/**
 * @route   POST /api/v1/recommendations/recently-viewed
 * @desc    Record browse history click
 * @access  Private
 */
export const postRecentlyViewed = asyncHandler(async (req, res, next) => {
  const { restaurantId, menuItemId, category, search } = req.body;

  let rv = await RecentlyViewed.findOne({ user: req.user._id });
  if (!rv) {
    rv = await RecentlyViewed.create({ user: req.user._id });
  }

  if (restaurantId) {
    rv.restaurants = [restaurantId, ...rv.restaurants.filter(id => id.toString() !== restaurantId)].slice(0, 10);
  }
  if (menuItemId) {
    rv.menuItems = [menuItemId, ...rv.menuItems.filter(id => id.toString() !== menuItemId)].slice(0, 10);
  }
  if (category) {
    rv.categories = [category, ...rv.categories.filter(c => c !== category)].slice(0, 10);
  }
  if (search) {
    rv.searches = [search, ...rv.searches.filter(s => s !== search)].slice(0, 10);
  }

  await rv.save();

  res.status(200).json({
    success: true,
    message: 'Browse history logged successfully',
  });
});

/**
 * @route   GET /api/v1/recommendations/seasonal
 * @desc    Get recommendations based on current hour/season
 * @access  Public
 */
export const getSeasonal = asyncHandler(async (req, res, next) => {
  const raw = await recommendationEngine.getRecommendations({
    userId: req.user?._id,
    recommendationType: 'seasonal',
    limit: 12,
  });
  const hydrated = await hydrateRecommendations(raw);
  res.status(200).json({ success: true, data: hydrated });
});

/**
 * @route   POST /api/v1/recommendations/click
 * @desc    Track recommendation click CTR metrics
 * @access  Public/Optional Auth
 */
export const trackClick = asyncHandler(async (req, res, next) => {
  const { itemId, itemType, recommendationType } = req.body;

  if (!itemId || !itemType || !recommendationType) {
    return next(new AppError('Please provide itemId, itemType, and recommendationType', 400));
  }

  await RecommendationAnalytics.create({
    user: req.user?._id || null,
    itemId,
    itemType,
    recommendationType,
    event: 'click',
  });

  res.status(200).json({
    success: true,
    message: 'Click analytics registered successfully',
  });
});
