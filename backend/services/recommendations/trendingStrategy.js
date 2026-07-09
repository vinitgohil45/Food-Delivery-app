import OrderItem from '../../models/OrderItem.js';
import MenuItem from '../../models/MenuItem.js';
import Wishlist from '../../models/Wishlist.js';

export const trendingStrategy = {
  name: 'trending',

  async recommend(userId, limit = 8) {
    // 1. Fetch order aggregates for last 30 days
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);

    const aggregates = await OrderItem.aggregate([
      {
        $match: {
          createdAt: { $gte: dateLimit },
        },
      },
      {
        $group: {
          _id: '$menuItem',
          orderCount: { $sum: '$quantity' },
        },
      },
      {
        $sort: { orderCount: -1 },
      },
      {
        $limit: limit * 2,
      },
    ]);

    const itemIds = aggregates.map(a => a._id);
    
    // Fallback if low volume of recent orders
    let trendingItems = await MenuItem.find({
      _id: { $in: itemIds },
      isAvailable: true,
    });

    if (trendingItems.length < limit) {
      const extraItems = await MenuItem.find({
        isAvailable: true,
        rating: { $gte: 4.2 },
      })
        .sort({ rating: -1 })
        .limit(limit - trendingItems.length);
      trendingItems = [...trendingItems, ...extraItems];
    }

    // Mix wishlists factors if user is logged in
    let wishlistIds = [];
    if (userId) {
      const wl = await Wishlist.findOne({ user: userId });
      wishlistIds = wl?.menuItems || [];
    }

    return trendingItems.map(item => {
      const agg = aggregates.find(a => a._id.toString() === item._id.toString());
      const orderVolume = agg ? agg.orderCount : 0;
      
      // Calculate trend score
      let score = (item.rating * 0.15) + (orderVolume * 0.05);
      if (wishlistIds.includes(item._id)) {
        score += 0.2; // boost if in user wishlist
      }

      return {
        itemType: 'MenuItem',
        itemId: item._id,
        score: Math.min(1.0, score),
        confidence: 0.9,
        reason: orderVolume > 2 ? `Trending: Ordered ${orderVolume} times recently!` : 'Highly rated favorite near you',
        data: item,
      };
    }).sort((a, b) => b.score - a.score).slice(0, limit);
  },
};
