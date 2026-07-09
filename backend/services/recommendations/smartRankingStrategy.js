import Review from '../../models/Review.js';
import Order from '../../models/Order.js';

// Distance calculator helper
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5; // Default 5km if coords missing
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export const smartRankingStrategy = {
  name: 'smartRanking',

  async rankRestaurants(restaurants, userCoords = null, userId = null) {
    const lat1 = userCoords?.latitude;
    const lon1 = userCoords?.longitude;

    // Prefetch some analytics if user is logged in
    let userOrders = [];
    if (userId) {
      userOrders = await Order.find({ customer: userId });
    }

    const rankedList = [];

    for (const rest of restaurants) {
      // 1. Gather metrics
      const ratingVal = rest.rating || 3.0;
      const reviewCount = rest.reviewsCount || 0;
      
      // Calculate distance
      const [lon2, lat2] = rest.location?.coordinates || [77.5946, 12.9716];
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      
      // Approximate delivery time (15 mins + 5 mins per km)
      const deliveryTime = rest.averagePreparationTimeMin || 25 + Math.round(distance * 5);
      
      // Check repeat customer factor
      const repeatCustomerCount = userOrders.filter(o => o.restaurant.toString() === rest._id.toString()).length;

      // Offers count
      const offersCount = rest.offers?.length || 0;

      // Cancellation rate (mocked baseline, low = better)
      const cancellationRate = rest.cancellationRate || 0.02;

      // Featured boost score
      const featuredScore = rest.isFeatured ? 2.5 : 0.0;

      // 2. Score Formula
      // Higher rating = boost (+40% weight)
      // High reviewsCount = boost (+10% weight)
      // Shorter distance = boost (+20% weight)
      // Faster preparation/delivery = boost (+10% weight)
      // Frequent customer = boost (+10% weight)
      // Cancellation rate = penalty (-10% weight)
      // Featured status = absolute flat boost

      const ratingScore = (ratingVal / 5) * 4.0;
      const popularityScore = Math.min(1.0, reviewCount / 50) * 1.0;
      const distanceScore = Math.max(0, 1 - (distance / 15)) * 2.0; // 0 score if >15km
      const speedScore = Math.max(0, 1 - (deliveryTime / 90)) * 1.0; // 0 score if >90 mins
      const loyaltyScore = Math.min(2.0, repeatCustomerCount * 0.5) * 1.0;
      const penaltyScore = cancellationRate * -2.0;
      const promotionsScore = Math.min(1.0, offersCount * 0.2) * 0.5;

      const rawScore = ratingScore + popularityScore + distanceScore + speedScore + loyaltyScore + penaltyScore + promotionsScore + featuredScore;
      const normalizedScore = Math.max(0.1, Math.min(1.0, rawScore / 10));

      // Build recommendation reason
      let reason = 'High rated restaurant near you';
      if (rest.isFeatured) {
        reason = 'Featured premium partner';
      } else if (repeatCustomerCount > 0) {
        reason = `Your favorite: Ordered ${repeatCustomerCount} times!`;
      } else if (distance < 2.0) {
        reason = 'Super close to your location!';
      } else if (offersCount > 0) {
        reason = 'Huge active discount coupons!';
      }

      rankedList.push({
        itemType: 'Restaurant',
        itemId: rest._id,
        score: normalizedScore,
        confidence: 0.95,
        reason,
        data: rest,
      });
    }

    return rankedList.sort((a, b) => b.score - a.score);
  },
};
