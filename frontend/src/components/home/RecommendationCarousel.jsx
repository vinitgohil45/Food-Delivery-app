import React from 'react';
import { useTrackRecommendationClick } from '../../hooks/useRecommendations';
import RestaurantCard from './RestaurantCard';
import FoodCard from './FoodCard';

const RecommendationCarousel = ({ items, type, sectionName }) => {
  const { mutate: trackClick } = useTrackRecommendationClick();

  const handleItemClick = (itemId, itemType) => {
    trackClick({
      itemId,
      itemType,
      recommendationType: type,
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
        {items.map((rec, index) => {
          const itemData = rec.data;
          if (!itemData) return null;

          const matchPercent = Math.round(rec.score * 100);

          return (
            <div
              key={`${rec.itemType}_${rec.itemId}_${index}`}
              onClick={() => handleItemClick(rec.itemId, rec.itemType)}
              className="relative shrink-0 flex flex-col gap-2 group cursor-pointer"
            >
              {/* Premium AI Score Indicator Badge */}
              <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 pointer-events-none">
                <span className="text-[8px] font-black uppercase bg-brand-500 text-white px-2 py-0.5 rounded-md shadow-md w-fit">
                  ✨ {matchPercent}% AI Match
                </span>
                {rec.reason && (
                  <span className="text-[7px] font-bold bg-black/75 text-white/90 px-1.5 py-0.5 rounded-sm backdrop-blur-sm shadow line-clamp-1 max-w-[150px]">
                    {rec.reason}
                  </span>
                )}
              </div>

              {rec.itemType === 'Restaurant' ? (
                <div className="w-64">
                  <RestaurantCard restaurant={itemData} />
                </div>
              ) : (
                <FoodCard item={itemData} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationCarousel;
