import React from 'react';
import { useRestaurants } from '../../hooks/useHomeData';
import RestaurantCard from './RestaurantCard';
import { RestaurantCardSkeleton } from './SkeletonLoader';

const TopRatedRestaurants = () => {
  const { data: restaurants, isLoading } = useRestaurants({ rating: 4.5, limit: 4 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Top Rated Hotspots ⭐
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
        Top Rated Hotspots ⭐
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {restaurants.map((rest) => (
          <RestaurantCard key={rest._id} restaurant={rest} />
        ))}
      </div>
    </div>
  );
};

export default TopRatedRestaurants;
