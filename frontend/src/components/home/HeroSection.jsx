import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AddressSelector from './AddressSelector';
import SearchBar from './SearchBar';
import NotificationCenter from '../ui/NotificationCenter';
import api from '../../services/api';
import { ShoppingCart, User as UserIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const getGreeting = () => {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good Morning, Foodie! 🌅';
  if (hr < 17) return 'Good Afternoon, Hungry? ☀️';
  return 'Good Evening, Diner! 🌙';
};

const HeroSection = ({ onLocationSelect, onSearchChange, user }) => {
  const [greeting, setGreeting] = useState(getGreeting());
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    try {
      const { data } = await api.get('/cart');
      if (data?.success && data.data?.items) {
        const count = data.data.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      }
    } catch (e) {
      // User might be unauthenticated, fail silently
    }
  };

  useEffect(() => {
    fetchCartCount();
    const interval = setInterval(fetchCartCount, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative rounded-[32px] overflow-hidden bg-gradient-to-tr from-brand-50/60 via-rose-50/40 to-brand-100/30 dark:from-[#160f0d] dark:via-[#0d0d15] dark:to-[#211411] border border-slate-200/50 dark:border-white/5 py-14 px-6 sm:px-12 flex flex-col gap-9 transition-colors duration-300">
      
      {/* Top Bar: Address, Avatar, Actions */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <AddressSelector onLocationSelect={onLocationSelect} />

        <div className="flex items-center gap-3">
          {/* Real-time Notifications Center */}
          {user && <NotificationCenter />}

          {/* Cart Shortcut Badge */}
          <Link
            to="/cart"
            className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200/40 dark:border-white/5 shadow-premium backdrop-blur-md transition-all relative active:scale-95"
            aria-label="View shopping cart"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 z-10 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-brand-500 text-white text-[9px] font-black shadow-md ring-2 ring-white dark:ring-neutral-900 animate-bounce">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Profile avatar/shortcut */}
          <Link
            to={user ? (user.role === 'customer' ? '/orders' : `/${user.role}/dashboard`) : '/login'}
            className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/10 transition-all font-black text-sm active:scale-95"
            aria-label="User Account Profile"
          >
            {user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              <UserIcon className="w-4.5 h-4.5" />
            )}
          </Link>
        </div>
      </div>

      {/* Greeting Title */}
      <div className="flex flex-col gap-3 text-center sm:text-left">
        <h1 className="text-3xl sm:text-5.55xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight select-none">
          {greeting}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold max-w-lg leading-relaxed select-none">
          Explore delicious cuisines, top-tier restaurants, and lightning-fast deliveries straight to your doorstep.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="flex justify-center sm:justify-start">
        <SearchBar onSearchChange={onSearchChange} />
      </div>
    </section>
  );
};

export default HeroSection;
