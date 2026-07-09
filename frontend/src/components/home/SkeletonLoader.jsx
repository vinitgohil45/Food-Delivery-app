import React from 'react';

export const CategorySkeleton = () => (
  <div className="flex gap-4 overflow-x-hidden py-2">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex-shrink-0 w-24 h-24 rounded-full bg-slate-200 dark:bg-neutral-800 animate-pulse" />
    ))}
  </div>
);

export const RestaurantCardSkeleton = () => (
  <div className="w-full flex flex-col gap-4 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden p-0 border border-slate-100 dark:border-white/5 shadow-sm">
    <div className="aspect-video w-full bg-slate-200 dark:bg-neutral-800 animate-pulse" />
    <div className="p-5 flex flex-col gap-3">
      <div className="h-4 w-2/3 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
      <div className="h-3 w-1/2 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
      <div className="flex justify-between items-center mt-2">
        <div className="h-3 w-16 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-3 w-16 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

export const FoodCardSkeleton = () => (
  <div className="w-60 flex-shrink-0 flex flex-col gap-4 bg-white dark:bg-neutral-900 rounded-3xl p-4 border border-slate-100 dark:border-white/5 shadow-sm">
    <div className="h-36 w-full bg-slate-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
    <div className="flex flex-col gap-2">
      <div className="h-4 w-3/4 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
      <div className="h-3 w-1/2 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
      <div className="flex justify-between items-center mt-1">
        <div className="h-4 w-12 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-8 w-16 bg-slate-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
);
