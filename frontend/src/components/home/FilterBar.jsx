import React from 'react';
import { IoFilterOutline, IoChevronDownOutline, IoLeafOutline } from 'react-icons/io5';

const FilterBar = ({ filters, onFiltersChange }) => {
  const toggleFilter = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: filters[key] === value ? '' : value
    });
  };

  const handleSortChange = (e) => {
    onFiltersChange({
      ...filters,
      sortBy: e.target.value
    });
  };

  return (
    <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-dark-700/80 backdrop-blur-md border-y border-slate-205/30 dark:border-white/5 py-4 -mx-4 px-4 sm:mx-0 sm:px-0 flex flex-wrap items-center justify-between gap-4 transition-colors duration-300">
      
      {/* Filters Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-slate-400 text-xs font-bold mr-2 uppercase tracking-wider">
          <IoFilterOutline /> Filters
        </span>

        {/* Veg Toggle */}
        <button
          onClick={() => toggleFilter('veg', 'true')}
          className={`flex items-center gap-1 text-xs px-3.5 py-1.5 rounded-full border font-bold transition-all ${
            filters.veg === 'true'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
              : 'bg-white dark:bg-neutral-900 border-slate-200/60 dark:border-neutral-800 text-slate-650 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <IoLeafOutline className="text-emerald-500" />
          <span>Veg</span>
        </button>

        {/* Rating 4.0+ */}
        <button
          onClick={() => toggleFilter('rating', '4.0')}
          className={`text-xs px-3.5 py-1.5 rounded-full border font-bold transition-all ${
            filters.rating === '4.0'
              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'bg-white dark:bg-neutral-900 border-slate-200/60 dark:border-neutral-800 text-slate-650 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <span>4.0+ Rated</span>
        </button>

        {/* Delivery Time (Fast Delivery) */}
        <button
          onClick={() => toggleFilter('sortBy', 'deliveryTime')}
          className={`text-xs px-3.5 py-1.5 rounded-full border font-bold transition-all ${
            filters.sortBy === 'deliveryTime'
              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500'
              : 'bg-white dark:bg-neutral-900 border-slate-200/60 dark:border-neutral-800 text-slate-650 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <span>Fast Delivery</span>
        </button>

        {/* Price filter (low order value) */}
        <button
          onClick={() => toggleFilter('minOrderValue', '150')}
          className={`text-xs px-3.5 py-1.5 rounded-full border font-bold transition-all ${
            filters.minOrderValue === '150'
              ? 'bg-brand-500/10 border-brand-500 text-brand-500'
              : 'bg-white dark:bg-neutral-900 border-slate-200/60 dark:border-neutral-800 text-slate-650 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <span>Low Order Limit</span>
        </button>
      </div>

      {/* Sort selection dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort-dropdown" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Sort by
        </label>
        <div className="relative">
          <select
            id="sort-dropdown"
            value={filters.sortBy || 'rating'}
            onChange={handleSortChange}
            className="appearance-none text-xs font-black pl-4 pr-9 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer transition-all"
          >
            <option value="rating">Top Rated</option>
            <option value="deliveryTime">Delivery Speed</option>
            <option value="createdAt">New Arrivals</option>
          </select>
          <IoChevronDownOutline className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
