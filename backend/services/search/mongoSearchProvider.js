import Restaurant from '../../models/Restaurant.js';
import MenuItem from '../../models/MenuItem.js';
import { rankingEngine } from './rankingEngine.js';

export const mongoSearchProvider = {
  name: 'mongodb',

  async search({ query, filters = {}, sort = 'relevance', userCoords = null, userId = null }) {
    // 1. Build Query for Restaurants
    let restQuery = { isActive: true, isDeleted: false };
    let restProjection = {};
    let restSort = {};

    if (query) {
      restQuery.$text = { $search: query };
      restProjection.score = { $meta: 'textScore' };
      restSort.score = { $meta: 'textScore' };
    }

    // Apply filters
    if (filters.rating) {
      restQuery.rating = { $gte: parseFloat(filters.rating) };
    }
    if (filters.minOrderValue) {
      restQuery.minOrderValue = { $lte: parseFloat(filters.minOrderValue) };
    }
    if (filters.cuisine) {
      restQuery.cuisineType = { $in: [filters.cuisine] };
    }

    let restaurants = await Restaurant.find(restQuery, restProjection).sort(restSort).limit(40);

    // If no text score matches, try fuzzy regex matching
    if (query && restaurants.length === 0) {
      const regex = new RegExp(query, 'i');
      restaurants = await Restaurant.find({
        isActive: true,
        isDeleted: false,
        $or: [
          { name: regex },
          { cuisineType: regex },
        ],
      }).limit(40);
    }

    // 2. Build Query for Menu Items
    let itemQuery = { isDeleted: false, isAvailable: true };
    let itemProjection = {};
    let itemSort = {};

    if (query) {
      itemQuery.$text = { $search: query };
      itemProjection.score = { $meta: 'textScore' };
      itemSort.score = { $meta: 'textScore' };
    }

    if (filters.veg === 'true') {
      itemQuery.isVeg = true;
    } else if (filters.veg === 'false') {
      itemQuery.isVeg = false;
    }

    if (filters.priceMin || filters.priceMax) {
      itemQuery.price = {};
      if (filters.priceMin) itemQuery.price.$gte = parseFloat(filters.priceMin);
      if (filters.priceMax) itemQuery.price.$lte = parseFloat(filters.priceMax);
    }

    let menuItems = await MenuItem.find(itemQuery, itemProjection).sort(itemSort).limit(40);

    // Regex fallback for Menu Items
    if (query && menuItems.length === 0) {
      const regex = new RegExp(query, 'i');
      menuItems = await MenuItem.find({
        isDeleted: false,
        isAvailable: true,
        $or: [
          { name: regex },
          { description: regex },
          { category: regex },
        ],
      }).limit(40);
    }

    // 3. Smart Re-Ranking using Ranking Engine
    const rankedRestaurants = await rankingEngine.rank(restaurants, 'Restaurant', userCoords, userId);
    const rankedMenuItems = await rankingEngine.rank(menuItems, 'MenuItem', userCoords, userId);

    // 4. Sort results
    const sortResults = (list, sortBy) => {
      if (sortBy === 'rating') {
        return list.sort((a, b) => (b.data?.rating || 0) - (a.data?.rating || 0));
      }
      if (sortBy === 'price_low') {
        return list.sort((a, b) => (a.data?.price || 0) - (b.data?.price || 0));
      }
      if (sortBy === 'price_high') {
        return list.sort((a, b) => (b.data?.price || 0) - (a.data?.price || 0));
      }
      return list.sort((a, b) => b.score - a.score); // Default: Smart Relevance score
    };

    return {
      restaurants: sortResults(rankedRestaurants, sort).slice(0, 20),
      menuItems: sortResults(rankedMenuItems, sort).slice(0, 20),
    };
  },
};
