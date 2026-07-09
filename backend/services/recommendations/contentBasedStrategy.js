import Wishlist from '../../models/Wishlist.js';
import Order from '../../models/Order.js';
import OrderItem from '../../models/OrderItem.js';
import MenuItem from '../../models/MenuItem.js';

export const contentBasedStrategy = {
  name: 'contentBased',

  async recommend(userId, limit = 8) {
    if (!userId) return [];

    // 1. Get user's favorites & orders
    const [wishlist, orders] = await Promise.all([
      Wishlist.findOne({ user: userId }),
      Order.find({ customer: userId }),
    ]);

    let baselineItemIds = wishlist?.menuItems || [];

    if (baselineItemIds.length === 0 && orders.length > 0) {
      const recentOrderIds = orders.slice(-3).map(o => o._id); // last 3 orders
      const items = await OrderItem.find({ order: { $in: recentOrderIds } });
      baselineItemIds = items.map(i => i.menuItem);
    }

    if (baselineItemIds.length === 0) return [];

    // 2. Fetch baseline items details
    const baselineItems = await MenuItem.find({ _id: { $in: baselineItemIds } });
    const cuisines = [...new Set(baselineItems.map(i => i.cuisine).filter(Boolean))];
    const categories = [...new Set(baselineItems.map(i => i.category).filter(Boolean))];

    // 3. Find matching items (excluding baseline items)
    const matchingItems = await MenuItem.find({
      _id: { $nin: baselineItemIds },
      $or: [
        { cuisine: { $in: cuisines } },
        { category: { $in: categories } },
      ],
      isAvailable: true,
    })
      .sort({ rating: -1 })
      .limit(limit);

    return matchingItems.map(item => {
      // Calculate score based on attribute overlap
      let overlapCount = 0;
      if (cuisines.includes(item.cuisine)) overlapCount += 2;
      if (categories.includes(item.category)) overlapCount += 1;

      return {
        itemType: 'MenuItem',
        itemId: item._id,
        score: Math.min(1.0, 0.7 + overlapCount * 0.1),
        confidence: 0.8,
        reason: `Matches your preference for ${item.cuisine || item.category || 'similar treats'}`,
        data: item,
      };
    });
  },
};
