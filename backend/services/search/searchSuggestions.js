import SearchSuggestion from '../../models/SearchSuggestion.js';

// Levenshtein distance helper
const getLevenshteinDistance = (a, b) => {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp.push([i]);
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
};

export const searchSuggestions = {
  async getDidYouMean(query) {
    if (!query || query.length < 3) return '';

    const lowercaseQuery = query.toLowerCase().trim();

    // Fetch popular suggestion dictionary keywords
    const suggestions = await SearchSuggestion.find().sort({ popularity: -1 }).limit(100);
    const keywords = suggestions.map(s => s.keyword);

    // Default built-in fallback suggestions dictionary
    const dictionary = [
      'biryani',
      'pizza',
      'burger',
      'chinese',
      'noodles',
      'pasta',
      'desserts',
      'beverage',
      'sandwiches',
      'curry',
      'ice cream',
      'veg special',
      ...keywords,
    ];

    let bestMatch = '';
    let minDistance = 3; // Max threshold distance of 2 typos

    for (const word of dictionary) {
      if (word === lowercaseQuery) return ''; // Perfect match exists

      const distance = getLevenshteinDistance(lowercaseQuery, word);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = word;
      }
    }

    return bestMatch;
  },

  async logKeyword(keyword) {
    if (!keyword) return;
    const kw = keyword.toLowerCase().trim();
    await SearchSuggestion.findOneAndUpdate(
      { keyword: kw },
      { $inc: { popularity: 1 } },
      { upsert: true }
    );
  },
};
