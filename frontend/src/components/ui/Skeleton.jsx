import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton = ({
  className = '',
  variant = 'rectangular', // rectangular, circular, text
  ...props
}) => {
  const baseStyles = 'relative overflow-hidden bg-slate-200/80 dark:bg-neutral-800/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-white/10 before:to-transparent';

  const variants = {
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
    text: 'h-4 rounded-lg w-full',
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  );
};

export const RestaurantCardSkeleton = () => {
  return (
    <div className="glass-card-premium p-4.5 rounded-3xl flex flex-col gap-3.5 w-full">
      <Skeleton className="aspect-video w-full" />
      <div className="flex flex-col gap-2.5">
        <Skeleton variant="text" className="w-2/3 h-5" />
        <Skeleton variant="text" className="w-1/2 h-3.5" />
        <div className="flex justify-between items-center mt-2 border-t border-slate-100 dark:border-neutral-800/40 pt-3">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
