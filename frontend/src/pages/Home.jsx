import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSearchOutline } from 'react-icons/io5';

// Import Discovery Components
import HeroSection from '../components/home/HeroSection';
import CategorySlider from '../components/home/CategorySlider';
import OfferCarousel from '../components/home/OfferCarousel';
import RecentlyOrdered from '../components/home/RecentlyOrdered';
import FilterBar from '../components/home/FilterBar';
import RestaurantCard from '../components/home/RestaurantCard';
import NearbyRestaurants from '../components/home/NearbyRestaurants';
import TrendingRestaurants from '../components/home/TrendingRestaurants';
import FastDeliverySection from '../components/home/FastDeliverySection';
import PopularDishes from '../components/home/PopularDishes';
import RecommendedSection from '../components/home/RecommendedSection';
import PopularRestaurants from '../components/home/PopularRestaurants';
import Testimonials from '../components/home/Testimonials';
import DownloadApp from '../components/home/DownloadApp';
import Newsletter from '../components/home/Newsletter';
import FooterCTA from '../components/home/FooterCTA';
import RecommendationsSection from '../components/home/RecommendationsSection';

// Import Hooks & Skeleton Loader
import { useRestaurants } from '../hooks/useHomeData';
import { RestaurantCardSkeleton } from '../components/home/SkeletonLoader';

const Home = () => {
  const [user, setUser] = useState(null);
  const [coords, setCoords] = useState({ latitude: 12.9716, longitude: 77.5946 }); // Default Bangalore coordinates
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    veg: '',
    rating: '',
    minOrderValue: '',
    sortBy: 'rating',
  });

  // Sync logged in user profile details
  useEffect(() => {
    const sessionUser = JSON.parse(localStorage.getItem('user'));
    setUser(sessionUser);
  }, []);

  // Handle location update from AddressSelector
  const handleLocationSelect = (loc) => {
    if (loc?.latitude && loc?.longitude) {
      setCoords({ latitude: loc.latitude, longitude: loc.longitude });
    }
  };

  // Build query arguments for the main dynamic filtered list
  const queryParams = {
    limit: 20,
    search: searchQuery || undefined,
    cuisine: selectedCuisine || undefined,
    rating: filters.rating ? parseFloat(filters.rating) : undefined,
    minOrderValue: filters.minOrderValue ? parseFloat(filters.minOrderValue) : undefined,
    veg: filters.veg === 'true' ? 'true' : undefined,
    sortBy: filters.sortBy || 'rating',
  };

  // Fetch the final filtered/searched listings using React Query
  const { data: filteredRestaurants, isLoading: isFeedLoading } = useRestaurants(queryParams);

  const hasActiveFilters = !!(searchQuery || selectedCuisine || filters.veg || filters.rating || filters.minOrderValue);

  return (
    <div className="flex flex-col gap-10 pb-12 transition-colors duration-300">
      
      {/* 1. Hero banner with greeting, search, location */}
      <HeroSection
        user={user}
        onLocationSelect={handleLocationSelect}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Horizontal Food Cravings Category Slider */}
      <CategorySlider
        selectedCategory={selectedCuisine}
        onSelectCategory={setSelectedCuisine}
      />

      {/* 3. Auto-sliding offer coupon banners */}
      <OfferCarousel />

      {/* 4. Recently Ordered History feed (Auth specific) */}
      <RecentlyOrdered isAuthenticated={!!user} />

      {/* 5. Sticky filters options selector */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Main Content Layout */}
      <div className="flex flex-col gap-12">
        <AnimatePresence mode="wait">
          {hasActiveFilters ? (
            /* Custom Search & Filter Feed List */
            <motion.div
              key="filtered-feed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                Search Results & Filter Matches
              </h3>
              
              {isFeedLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <RestaurantCardSkeleton key={i} />
                  ))}
                </div>
              ) : !filteredRestaurants || filteredRestaurants.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                  <span className="text-5xl">🔍</span>
                  <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">No restaurants match your active filters</h4>
                  <p className="text-xs text-slate-450">Try broadening your search criteria or resetting filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {filteredRestaurants.map((rest) => (
                    <RestaurantCard key={rest._id} restaurant={rest} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* Home Page Discovery Sections (comparable to Swiggy/Zomato feeds) */
            <motion.div
              key="default-discovery-feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-12"
            >
              {/* Enterprise AI Recommendations Engine Section */}
              <RecommendationsSection />

              {/* Nearby locations search */}
              <NearbyRestaurants coords={coords} />

              {/* Top rating trending list */}
              <TrendingRestaurants />

              {/* Dishes carousel */}
              <PopularDishes />

              {/* Fast deliveries */}
              <FastDeliverySection />

              {/* Discount deals */}
              <RecommendedSection />

              {/* Popular listings */}
              <PopularRestaurants />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. Brand social customer reviews quotes */}
        <Testimonials />

        {/* 7. Mobile App conversion banner */}
        <DownloadApp />

        {/* 8. Newsletter subscription banner */}
        <Newsletter />

        {/* 9. Joint venture footer banner */}
        <FooterCTA />
      </div>
    </div>
  );
};

export default Home;
