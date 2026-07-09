import { personalizedStrategy } from './personalizedStrategy.js';
import { trendingStrategy } from './trendingStrategy.js';
import { collaborativeStrategy } from './collaborativeStrategy.js';
import { contentBasedStrategy } from './contentBasedStrategy.js';

export const hybridStrategy = {
  name: 'hybrid',

  async recommend(userId, limit = 8) {
    // 1. Fetch recommendations from multiple sources
    const [personalized, trending, collaborative, content] = await Promise.all([
      personalizedStrategy.recommend(userId, limit),
      trendingStrategy.recommend(userId, limit),
      collaborativeStrategy.recommend(userId, limit),
      contentBasedStrategy.recommend(userId, limit),
    ]);

    // Map to hold merged scores
    const mergedMap = new Map();

    // Helper to add recommendations to mapping
    const addList = (list, weight) => {
      for (const rec of list) {
        const key = `${rec.itemType}_${rec.itemId.toString()}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            itemType: rec.itemType,
            itemId: rec.itemId,
            totalScore: 0,
            reasons: [],
            confidenceSum: 0,
            confidenceCount: 0,
            data: rec.data,
          });
        }
        const val = mergedMap.get(key);
        val.totalScore += rec.score * weight;
        val.confidenceSum += rec.confidence;
        val.confidenceCount += 1;
        if (rec.reason && !val.reasons.includes(rec.reason)) {
          val.reasons.push(rec.reason);
        }
      }
    };

    // Apply weights (Personalized: 40%, Collaborative: 20%, Content: 20%, Trending: 20%)
    addList(personalized, 0.4);
    addList(collaborative, 0.2);
    addList(content, 0.2);
    addList(trending, 0.2);

    // 2. Build final hybrid list
    const results = [];
    for (const [key, val] of mergedMap.entries()) {
      results.push({
        itemType: val.itemType,
        itemId: val.itemId,
        score: Math.min(1.0, val.totalScore),
        confidence: val.confidenceSum / val.confidenceCount,
        reason: val.reasons[0] || 'Recommended match for you',
        data: val.data,
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  },
};
