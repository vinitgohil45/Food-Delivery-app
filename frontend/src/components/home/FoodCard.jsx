import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoAddOutline, IoFlameOutline, IoTimeOutline, IoStar } from 'react-icons/io5';
import Card from '../ui/Card';
import Button from '../ui/Button';
import api from '../../services/api';
import { useToast } from '../ui/Toast';

const FoodCard = ({ item }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if token exists
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.info('Please sign in to order food items!');
      navigate('/login');
      return;
    }

    setIsAdding(true);
    try {
      const response = await api.post('/cart/add', {
        menuItem: item._id,
        quantity: 1,
        selectedCustomizations: [],
      });
      if (response.data?.success) {
        toast.success(`Added ${item.name} to cart!`);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add item to cart';
      if (msg.includes('different restaurant')) {
        const confirmReset = window.confirm(
          'Your cart contains items from another restaurant. Clear cart and add this item?'
        );
        if (confirmReset) {
          try {
            await api.delete('/cart');
            await api.post('/cart/add', {
              menuItem: item._id,
              quantity: 1,
              selectedCustomizations: [],
            });
            toast.success(`Added ${item.name} to cart!`);
          } catch (e) {
            toast.error('Failed to clear cart');
          }
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const finalPrice = item.discountPercent > 0
    ? Math.round(item.price * (1 - item.discountPercent / 100))
    : item.price;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="w-60 flex-shrink-0"
    >
      <Link to={`/restaurants/${item.restaurant?._id || item.restaurant}`}>
        <Card className="overflow-hidden p-0 rounded-3xl border border-slate-200/50 dark:border-white/5 flex flex-col h-full bg-white dark:bg-neutral-900/60 shadow-premium hover:shadow-premium-hover transition-all duration-300">
          
          {/* Dish Image */}
          <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-neutral-800">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                🍲
              </div>
            )}

            {/* Veg/Non-Veg Badge */}
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-md p-1.5 rounded-lg shadow-sm">
              <span className={`block h-2 w-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>

            {/* Discount Badge */}
            {item.discountPercent > 0 && (
              <div className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                -{item.discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Dish Details */}
          <div className="p-4 flex flex-col gap-2 flex-grow">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
              {item.name}
            </h4>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed h-8">
              {item.description || 'Delectable treat prepared with finest ingredients.'}
            </p>

            {/* Preparation and Calories */}
            <div className="flex items-center gap-3 text-[9px] text-slate-500 dark:text-slate-400 font-extrabold mt-1">
              <span className="flex items-center gap-0.5">
                <IoTimeOutline className="text-xs" /> {item.preparationTime || 20}m
              </span>
              {item.calories > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500">
                  <IoFlameOutline className="text-xs" /> {item.calories} kcal
                </span>
              )}
            </div>

            {/* Price & Add to Cart button */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800/40">
              <div className="flex flex-col">
                {item.discountPercent > 0 ? (
                  <>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                      ₹{finalPrice}
                    </span>
                    <span className="text-[9px] font-bold text-slate-450 line-through">
                      ₹{item.price}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                    ₹{item.price}
                  </span>
                )}
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={<IoAddOutline />}
                onClick={handleQuickAdd}
                isLoading={isAdding}
                className="py-1 px-3.5 rounded-xl text-[10px] font-extrabold"
              >
                Add
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default FoodCard;
