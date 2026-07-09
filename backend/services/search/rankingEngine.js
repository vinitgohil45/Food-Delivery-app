import Order from '../../models/Order.js';

// Distance calculator helper
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5;
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const rankingEngine = {
  async rank(items, itemType, userCoords = null, userId = null) {
    const lat1 = userCoords?.latitude;
    const lon1 = userCoords?.longitude;

    // Fetch user order history if logged in to compute repeat customer boosting
    let userOrders = [];
    if (userId) {
      try {
        userOrders = await Order.find({ customer: userId });
      } catch (err) {
        // ignore
      }
    }

    const scored = [];

    for (const item of items) {
      const rating = item.rating || 4.0;
      let score = 0.5;

      // Base weight: Rating contribution (40%)
      score += (rating / 5) * 0.4;

      if (itemType === 'Restaurant') {
        const [lon2, lat2] = item.location?.coordinates || [77.5946, 12.9716];
        const distance = calculateDistance(lat1, lon1, lat2, lon2);
        
        // Distance contribution (20% weight: closer is better)
        score += Math.max(0, 1 - (distance / 10)) * 0.2;

        // Repeat customer boost (15% weight)
        const ordersCount = userOrders.filter(o => o.restaurant.toString() === item._id.toString()).length;
        score += Math.min(1.0, ordersCount * 0.2) * 0.15;

        // Featured boost
        if (item.isFeatured) score += 0.1;
      } else {
        // MenuItem specifics
        const ordersCount = userOrders.filter(o => o.status === 'delivered').length; // dummy scale
        score += Math.min(1.0, ordersCount * 0.05) * 0.1;
      }

      scored.push({
        itemType,
        itemId: item._id,
        score: Math.min(1.0, score),
        data: item,
      });
    }

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  },
};
