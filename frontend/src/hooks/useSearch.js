import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook to execute advanced catalog searches
 */
export const useSearchCatalog = ({ query, filters = {}, sort = 'relevance' }) => {
  return useQuery({
    queryKey: ['search', 'catalog', query, filters, sort],
    queryFn: async () => {
      // Build search query params
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (sort) params.append('sort', sort);
      
      // Append active filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const { data } = await api.get(`/search?${params.toString()}`);
      return data?.data || { restaurants: [], menuItems: [], didYouMean: '', searchTimeMs: 0, resultsCount: 0 };
    },
    enabled: true, // Run query on empty query too (returns ranked defaults)
    staleTime: 2 * 60 * 1000, // 2 minutes caching
  });
};

/**
 * Hook to retrieve autocomplete suggests
 */
export const useAutocompleteSuggestions = (query) => {
  return useQuery({
    queryKey: ['search', 'autocomplete', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];
      const { data } = await api.get(`/search/autocomplete?query=${query}`);
      return data?.data || [];
    },
    enabled: !!(query && query.trim().length >= 2),
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook to retrieve trending keywords
 */
export const useTrendingSearches = () => {
  return useQuery({
    queryKey: ['search', 'trending'],
    queryFn: async () => {
      const { data } = await api.get('/search/trending');
      return data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to retrieve popular searches
 */
export const usePopularSearches = () => {
  return useQuery({
    queryKey: ['search', 'popular'],
    queryFn: async () => {
      const { data } = await api.get('/search/popular');
      return data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to retrieve search history list
 */
export const useSearchHistory = () => {
  return useQuery({
    queryKey: ['search', 'history'],
    queryFn: async () => {
      const { data } = await api.get('/search/history');
      return data?.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Mutation hook to append search query history record
 */
export const useSaveSearchHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (query) => {
      const { data } = await api.post('/search/history', { query });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'history'] });
    },
  });
};

/**
 * Mutation hook to clear search history queries
 */
export const useDeleteSearchHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (query) => {
      const { data } = await api.delete('/search/history', { data: { query } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'history'] });
    },
  });
};

/**
 * Mutation hook to log CTR click telemetry
 */
export const useTrackSearchClick = () => {
  return useMutation({
    mutationFn: async ({ query, itemId, itemType }) => {
      const { data } = await api.post('/search/click', { query, itemId, itemType });
      return data;
    },
  });
};

/**
 * Mutation hook to resolve voice recognition commands
 */
export const useVoiceSearchTranscript = () => {
  return useMutation({
    mutationFn: async (transcript) => {
      const { data } = await api.post('/search/voice', { transcript });
      return data?.data || '';
    },
  });
};
