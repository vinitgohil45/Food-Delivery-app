import Restaurant from '../../models/Restaurant.js';
import MenuItem from '../../models/MenuItem.js';

export const autocompleteEngine = {
  async getSuggestions(query, limit = 8) {
    if (!query) return { suggestions: [] };

    const regex = new RegExp(`^${query}`, 'i');
    const containRegex = new RegExp(query, 'i');

    const [restaurants, menuItems] = await Promise.all([
      Restaurant.find({
        isActive: true,
        isDeleted: false,
        $or: [{ name: regex }, { cuisineType: containRegex }],
      }).limit(limit),
      MenuItem.find({
        isDeleted: false,
        isAvailable: true,
        $or: [{ name: regex }, { category: containRegex }],
      }).limit(limit),
    ]);

    const suggestions = [];

    // Format Restaurant suggestions
    for (const rest of restaurants) {
      suggestions.push({
        text: rest.name,
        type: 'restaurant',
        targetId: rest._id,
      });
    }

    // Format MenuItem suggestions
    for (const item of menuItems) {
      suggestions.push({
        text: item.name,
        type: 'dish',
        targetId: item._id,
        restaurantId: item.restaurant,
      });
    }

    // Add unique cuisine tags if matching
    const cuisines = new Set();
    for (const rest of restaurants) {
      for (const cuisine of rest.cuisineType) {
        if (cuisine.toLowerCase().startsWith(query.toLowerCase())) {
          cuisines.add(cuisine);
        }
      }
    }

    cuisines.forEach(c => {
      suggestions.push({
        text: c,
        type: 'cuisine',
      });
    });

    return suggestions.slice(0, limit);
  },
};
