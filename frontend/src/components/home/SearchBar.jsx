import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Flame, Clock, Utensils, Store } from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const TRENDING_SEARCHES = ['Burger', 'Pizza', 'Biryani', 'Dal Makhani', 'Coffee', 'Alfredo Pasta'];

const SearchBar = ({ onSearchChange }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ restaurants: [], dishes: [] });
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Load recent searches
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    setRecentSearches(history);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Autocomplete Suggestions with Debounce
  const fetchSuggestions = async (val) => {
    if (!val.trim()) {
      setSuggestions({ restaurants: [], dishes: [] });
      return;
    }
    try {
      const [restRes, menuRes] = await Promise.all([
        api.get(`/restaurants?limit=5&search=${val}`),
        api.get(`/menu?limit=5&search=${val}`),
      ]);
      
      const resList = restRes.data?.success ? (restRes.data.data?.restaurants || restRes.data.data) : [];
      const dishList = menuRes.data?.success ? (menuRes.data.data?.items || menuRes.data.data) : [];
      
      setSuggestions({
        restaurants: Array.isArray(resList) ? resList : [],
        dishes: Array.isArray(dishList) ? dishList : [],
      });
    } catch (e) {
      console.error('Autocomplete fetch failed');
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleSelectSearch = (term) => {
    setQuery(term);
    setIsFocused(false);
    
    // Save to history
    const history = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    const updated = [term, ...history.filter((t) => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));

    if (onSearchChange) onSearchChange(term);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSuggestions({ restaurants: [], dishes: [] });
    if (onSearchChange) onSearchChange('');
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const totalSuggestions = suggestions.restaurants.length + suggestions.dishes.length;
    if (totalSuggestions === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalSuggestions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + totalSuggestions) % totalSuggestions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        if (activeIndex < suggestions.restaurants.length) {
          const rest = suggestions.restaurants[activeIndex];
          navigate(`/restaurants/${rest._id}`);
        } else {
          const dish = suggestions.dishes[activeIndex - suggestions.restaurants.length];
          handleSelectSearch(dish.name);
        }
      } else {
        handleSelectSearch(query);
      }
    }
  };

  return (
    <div ref={searchRef} className="w-full max-w-2xl relative z-40">
      {/* Search Input Container */}
      <div className="relative flex items-center group">
        <Search className="absolute left-6 text-slate-450 dark:text-neutral-500 w-5 h-5 pointer-events-none group-focus-within:text-brand-500 transition-colors duration-300" />
        <input
          type="text"
          placeholder="Search for restaurants, cuisines, or favorite dishes..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="w-full py-4.5 pl-15 pr-14 rounded-full bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-sm shadow-premium focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/40 focus:bg-white dark:focus:bg-[#050508]/80 transition-all duration-350"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
        />
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute right-6 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Floating Suggestion Dropdown */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            id="search-suggestions"
            className="absolute left-0 right-0 mt-3 p-6 rounded-[28px] bg-white/95 dark:bg-[#0c0c14]/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 shadow-2xl flex flex-col gap-6 max-h-[480px] overflow-y-auto"
          >
            {/* Realtime Autocomplete Results */}
            {query.trim() && (suggestions.restaurants.length > 0 || suggestions.dishes.length > 0) ? (
              <div className="flex flex-col gap-4">
                {suggestions.restaurants.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-455 dark:text-neutral-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 select-none">
                      <Store className="w-3.5 h-3.5" /> Restaurants
                    </h5>
                    <div className="flex flex-col gap-0.5">
                      {suggestions.restaurants.map((rest, idx) => {
                        const isCurrentActive = activeIndex === idx;
                        return (
                          <Link
                            key={rest._id}
                            to={`/restaurants/${rest._id}`}
                            className={`flex justify-between items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                              isCurrentActive
                                ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-500'
                                : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <span>{rest.name}</span>
                            <span className="text-[10px] text-slate-450">{rest.cuisine.join(', ')}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {suggestions.dishes.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-455 dark:text-neutral-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 select-none">
                      <Utensils className="w-3.5 h-3.5" /> Dishes
                    </h5>
                    <div className="flex flex-col gap-0.5">
                      {suggestions.dishes.map((dish, idx) => {
                        const globalIndex = suggestions.restaurants.length + idx;
                        const isCurrentActive = activeIndex === globalIndex;
                        return (
                          <button
                            key={dish._id}
                            onClick={() => handleSelectSearch(dish.name)}
                            className={`flex justify-between items-center w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left ${
                              isCurrentActive
                                ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-500'
                                : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <span>{dish.name}</span>
                            <span className="text-[10px] text-brand-500 font-extrabold">₹{dish.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 select-none">
                  <Clock className="w-3.5 h-3.5" /> Recent Searches
                </h5>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectSearch(term)}
                      className="text-xs px-4 py-2 rounded-full border border-slate-100 dark:border-white/5 hover:border-brand-500 dark:hover:border-brand-500 text-slate-600 dark:text-slate-350 transition-all font-semibold active:scale-95 cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending / Fast Keywords */}
            <div>
              <h5 className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 select-none">
                <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Trending Cravings
              </h5>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelectSearch(term)}
                    className="text-xs px-4 py-2 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-brand-50 dark:hover:bg-brand-950/20 hover:text-brand-500 text-slate-655 dark:text-slate-300 transition-all font-semibold active:scale-95 cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
