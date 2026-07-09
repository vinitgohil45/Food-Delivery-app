import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '../services/api';

// Fetch all restaurants with filters/search
export const useRestaurants = (filters = {}) => {
  return useQuery({
    queryKey: ['restaurants', filters],
    queryFn: async () => {
      const { data } = await api.get('/restaurants', { params: filters });
      return data?.success ? (data.data?.restaurants || data.data) : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Fetch nearby restaurants using geospatial coordinates
export const useNearbyRestaurants = (coords, enabled = false) => {
  return useQuery({
    queryKey: ['restaurants-nearby', coords],
    queryFn: async () => {
      if (!coords?.latitude || !coords?.longitude) return [];
      const { data } = await api.get('/restaurants/nearby', {
        params: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          maxDistanceKm: 10,
        },
      });
      return data?.success ? data.data : [];
    },
    enabled: enabled && !!coords?.latitude && !!coords?.longitude,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch popular dishes (menu items)
export const useMenuItems = (filters = {}) => {
  return useQuery({
    queryKey: ['menu-items', filters],
    queryFn: async () => {
      const { data } = await api.get('/menu', { params: filters });
      return data?.success ? (data.data?.items || data.data) : [];
    },
    staleTime: 3 * 60 * 1000,
  });
};

// Fetch recent orders for the customer
export const useRecentOrders = (isAuthenticated = false) => {
  return useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params: { limit: 5 } });
      return data?.success ? (data.data?.orders || data.data) : [];
    },
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000,
  });
};
