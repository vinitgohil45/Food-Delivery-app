import SearchAnalytics from '../../models/SearchAnalytics.js';
import SearchClick from '../../models/SearchClick.js';
import PopularSearch from '../../models/PopularSearch.js';
import TrendingSearch from '../../models/TrendingSearch.js';

export const searchAnalytics = {
  async logSearch({ query, userId = null, searchTimeMs, resultsCount }) {
    if (!query) return;
    const q = query.toLowerCase().trim();

    // 1. Create search analytics record
    await SearchAnalytics.create({
      query: q,
      user: userId,
      searchTimeMs,
      resultsCount,
    });

    // 2. Increment PopularSearch counter
    await PopularSearch.findOneAndUpdate(
      { query: q },
      { $inc: { count: 1 } },
      { upsert: true }
    );

    // 3. Update TrendingSearch counter
    await TrendingSearch.findOneAndUpdate(
      { query: q },
      { $inc: { volume: 1 } },
      { upsert: true }
    );
  },

  async logClick({ query, userId = null, itemId, itemType }) {
    if (!query) return;
    const q = query.toLowerCase().trim();

    // 1. Create SearchClick record
    await SearchClick.create({
      query: q,
      user: userId,
      itemId,
      itemType,
    });

    // 2. Update matching SearchAnalytics to mark click = true
    await SearchAnalytics.findOneAndUpdate(
      { query: q, user: userId || null, hasClicked: false },
      { $set: { hasClicked: true } },
      { sort: { createdAt: -1 } }
    );
  },

  async getAnalytics() {
    const totalSearches = await SearchAnalytics.countDocuments();
    const clickedSearches = await SearchAnalytics.countDocuments({ hasClicked: true });
    const noResultsCount = await SearchAnalytics.countDocuments({ resultsCount: 0 });

    const ctr = totalSearches > 0 ? (clickedSearches / totalSearches) * 100 : 0;

    // Get average search time
    const searchTimeAgg = await SearchAnalytics.aggregate([
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$searchTimeMs' },
        },
      },
    ]);
    const avgSearchTimeMs = searchTimeAgg[0] ? Math.round(searchTimeAgg[0].avgTime) : 0;

    // Get popular queries
    const popular = await PopularSearch.find().sort({ count: -1 }).limit(10);
    const noResults = await SearchAnalytics.find({ resultsCount: 0 })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      totalSearches,
      ctr: parseFloat(ctr.toFixed(2)),
      noResultsCount,
      avgSearchTimeMs,
      popularKeywords: popular.map(p => ({ keyword: p.query, count: p.count })),
      noResultQueries: noResults.map(n => n.query),
    };
  },
};
