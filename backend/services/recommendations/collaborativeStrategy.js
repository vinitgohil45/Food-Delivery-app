import Order from '../../models/Order.js';
import OrderItem from '../../models/OrderItem.js';
import MenuItem from '../../models/MenuItem.js';

export const collaborativeStrategy = {
  name: 'collaborative',

  async recommend(userId, limit = 8) {
    if (!userId) {
      return []; // Guest user has no collaborative baseline
    }

    // 1. Get current user's purchased items
    const userOrders = await Order.find({ customer: userId });
    if (userOrders.length === 0) return [];

    const userOrderIds = userOrders.map(o => o._id);
    const userItems = await OrderItem.find({ order: { $in: userOrderIds } });
    const userMenuItemIds = [...new Set(userItems.map(i => i.menuItem.toString()))];

    // 2. Find other users who ordered the same items
    const matchingOrderItems = await OrderItem.find({
      menuItem: { $in: userMenuItemIds },
    });

    const matchingOrderIds = matchingOrderItems.map(i => i.order);
    const matchingOrders = await Order.find({
      _id: { $in: matchingOrderIds },
      customer: { $ne: userId },
    });

    const peerUserIds = [...new Set(matchingOrders.map(o => o.customer.toString()))];
    if (peerUserIds.length === 0) return [];

    // 3. Find other items bought by these peer users
    const peerOrders = await Order.find({ customer: { $in: peerUserIds } });
    const peerOrderIds = peerOrders.map(o => o._id);

    const peerOrderItems = await OrderItem.aggregate([
      {
        $match: {
          order: { $in: peerOrderIds },
          menuItem: { $nin: userMenuItemIds }, // exclude what current user already bought
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
        $limit: limit,
      },
    ]);

    if (peerOrderItems.length === 0) return [];

    const recommendedIds = peerOrderItems.map(p => p._id);
    const items = await MenuItem.find({ _id: { $in: recommendedIds }, isAvailable: true });

    return items.map(item => {
      const match = peerOrderItems.find(p => p._id.toString() === item._id.toString());
      const count = match ? match.count : 1;
      
      return {
        itemType: 'MenuItem',
        itemId: item._id,
        score: Math.min(1.0, 0.6 + count * 0.05),
        confidence: 0.75,
        reason: 'Customers with similar tastes also bought this!',
        data: item,
      };
    });
  },
};
