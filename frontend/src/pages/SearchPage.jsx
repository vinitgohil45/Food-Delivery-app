import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mic,
  MicOff,
  X,
  SlidersHorizontal,
  Trash2,
  ArrowRight,
  Clock,
  Flame,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  useSearchCatalog,
  useAutocompleteSuggestions,
  useTrendingSearches,
  usePopularSearches,
  useSearchHistory,
  useSaveSearchHistory,
  useDeleteSearchHistory,
  useTrackSearchClick,
} from '../hooks/useSearch';

import FilterDrawer from '../components/home/FilterDrawer';
import RestaurantCard from '../components/home/RestaurantCard';
import FoodCard from '../components/home/FoodCard';
import { RestaurantCardSkeleton, FoodCardSkeleton } from '../components/home/SkeletonLoader';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils/cn';

const SearchPage = () => {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sort, setSort] = useState('relevance');

  const [filters, setFilters] = useState({
    veg: '',
    rating: '',
    priceMin: '',
    priceMax: '',
    minOrderValue: '',
    cuisine: '',
  });

  const dropdownRef = useRef(null);
  const recognitionRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 450);
    return () => clearTimeout(handler);
  }, [query]);

  // Click outside suggestion dropdown handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Web Speech API for voice search
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recObj = new SpeechRecognition();
      recObj.continuous = false;
      recObj.interimResults = false;
      recObj.lang = 'en-US';

      recObj.onstart = () => {
        setIsListening(true);
        toast.info('Listening... Speak now');
      };

      recObj.onend = () => {
        setIsListening(false);
      };

      recObj.onerror = (e) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
        toast.error('Voice search failed. Try again.');
      };

      recObj.onresult = (e) => {
        const textResult = e.results[0][0].transcript;
        if (textResult) {
          setQuery(textResult);
          triggerSearch(textResult);
        }
      };

      recognitionRef.current = recObj;
    }
  }, []);

  // Fetch search query hooks
  const { data: searchResults, isLoading } = useSearchCatalog({
    query: debouncedQuery,
    filters,
    sort,
  });

  const { data: suggestions = [] } = useAutocompleteSuggestions(query);
  const { data: trending = [] } = useTrendingSearches();
  const { data: popular = [] } = usePopularSearches();
  const { data: history = [] } = useSearchHistory();

  const { mutate: saveHistory } = useSaveSearchHistory();
  const { mutate: deleteHistory } = useDeleteSearchHistory();
  const { mutate: trackClick } = useTrackSearchClick();

  // Keyboard navigation listener
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0) {
        selectSuggestion(suggestions[activeSuggestion].text);
      } else {
        triggerSearch(query);
      }
    }
  };

  const triggerSearch = (term) => {
    if (!term.trim()) return;
    setQuery(term);
    setDebouncedQuery(term);
    setShowDropdown(false);
    saveHistory(term);
  };

  const selectSuggestion = (term) => {
    triggerSearch(term);
  };

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      toast.info('Voice Speech API not supported on this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleItemClick = (itemId, itemType) => {
    if (debouncedQuery) {
      trackClick({
        query: debouncedQuery,
        itemId,
        itemType,
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-9 max-w-5xl mx-auto py-6 px-4"
    >
      {/* 1. Header search block container */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Search className="text-brand-500 w-5.5 h-5.5" /> Advanced Restaurant & Food Finder
        </h2>
        <p className="text-xs text-slate-400 dark:text-neutral-500 font-semibold select-none">
          Search for top local cuisines, popular dishes, and restaurants near you.
        </p>
      </div>

      {/* 2. Interactive Input bar and mic buttons */}
      <div ref={dropdownRef} className="relative flex items-center gap-3.5 w-full">
        <div className="relative flex-1 flex items-center group">
          <Search className="absolute left-5 text-slate-400 group-focus-within:text-brand-500 w-5 h-5 pointer-events-none z-10 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Search pizza, biryani, burgers or restaurants..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
              setActiveSuggestion(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className="w-full py-4 pl-14 pr-12 rounded-[24px] bg-white/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-sm shadow-premium focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/40 focus:bg-white dark:focus:bg-black/40 backdrop-blur-md transition-all duration-300 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400/80 dark:placeholder-neutral-500"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
              }}
              className="absolute right-5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mic Speech Button */}
        <button
          onClick={handleVoiceSearch}
          className={cn(
            "w-13 h-13 rounded-2xl border border-slate-200/40 dark:border-white/5 shadow-premium flex items-center justify-center transition-all cursor-pointer active:scale-95",
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/20'
              : 'bg-white/65 dark:bg-white/5 text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/10'
          )}
          title="Voice Search"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Filter Drawer Trigger */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className="w-13 h-13 rounded-2xl bg-white/65 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 shadow-premium flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-350 transition-all cursor-pointer active:scale-95"
          title="Advanced Filters"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* Keystrokes Suggestion Autocomplete Dropdown list */}
        <AnimatePresence>
          {showDropdown && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-15.5 left-0 right-0 z-50 rounded-[24px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col p-1.5"
            >
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.type}_${item.targetId}_${idx}`}
                  onClick={() => selectSuggestion(item.text)}
                  className={cn(
                    "p-3.5 text-left text-xs font-semibold flex items-center justify-between transition-colors rounded-xl select-none cursor-pointer",
                    idx === activeSuggestion
                      ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-500'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.text}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 dark:text-neutral-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                    {item.type}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Static Search Feed Dashboard */}
      {!debouncedQuery ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-2">
          {/* History queries */}
          {history.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center select-none">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Recent Searches
                </h4>
                <button
                  onClick={() => deleteHistory(undefined)}
                  className="text-[9px] font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {history.map((term, index) => (
                  <div key={index} className="flex justify-between items-center p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100/40 dark:border-white/5 shadow-premium hover:border-slate-200/60 dark:hover:border-white/10 transition-all">
                    <button
                      onClick={() => triggerSearch(term)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2.5 text-left cursor-pointer active:scale-98"
                    >
                      <Clock className="text-slate-400 w-3.5 h-3.5" />
                      <span>{term}</span>
                    </button>
                    <button
                      onClick={() => deleteHistory(term)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer active:scale-90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches queries */}
          {trending.length > 0 && (
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Trending Searches
              </h4>
              <div className="flex flex-wrap gap-2">
                {trending.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerSearch(term)}
                    className="py-2.5 px-4 rounded-full bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border border-rose-500/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <span>{term}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches queries */}
          {popular.length > 0 && (
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <BarChart2 className="w-3.5 h-3.5" /> Popular Searches
              </h4>
              <div className="flex flex-wrap gap-2">
                {popular.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerSearch(term)}
                    className="py-2.5 px-4 rounded-full bg-white dark:bg-white/5 border border-slate-200/40 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 4. Results Listing block */
        <div className="flex flex-col gap-7">
          {/* Sorting controls */}
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4 select-none">
            <span className="text-xs font-bold text-slate-400">
              Found {searchResults?.resultsCount || 0} matches in {searchResults?.searchTimeMs || 0}ms
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-[#0c0c14] border border-slate-200/60 dark:border-white/5 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="relevance">Sort by: Smart Relevance</option>
              <option value="rating">Sort by: High Rating ★</option>
              <option value="price_low">Sort by: Price Low → High</option>
              <option value="price_high">Sort by: Price High → Low</option>
            </select>
          </div>

          {/* "Did you mean?" corrections prompt */}
          {searchResults?.didYouMean && (
            <div className="p-4 rounded-2xl bg-brand-50/20 border border-brand-500/10 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Did you mean:</span>
              <button
                onClick={() => triggerSearch(searchResults.didYouMean)}
                className="font-black text-brand-500 hover:underline italic cursor-pointer"
              >
                {searchResults.didYouMean}
              </button>
              <span>?</span>
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <FoodCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {/* Restaurants Results Grid */}
              {searchResults?.restaurants?.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest select-none">
                    Matching Restaurants
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {searchResults.restaurants.map((rest) => (
                      <div key={rest._id} onClick={() => handleItemClick(rest._id, 'Restaurant')}>
                        <RestaurantCard restaurant={rest} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items Results Grid */}
              {searchResults?.menuItems?.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest select-none">
                    Matching Dishes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {searchResults.menuItems.map((dish) => (
                      <div key={dish._id} onClick={() => handleItemClick(dish._id, 'MenuItem')}>
                        <FoodCard item={dish} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty results */}
              {searchResults?.restaurants?.length === 0 && searchResults?.menuItems?.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                  <span className="text-5xl select-none">🤷</span>
                  <h4 className="font-extrabold text-slate-700 dark:text-slate-300">No results found for "{debouncedQuery}"</h4>
                  <p className="text-xs text-slate-450 max-w-sm leading-relaxed text-slate-400 dark:text-neutral-500 font-medium">
                    Double-check spelling or try broadening your filters (e.g. toggling veg/price ranges).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter Drawer panel */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        onResetFilters={setFilters}
      />
    </motion.div>
  );
};

export default SearchPage;
