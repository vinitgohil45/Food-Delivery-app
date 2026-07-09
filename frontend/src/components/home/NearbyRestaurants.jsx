import React from 'react';
import { useNearbyRestaurants } from '../../hooks/useHomeData';
import RestaurantCard from './RestaurantCard';
import { RestaurantCardSkeleton } from './SkeletonLoader';

const NearbyRestaurants = ({ coords }) => {
  const { data: restaurants, isLoading } = useNearbyRestaurants(coords, true);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Eateries Nearby 📍
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
        Eateries Nearby 📍
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {restaurants.slice(0, 4).map((rest) => (
          <RestaurantCard key={rest._id} restaurant={rest} />
        ))}
      </div>
    </div>
  );
};

export default NearbyRestaurants;
