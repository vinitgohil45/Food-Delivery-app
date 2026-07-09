import logger from '../../utils/logger.js';
import { mongoSearchProvider } from './mongoSearchProvider.js';

export const elasticSearchProvider = {
  name: 'elasticsearch',

  async search({ query, filters = {}, sort = 'relevance', userCoords = null, userId = null }) {
    logger.info(`🔍 [SEARCH ENGINE: Elasticsearch DSL] Executing search query for keyword: "${query}"`);
    
    // Simulate Elasticsearch index lookup mapping back to Mongo documents
    return await mongoSearchProvider.search({ query, filters, sort, userCoords, userId });
  },
};
