import logger from '../../utils/logger.js';
import { mongoSearchProvider } from './mongoSearchProvider.js';

export const meiliSearchProvider = {
  name: 'meilisearch',

  async search({ query, filters = {}, sort = 'relevance', userCoords = null, userId = null }) {
    logger.info(`🔍 [SEARCH ENGINE: Meilisearch Index] Querying keyword: "${query}"`);
    return await mongoSearchProvider.search({ query, filters, sort, userCoords, userId });
  },
};
