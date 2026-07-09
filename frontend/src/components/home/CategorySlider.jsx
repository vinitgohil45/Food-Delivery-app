import React from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { name: 'Burgers', icon: '🍔' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Biryani', icon: '🍲' },
  { name: 'Chinese', icon: '🥡' },
  { name: 'South Indian', icon: '🥞' },
  { name: 'North Indian', icon: '🍛' },
  { name: 'Desserts', icon: '🍰' },
  { name: 'Coffee', icon: '☕' },
  { name: 'Healthy', icon: '🥗' },
  { name: 'Street Food', icon: '🍢' },
  { name: 'Rolls', icon: '🌯' },
  { name: 'Momos', icon: '🥟' },
  { name: 'Sandwiches', icon: '🥪' },
  { name: 'Pasta', icon: '🍝' }
];

const CategorySlider = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
        What's on your mind? 🍕
      </h2>

      {/* Horizontal Scroll wrapper */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-800 -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat, idx) => {
          const isActive = selectedCategory === cat.name;
          return (
            <motion.button
              key={cat.name}
              onClick={() => onSelectCategory(isActive ? '' : cat.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 flex flex-col items-center gap-2.5 p-4 w-24 rounded-full border transition-all duration-300 ${
                isActive
                  ? 'bg-brand-500 border-brand-500 text-white shadow-premium'
                  : 'bg-white dark:bg-neutral-900 border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 shadow-sm hover:border-slate-200 dark:hover:border-neutral-800'
              }`}
            >
              <span className="text-3xl filter drop-shadow-md select-none">{cat.icon}</span>
              <span className="text-[10px] font-black tracking-wider uppercase text-center truncate w-full">
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySlider;
