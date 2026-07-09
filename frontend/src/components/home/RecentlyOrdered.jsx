import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoChevronForwardOutline, IoTimeOutline, IoBagCheckOutline } from 'react-icons/io5';
import { useRecentOrders } from '../../hooks/useHomeData';
import Card from '../ui/Card';

const RecentlyOrdered = ({ isAuthenticated }) => {
  const { data: orders, isLoading } = useRecentOrders(isAuthenticated);

  if (!isAuthenticated || isLoading || !orders || orders.length === 0) return null;

  // Extract unique restaurants from recent orders
  const recentRestaurants = [];
  const seen = new Set();
  
  for (const order of orders) {
    if (order.restaurant && !seen.has(order.restaurant._id)) {
      seen.add(order.restaurant._id);
      recentRestaurants.push({
        _id: order.restaurant._id,
        name: order.restaurant.name,
        address: order.restaurant.formattedAddress,
        date: new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      });
    }
  }

  if (recentRestaurants.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
        Recently Ordered & Favourites 🕒
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recentRestaurants.slice(0, 3).map((rest) => (
          <motion.div key={rest._id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <Link to={`/restaurants/${rest._id}`}>
              <Card className="flex items-center justify-between p-5 border border-slate-205/30 dark:border-white/5 bg-white dark:bg-neutral-900/60 rounded-[28px] hover:shadow-premium transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/20 text-brand-500 flex items-center justify-center">
                    <IoBagCheckOutline className="text-xl" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-150 line-clamp-1">{rest.name}</span>
                    <span className="text-[10px] text-slate-450 flex items-center gap-1 font-semibold mt-0.5">
                      <IoTimeOutline /> Ordered {rest.date}
                    </span>
                  </div>
                </div>
                <IoChevronForwardOutline className="text-slate-400 text-sm" />
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyOrdered;
