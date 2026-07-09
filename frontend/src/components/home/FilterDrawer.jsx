import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoReloadOutline } from 'react-icons/io5';
import Button from '../ui/Button';

const CUISINES = ['Italian', 'Indian', 'Chinese', 'American', 'Mexican', 'Thai', 'Japanese', 'Bakery'];

const FilterDrawer = ({ isOpen, onClose, filters, onApplyFilters, onResetFilters }) => {
  const [localFilters, setLocalFilters] = React.useState({ ...filters });

  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters({ ...filters });
    }
  }, [isOpen, filters]);

  const handleToggleVeg = (val) => {
    setLocalFilters(prev => ({
      ...prev,
      veg: prev.veg === val ? '' : val,
    }));
  };

  const handleChange = (key, val) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const cleared = {
      veg: '',
      rating: '',
      priceMin: '',
      priceMax: '',
      minOrderValue: '',
      cuisine: '',
    };
    setLocalFilters(cleared);
    onResetFilters(cleared);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white dark:bg-neutral-900 border-l border-slate-200/50 dark:border-white/5 shadow-2xl z-55 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-neutral-800/40 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-950/20">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                Search Filters
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 hover:bg-slate-100 dark:hover:bg-neutral-850"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin">
              
              {/* Veg / Non-Veg Preferences */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Diet Preference</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggleVeg('true')}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                      localFilters.veg === 'true'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-neutral-850/50'
                    }`}
                  >
                    Veg only 🥬
                  </button>
                  <button
                    onClick={() => handleToggleVeg('false')}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                      localFilters.veg === 'false'
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-450'
                        : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-neutral-850/50'
                    }`}
                  >
                    Non-Veg only 🍗
                  </button>
                </div>
              </div>

              {/* Minimum Rating threshold */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Ratings</span>
                <div className="flex flex-wrap gap-2">
                  {['3.5', '4.0', '4.5'].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleChange('rating', localFilters.rating === r ? '' : r)}
                      className={`py-2 px-4 rounded-xl border text-xs font-bold transition-all ${
                        localFilters.rating === r
                          ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/10 text-brand-600 dark:text-brand-400'
                          : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-neutral-850/50'
                      }`}
                    >
                      {r}★ & above
                    </button>
                  ))}
                </div>
              </div>

              {/* Price limits range */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Price Range</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={localFilters.priceMin}
                    onChange={(e) => handleChange('priceMin', e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-200 font-semibold"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={localFilters.priceMax}
                    onChange={(e) => handleChange('priceMax', e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-200 font-semibold"
                  />
                </div>
              </div>

              {/* Cuisines tag list */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Cuisine Options</span>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleChange('cuisine', localFilters.cuisine === c ? '' : c)}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                        localFilters.cuisine === c
                          ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/10 text-brand-600 dark:text-brand-400'
                          : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-neutral-850/50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-slate-105/50 dark:border-neutral-800/40 flex gap-4 bg-slate-55/20 dark:bg-neutral-950/20">
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-1/3 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <IoReloadOutline />
                <span>Reset</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleApply}
                className="w-2/3 py-3 rounded-2xl text-xs font-black"
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;
