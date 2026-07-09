import React from 'react';
import { useHomeRecommendations } from '../../hooks/useRecommendations';
import RecommendationCarousel from './RecommendationCarousel';
import { FoodCardSkeleton } from './SkeletonLoader';
import Card from '../ui/Card';
import { Link } from 'react-router-dom';

const RecommendationsSection = () => {
  const { data, isLoading } = useHomeRecommendations();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="h-6 w-48 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="flex gap-4 overflow-x-hidden">
            {[...Array(4)].map((_, i) => (
              <FoodCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { personalized = [], trending = [], seasonal = [], recentlyViewed = [] } = data;

  return (
    <div className="flex flex-col gap-10">
      
      {/* 1. Personalized Recommendations */}
      {personalized.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">AI Personalization</span>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Recommended For You 🎯
            </h3>
          </div>
          <RecommendationCarousel items={personalized} type="personalized" />
        </div>
      )}

      {/* 2. Trending Section */}
      {trending.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Crowd Favorites</span>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Trending Nearby 🔥
            </h3>
          </div>
          <RecommendationCarousel items={trending} type="trending" />
        </div>
      )}

      {/* 3. Seasonal Section */}
      {seasonal.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Time-of-day Special</span>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Seasonal & Current Selections 🌤️
            </h3>
          </div>
          <RecommendationCarousel items={seasonal} type="seasonal" />
        </div>
      )}

      {/* 4. Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pick up where you left off</span>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Recently Browsed 🕒
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentlyViewed.map((item, index) => {
              const info = item.data;
              if (!info) return null;

              const linkUrl = item.itemType === 'Restaurant'
                ? `/restaurants/${info._id}`
                : `/restaurants/${info.restaurant}`;

              return (
                <Link key={`${item.itemType}_${index}`} to={linkUrl}>
                  <Card className="p-3 border border-slate-205/30 dark:border-white/5 bg-white dark:bg-neutral-900/60 rounded-2xl flex flex-col gap-2 hover:shadow-premium transition-all duration-300">
                    <img
                      src={info.image || '/images/dish-placeholder.jpg'}
                      alt={info.name}
                      loading="lazy"
                      className="h-24 w-full object-cover rounded-xl"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {info.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-extrabold capitalize mt-0.5">
                        {item.itemType}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;
