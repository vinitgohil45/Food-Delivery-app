import logger from '../../utils/logger.js';
import { mongoSearchProvider } from './mongoSearchProvider.js';

export const algoliaProvider = {
  name: 'algolia',

  async search({ query, filters = {}, sort = 'relevance', userCoords = null, userId = null }) {
    logger.info(`🔍 [SEARCH ENGINE: Algolia InstantSearch] Posting payload: "${query}"`);
    return await mongoSearchProvider.search({ query, filters, sort, userCoords, userId });
  },
};
