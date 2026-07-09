import React, { useState } from 'react';
import { useFrequentlyBoughtTogether } from '../../hooks/useRecommendations';
import { useToast } from '../ui/Toast';
import api from '../../services/api';
import Button from '../ui/Button';
import { IoAddOutline } from 'react-icons/io5';

const FrequentlyBoughtTogether = ({ menuItemId }) => {
  const { data: recommendations, isLoading } = useFrequentlyBoughtTogether(menuItemId);
  const toast = useToast();
  const [isAdding, setIsAdding] = useState(null);

  const handleAddToCart = async (dish) => {
    setIsAdding(dish._id);
    try {
      const { data } = await api.post('/cart/add', {
        menuItem: dish._id,
        quantity: 1,
        selectedCustomizations: [],
      });

      if (data?.success) {
        toast.success(`Added ${dish.name} to cart!`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item to cart';
      if (msg.includes('different restaurant')) {
        const confirmReset = window.confirm('Your cart contains items from another restaurant. Would you like to clear your cart and start fresh?');
        if (confirmReset) {
          try {
            await api.delete('/cart/clear');
            await api.post('/cart/add', {
              menuItem: dish._id,
              quantity: 1,
              selectedCustomizations: [],
            });
            toast.success(`Cleared cart and added ${dish.name}!`);
          } catch (e) {
            toast.error('Failed to reset cart');
          }
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setIsAdding(null);
    }
  };

  if (isLoading || !recommendations || recommendations.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[28px] bg-slate-50 dark:bg-neutral-850/45 border border-slate-105/30 dark:border-white/5 my-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-brand-500">Market Basket Recommendations</span>
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-205">
          Frequently Bought Together 🛒
        </h4>
      </div>

      <div className="flex flex-col gap-3">
        {recommendations.slice(0, 3).map((rec) => {
          const dish = rec.data;
          if (!dish) return null;

          const matchPercent = Math.round(rec.confidence * 100);

          return (
            <div key={dish._id} className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <img
                  src={dish.image || '/images/dish-placeholder.jpg'}
                  alt={dish.name}
                  loading="lazy"
                  className="w-12 h-12 object-cover rounded-xl shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-150 line-clamp-1">{dish.name}</span>
                  <span className="text-[10px] text-slate-450 font-semibold">₹{dish.price}</span>
                  <span className="text-[8px] text-brand-500 font-extrabold mt-0.5">🔥 {matchPercent}% Combo Match</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                isLoading={isAdding === dish._id}
                onClick={() => handleAddToCart(dish)}
                className="py-1 px-3.5 rounded-xl text-[10px] font-black flex items-center gap-0.5 hover:bg-brand-500 hover:text-white transition-all shrink-0"
              >
                <IoAddOutline className="text-xs" />
                <span>Add</span>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
