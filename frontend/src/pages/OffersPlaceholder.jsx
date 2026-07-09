import React from 'react';
import { IoPricetagOutline } from 'react-icons/io5';

const OffersPlaceholder = () => {
  return (
    <div className="flex flex-col gap-6 py-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Discount Offers & Coupons
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Get maximum discounts on your orders
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex gap-4 items-center">
          <div className="p-3 bg-brand-50 dark:bg-brand-950/30 text-brand-500 rounded-2xl text-2xl">
            <IoPricetagOutline />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">50% OFF up to ₹100</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wider">CODE: CRAVE50</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex gap-4 items-center">
          <div className="p-3 bg-brand-50 dark:bg-brand-950/30 text-brand-500 rounded-2xl text-2xl">
            <IoPricetagOutline />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Free Delivery above ₹250</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wider">CODE: FREEDEL</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersPlaceholder;
