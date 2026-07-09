import { mongoSearchProvider } from './mongoSearchProvider.js';
import { elasticSearchProvider } from './elasticSearchProvider.js';
import { meiliSearchProvider } from './meiliSearchProvider.js';
import { algoliaProvider } from './algoliaProvider.js';
import SearchCache from '../../models/SearchCache.js';
import logger from '../../utils/logger.js';

const PROVIDER = process.env.SEARCH_PROVIDER || 'mongodb';

export const searchEngine = {
  async search({ query, filters = {}, sort = 'relevance', userCoords = null, userId = null, bypassCache = false }) {
    // Generate unique cache key based on query parameters
    const cacheKey = JSON.stringify({ query, filters, sort, userCoords, userId });

    // 1. Read from Search Cache
    if (!bypassCache) {
      try {
        const cached = await SearchCache.findOne({ key: cacheKey })
          .populate('results.restaurants')
          .populate('results.menuItems');

        if (cached && cached.expiresAt > new Date()) {
          logger.info(`💾 Returning cached search results for key [${cacheKey}]`);
          return cached.results;
        }
      } catch (err) {
        logger.error('Failed reading search cache:', err);
      }
    }

    // 2. Select Search Provider
    let results = { restaurants: [], menuItems: [] };
    try {
      let activeProvider = mongoSearchProvider;
      if (PROVIDER === 'elasticsearch') {
        activeProvider = elasticSearchProvider;
      } else if (PROVIDER === 'meilisearch') {
        activeProvider = meiliSearchProvider;
      } else if (PROVIDER === 'algolia') {
        activeProvider = algoliaProvider;
      }

      const raw = await activeProvider.search({ query, filters, sort, userCoords, userId });
      results.restaurants = raw.restaurants.map(r => r.data || r);
      results.menuItems = raw.menuItems.map(m => m.data || m);
    } catch (err) {
      logger.error(`Search failed using provider [${PROVIDER}]:`, err);
      // Fallback
      const raw = await mongoSearchProvider.search({ query, filters, sort, userCoords, userId });
      results.restaurants = raw.restaurants.map(r => r.data || r);
      results.menuItems = raw.menuItems.map(m => m.data || m);
    }

    // 3. Write results back to cache database (Expires in 10 minutes)
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      await SearchCache.findOneAndUpdate(
        { key: cacheKey },
        {
          results: {
            restaurants: results.restaurants.map(r => r._id),
            menuItems: results.menuItems.map(m => m._id),
          },
          expiresAt,
        },
        { upsert: true }
      );
    } catch (err) {
      logger.error('Failed writing search cache:', err);
    }

    return results;
  },
};
