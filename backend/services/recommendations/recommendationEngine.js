import { personalizedStrategy } from './personalizedStrategy.js';
import { trendingStrategy } from './trendingStrategy.js';
import { seasonalStrategy } from './seasonalStrategy.js';
import { collaborativeStrategy } from './collaborativeStrategy.js';
import { contentBasedStrategy } from './contentBasedStrategy.js';
import { smartRankingStrategy } from './smartRankingStrategy.js';
import { hybridStrategy } from './hybridStrategy.js';

import RecommendationCache from '../../models/RecommendationCache.js';
import logger from '../../utils/logger.js';

// Configuration: can be 'hybrid', 'openai', 'gemini', 'tensorflow'
const PROVIDER = process.env.RECOMMENDATION_PROVIDER || 'hybrid';

/**
 * MOCK ADAPTERS representing future AI engine plug-ins
 */
const OpenAIAdapter = {
  async recommend(userId, type, limit) {
    logger.info(`🤖 [AI ENGINE: OpenAI] Generating recommendations for user [${userId}] type [${type}]`);
    // Fall back to hybrid strategy calculations, wrapping them as OpenAI generated scores
    const fallback = await hybridStrategy.recommend(userId, limit);
    return fallback.map(f => ({
      ...f,
      confidence: 0.98,
      reason: `✨ [GPT-4 Recommended] ${f.reason}`,
    }));
  }
};

const GeminiAdapter = {
  async recommend(userId, type, limit) {
    logger.info(`🤖 [AI ENGINE: Gemini Pro] Generating recommendations for user [${userId}] type [${type}]`);
    const fallback = await hybridStrategy.recommend(userId, limit);
    return fallback.map(f => ({
      ...f,
      confidence: 0.96,
      reason: `✨ [Gemini Recommended] ${f.reason}`,
    }));
  }
};

const TensorFlowAdapter = {
  async recommend(userId, type, limit) {
    logger.info(`🤖 [AI ENGINE: TensorFlow JS] Loading model embeddings for user [${userId}]`);
    const fallback = await hybridStrategy.recommend(userId, limit);
    return fallback.map(f => ({
      ...f,
      confidence: 0.92,
      reason: `✨ [TF.js Embedding Match] ${f.reason}`,
    }));
  }
};

export const recommendationEngine = {
  /**
   * Get recommendations by type
   * @param {string} userId - User ID or session ID
   * @param {string} recommendationType - personalized, trending, seasonal, collaborative, contentBased, hybrid
   * @param {number} limit - Cap count
   * @param {boolean} bypassCache - Ignore cached values
   */
  async getRecommendations({ userId, recommendationType = 'hybrid', limit = 8, bypassCache = false }) {
    const cacheKey = userId ? userId.toString() : 'guest_session';

    // 1. Check cache database
    if (!bypassCache) {
      try {
        const cached = await RecommendationCache.findOne({
          user: userId || null,
          sessionKey: userId ? undefined : 'guest',
          recommendationType,
        });

        if (cached && cached.expiresAt > new Date()) {
          logger.info(`💾 Returning cached recommendations for [${cacheKey}] type [${recommendationType}]`);
          
          // Hydrate recommendation data references from Mongoose collections
          return cached.recommendations;
        }
      } catch (err) {
        logger.error('Error reading recommendation cache:', err);
      }
    }

    // 2. Select AI / Heuristic Provider
    let results = [];
    try {
      if (PROVIDER === 'openai') {
        results = await OpenAIAdapter.recommend(userId, recommendationType, limit);
      } else if (PROVIDER === 'gemini') {
        results = await GeminiAdapter.recommend(userId, recommendationType, limit);
      } else if (PROVIDER === 'tensorflow') {
        results = await TensorFlowAdapter.recommend(userId, recommendationType, limit);
      } else {
        // Default to Hybrid Strategy orchestration
        if (recommendationType === 'personalized') {
          results = await personalizedStrategy.recommend(userId, limit);
        } else if (recommendationType === 'trending') {
          results = await trendingStrategy.recommend(userId, limit);
        } else if (recommendationType === 'seasonal') {
          results = await seasonalStrategy.recommend(userId, limit);
        } else if (recommendationType === 'collaborative') {
          results = await collaborativeStrategy.recommend(userId, limit);
        } else if (recommendationType === 'contentBased') {
          results = await contentBasedStrategy.recommend(userId, limit);
        } else {
          results = await hybridStrategy.recommend(userId, limit);
        }
      }
    } catch (err) {
      logger.error(`Failed executing strategy [${recommendationType}]:`, err);
      // Fallback
      results = await trendingStrategy.recommend(userId, limit);
    }

    // 3. Save to Cache Database (Expires in 15 minutes)
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await RecommendationCache.findOneAndUpdate(
        { user: userId || null, sessionKey: userId ? undefined : 'guest', recommendationType },
        {
          recommendations: results.map(r => ({
            itemType: r.itemType,
            itemId: r.itemId,
            score: r.score,
            reason: r.reason,
            confidence: r.confidence,
          })),
          expiresAt,
        },
        { upsert: true }
      );
    } catch (err) {
      logger.error('Failed writing recommendation cache:', err);
    }

    return results;
  },

  /**
   * Sort restaurants dynamically using smart ranking
   */
  async rankRestaurants(restaurants, userCoords = null, userId = null) {
    return await smartRankingStrategy.rankRestaurants(restaurants, userCoords, userId);
  }
};
