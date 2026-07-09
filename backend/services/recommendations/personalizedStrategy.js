import Order from '../../models/Order.js';
import OrderItem from '../../models/OrderItem.js';
import Wishlist from '../../models/Wishlist.js';
import UserPreference from '../../models/UserPreference.js';
import Restaurant from '../../models/Restaurant.js';
import MenuItem from '../../models/MenuItem.js';

export const personalizedStrategy = {
  name: 'personalized',
  
  async recommend(userId, limit = 8) {
    if (!userId) {
      // Return highly rated default items if guest
      const items = await MenuItem.find({ isAvailable: true }).sort({ rating: -1 }).limit(limit);
      return items.map(item => ({
        itemType: 'MenuItem',
        itemId: item._id,
        score: 0.7,
        confidence: 0.5,
        reason: 'Popular item liked by other diners',
        data: item,
      }));
    }

    // 1. Fetch user order history & preferences
    const [orders, wishlist, pref] = await Promise.all([
      Order.find({ customer: userId }),
      Wishlist.findOne({ user: userId }),
      UserPreference.findOne({ user: userId }),
    ]);

    let favoriteCuisines = pref?.favoriteCuisines || [];
    let favoriteRestaurants = pref?.favoriteRestaurants || [];

    // Extract from order history if user preferences not fully filled
    if (orders.length > 0) {
      const restaurantCounts = {};
      
      for (const ord of orders) {
        restaurantCounts[ord.restaurant] = (restaurantCounts[ord.restaurant] || 0) + 1;
      }
      
      const sortedRestIds = Object.keys(restaurantCounts).sort((a, b) => restaurantCounts[b] - restaurantCounts[a]);
      favoriteRestaurants = [...new Set([...favoriteRestaurants, ...sortedRestIds])];

      // Extract cuisine count from items
      const orderedItems = await OrderItem.find({ order: { $in: orders.map(o => o._id) } }).populate('menuItem');
      const cuisineCounts = {};
      for (const item of orderedItems) {
        if (item.menuItem?.cuisine) {
          cuisineCounts[item.menuItem.cuisine] = (cuisineCounts[item.menuItem.cuisine] || 0) + 1;
        }
      }
      const sortedCuisines = Object.keys(cuisineCounts).sort((a, b) => cuisineCounts[b] - cuisineCounts[a]);
      favoriteCuisines = [...new Set([...favoriteCuisines, ...sortedCuisines])];
    }

    // 2. Recommend restaurants matching user's favorite cuisines
    const matchingRestaurants = await Restaurant.find({
      cuisineType: { $in: favoriteCuisines },
      _id: { $nin: favoriteRestaurants },
    })
      .sort({ rating: -1 })
      .limit(limit);

    // 3. Recommend menu items matching cuisines
    const matchingMenuItems = await MenuItem.find({
      cuisine: { $in: favoriteCuisines },
      isAvailable: true,
    })
      .sort({ rating: -1 })
      .limit(limit);

    // Format output
    const results = [];
    
    // Add restaurant suggestions
    for (const rest of matchingRestaurants) {
      results.push({
        itemType: 'Restaurant',
        itemId: rest._id,
        score: 0.9,
        confidence: 0.85,
        reason: `Based on your love for ${rest.cuisineType[0] || 'delicious eats'}`,
        data: rest,
      });
    }

    // Add dishes suggestions
    for (const item of matchingMenuItems) {
      results.push({
        itemType: 'MenuItem',
        itemId: item._id,
        score: 0.85,
        confidence: 0.8,
        reason: `Because you enjoy ${item.cuisine || 'similar flavors'}`,
        data: item,
      });
    }

    // Return sorted results limited
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  },
};
