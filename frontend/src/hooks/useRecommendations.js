import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to retrieve aggregated home recommendations
 */
export const useHomeRecommendations = () => {
  return useQuery({
    queryKey: ['recommendations', 'home'],
    queryFn: async () => {
      const { data } = await api.get('/recommendations/home');
      return data?.data || { personalized: [], trending: [], seasonal: [], recentlyViewed: [] };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

/**
 * Hook to retrieve personalized recommendations
 */
export const usePersonalizedRecommendations = () => {
  return useQuery({
    queryKey: ['recommendations', 'personalized'],
    queryFn: async () => {
      const { data } = await api.get('/recommendations/personalized');
      return data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to retrieve trending dishes
 */
export const useTrendingRecommendations = () => {
  return useQuery({
    queryKey: ['recommendations', 'trending'],
    queryFn: async () => {
      const { data } = await api.get('/recommendations/trending');
      return data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to retrieve frequently bought together items
 */
export const useFrequentlyBoughtTogether = (menuItemId) => {
  return useQuery({
    queryKey: ['recommendations', 'frequently-bought', menuItemId],
    queryFn: async () => {
      if (!menuItemId) return [];
      const { data } = await api.get(`/recommendations/frequently-bought?menuItemId=${menuItemId}`);
      return data?.data || [];
    },
    enabled: !!menuItemId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to retrieve recently viewed items
 */
export const useRecentlyViewed = () => {
  return useQuery({
    queryKey: ['recommendations', 'recently-viewed'],
    queryFn: async () => {
      const { data } = await api.get('/recommendations/recently-viewed');
      return data?.data || { restaurants: [], menuItems: [], categories: [], searches: [] };
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Mutation hook to register recommendation clicks
 */
export const useTrackRecommendationClick = () => {
  return useMutation({
    mutationFn: async ({ itemId, itemType, recommendationType }) => {
      const { data } = await api.post('/recommendations/click', {
        itemId,
        itemType,
        recommendationType,
      });
      return data;
    },
  });
};

/**
 * Mutation hook to register browse views (Recently Viewed)
 */
export const useLogRecentlyViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restaurantId, menuItemId, category, search }) => {
      const { data } = await api.post('/recommendations/recently-viewed', {
        restaurantId,
        menuItemId,
        category,
        search,
      });
      return data;
    },
    onSuccess: () => {
      // Invalidate recently viewed caches to trigger update
      queryClient.invalidateQueries({ queryKey: ['recommendations', 'recently-viewed'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations', 'home'] });
    },
  });
};
