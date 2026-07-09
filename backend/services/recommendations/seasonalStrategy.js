import MenuItem from '../../models/MenuItem.js';

export const seasonalStrategy = {
  name: 'seasonal',

  async recommend(userId, limit = 8) {
    const hr = new Date().getHours();
    const month = new Date().getMonth(); // 0-indexed (0=Jan, 11=Dec)
    const isWeekend = [0, 6].includes(new Date().getDay());

    // 1. Time of Day Queries & Reasons
    let timeFilter = [];
    let timeReason = 'Popular choice right now';

    if (hr >= 5 && hr < 11) {
      timeFilter = ['breakfast', 'beverage', 'tea', 'coffee', 'juice'];
      timeReason = 'Fresh breakfast and hot beverages to kickstart your day 🌅';
    } else if (hr >= 11 && hr < 16) {
      timeFilter = ['lunch', 'meals', 'combos', 'biryani', 'curry'];
      timeReason = 'Hearty lunch combos and classic main courses ☀️';
    } else if (hr >= 16 && hr < 22) {
      timeFilter = ['snacks', 'dinner', 'dinner combos', 'pizza', 'burger'];
      timeReason = 'Perfect dinner recipes and evening comfort bites 🍔';
    } else {
      timeFilter = ['dessert', 'late night', 'shakes', 'waffles', 'snacks'];
      timeReason = 'Midnight sweet cravings and late-night snacks 🌙';
    }

    // 2. Calendar Month Season Filters
    let seasonFilter = [];
    let seasonReason = '';

    if (month >= 2 && month <= 4) {
      seasonFilter = ['cold', 'shakes', 'ice cream', 'juice', 'salad'];
      seasonReason = 'Beat the heat: Summer refreshing cooling treats 🍦';
    } else if (month >= 5 && month <= 8) {
      seasonFilter = ['hot', 'tea', 'soup', 'noodles', 'fritters', 'pakoda'];
      seasonReason = 'Rainy day treats: Monsoon piping hot soups and teas 🌧️';
    } else {
      seasonFilter = ['hot', 'coffee', 'soup', 'halwa', 'warm', 'dessert'];
      seasonReason = 'Winter warmers: Cozily hot cocoa, warm puddings, and soups ❄️';
    }

    // Weekend special booster tag
    if (isWeekend) {
      timeFilter.push('weekend special', 'party combo', 'family pack');
    }

    // 3. Query matching menu items
    const items = await MenuItem.find({
      $or: [
        { tags: { $in: [...timeFilter, ...seasonFilter] } },
        { cuisine: { $in: timeFilter } },
        { category: { $in: [...timeFilter, ...seasonFilter] } },
      ],
      isAvailable: true,
    })
      .sort({ rating: -1 })
      .limit(limit);

    return items.map(item => {
      // Calculate relevance matches
      const hasTimeMatch = item.tags.some(t => timeFilter.includes(t)) || timeFilter.includes(item.category?.toLowerCase());
      const reason = hasTimeMatch ? timeReason : (seasonReason || 'Highly recommended seasonal highlight');
      
      return {
        itemType: 'MenuItem',
        itemId: item._id,
        score: hasTimeMatch ? 0.95 : 0.85,
        confidence: 0.9,
        reason,
        data: item,
      };
    });
  },
};
