import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin, Heart } from 'lucide-react';
import Card from '../ui/Card';
import { cn } from '../../utils/cn';

const RestaurantCard = ({ restaurant }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('fav_restaurants') || '[]');
    setIsFavorite(favorites.includes(restaurant._id));
  }, [restaurant._id]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('fav_restaurants') || '[]');
    let updated;
    if (favorites.includes(restaurant._id)) {
      updated = favorites.filter((id) => id !== restaurant._id);
      setIsFavorite(false);
    } else {
      updated = [...favorites, restaurant._id];
      setIsFavorite(true);
    }
    localStorage.setItem('fav_restaurants', JSON.stringify(updated));
  };

  const offerText = restaurant.minOrderValue > 0
    ? `₹${restaurant.minOrderValue} Min`
    : 'Free Delivery';

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full h-full"
    >
      <Link to={`/restaurants/${restaurant._id}`}>
        <Card className="overflow-hidden p-0 rounded-[24px] border border-slate-200/50 dark:border-white/5 flex flex-col h-full bg-white/70 dark:bg-[#0e0e16]/40 shadow-premium hover:shadow-premium-hover transition-all duration-300">
          
          {/* Cover Image */}
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-neutral-800">
            {restaurant.image ? (
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl select-none">🍳</span>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Favorite Icon */}
            <button
              onClick={toggleFavorite}
              className="absolute top-3.5 right-3.5 z-10 w-9.5 h-9.5 flex items-center justify-center rounded-2xl bg-white/90 dark:bg-black/60 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:text-rose-500 dark:hover:text-rose-500 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
              aria-label="Add to favorites"
            >
              <Heart className={cn("w-4.5 h-4.5 transition-colors", isFavorite ? "fill-rose-500 text-rose-500" : "")} />
            </button>

            {/* Offers/Coupon Badge */}
            {restaurant.deliveryCharge === 0 || restaurant.minOrderValue <= 200 ? (
              <div className="absolute bottom-3.5 left-3.5 bg-brand-500/90 text-white backdrop-blur-sm px-3 py-1 rounded-xl text-[9px] font-black tracking-wider uppercase shadow-sm select-none">
                🔥 {restaurant.deliveryCharge === 0 ? 'Free Delivery' : 'Combo Offer'}
              </div>
            ) : null}

            {/* Average Rating Badge */}
            <div className="absolute top-3.5 left-3.5 bg-white/95 dark:bg-[#0c0c14]/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[9px] font-black flex items-center gap-1 text-amber-500 shadow-sm select-none">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {restaurant.averageRating ? restaurant.averageRating.toFixed(1) : '4.2'}
            </div>
          </div>

          {/* Details */}
          <div className="p-5 flex flex-col gap-2 flex-grow">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 line-clamp-1 tracking-tight">
              {restaurant.name}
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-neutral-500 truncate font-semibold">
              {restaurant.cuisine?.join(', ')}
            </p>

            {/* Meta Info */}
            <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-500 dark:text-neutral-500 font-bold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {restaurant.averagePreparationTimeMin || 25} mins
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {restaurant.deliveryRadiusKm || 5} km
              </span>
              <span className="text-brand-500 dark:text-brand-400 font-extrabold">
                {offerText}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default RestaurantCard;
