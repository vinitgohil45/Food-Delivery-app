import React from 'react';
import { useMenuItems } from '../../hooks/useHomeData';
import FoodCard from './FoodCard';
import { FoodCardSkeleton } from './SkeletonLoader';

const PopularDishes = () => {
  const { data: items, isLoading } = useMenuItems({ limit: 8 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Trending Bites & Popular Dishes 🍔
        </h3>
        <div className="flex gap-4 overflow-x-hidden py-2">
          {[...Array(6)].map((_, i) => (
            <FoodCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
        Trending Bites & Popular Dishes 🍔
      </h3>
      
      {/* Horizontal scrolling dishes list */}
      <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
        {items.map((dish) => (
          <FoodCard key={dish._id} item={dish} />
        ))}
      </div>
    </div>
  );
};

export default PopularDishes;
