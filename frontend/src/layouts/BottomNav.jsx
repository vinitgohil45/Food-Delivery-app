import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Percent, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { cn } from '../utils/cn';

const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [cartItemsCount, setCartItemsCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/cart')
        .then(res => {
          if (res.data?.success && res.data.data?.items) {
            setCartItemsCount(res.data.data.items.reduce((acc, item) => acc + item.quantity, 0));
          }
        })
        .catch(() => {});
    } else {
      setCartItemsCount(0);
    }
  }, [isAuthenticated, location.pathname]);

  const navItems = [
    { label: 'Home', icon: <Home className="w-5 h-5" />, path: '/' },
    { label: 'Search', icon: <Search className="w-5 h-5" />, path: '/search' },
    { label: 'Offers', icon: <Percent className="w-5 h-5" />, path: '/offers' },
    { label: 'Cart', icon: <ShoppingCart className="w-5 h-5" />, path: '/cart', badge: true },
    { label: 'Profile', icon: <User className="w-5 h-5" />, path: '/profile' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#050508]/85 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 py-2 px-3 shadow-2xl flex justify-around items-center">
      {navItems.map((item, idx) => {
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={idx}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all duration-300 relative",
              isActive 
                ? "text-brand-500 font-semibold" 
                : "text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300"
            )}
          >
            <div className="relative">
              {item.icon}
              {item.badge && cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-[#050508]">
                  {cartItemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>

            {/* Glowing active indicator dot */}
            {isActive && (
              <span className="absolute bottom-0 w-1 h-1 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(255,75,43,0.8)]" />
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
