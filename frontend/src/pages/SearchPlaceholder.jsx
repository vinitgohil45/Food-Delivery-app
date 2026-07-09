import React from 'react';
import { IoSearchOutline } from 'react-icons/io5';

const SearchPlaceholder = () => {
  return (
    <div className="flex flex-col gap-6 py-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Search Restaurants & Foods
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Explore recipes, cuisines, or brand listings near you
        </p>
      </div>

      <div className="relative flex items-center">
        <IoSearchOutline className="absolute left-4 text-slate-400 text-xl pointer-events-none" />
        <input
          type="text"
          placeholder="Search for pizza, biryani, burgers..."
          className="w-full py-4 pl-12 pr-4 rounded-2xl bg-white dark:bg-dark-500 border border-slate-200 dark:border-neutral-800 text-sm shadow-premium focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-200"
        />
      </div>

      <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-neutral-800 text-center text-slate-400 dark:text-neutral-500">
        Type to explore CraveGo kitchen menus
      </div>
    </div>
  );
};

export default SearchPlaceholder;
