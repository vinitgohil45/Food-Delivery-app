import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Sun, 
  Moon, 
  ShoppingCart, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Search, 
  Percent,
  Home as HomeIcon
} from 'lucide-react';
import Button from '../components/ui/Button';
import Dropdown from '../components/ui/Dropdown';
import api from '../services/api';
import { cn } from '../utils/cn';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { label: 'My Profile', icon: <User className="w-4 h-4" />, onClick: () => navigate('/profile') },
    { divider: true },
    { label: 'Logout', icon: <LogOut className="w-4 h-4" />, onClick: handleLogout, danger: true }
  ];

  const activeLinkClass = (path) => 
    location.pathname === path 
      ? "text-brand-500 font-semibold relative after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[3px] after:bg-brand-500 after:rounded-full after:shadow-[0_0_8px_rgba(255,75,43,0.5)]" 
      : "text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 font-medium";

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/40 dark:border-white/5 bg-white/70 dark:bg-[#050508]/75 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16.5">
          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="h-9.5 w-9.5 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-brand-500/10 group-hover:scale-105 transition-transform duration-300 border border-brand-500/20">
                C
              </span>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-500 to-rose-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                CraveGo
              </span>
            </Link>
          </div>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-7">
            <Link to="/" className={cn("text-sm transition-all duration-200", activeLinkClass('/'))}>
              Home
            </Link>
            <Link to="/search" className={cn("text-sm transition-all duration-200", activeLinkClass('/search'))}>
              Search
            </Link>
            <Link to="/offers" className={cn("text-sm transition-all duration-200", activeLinkClass('/offers'))}>
              Offers
            </Link>
          </div>

          {/* Action Elements */}
          <div className="hidden md:flex items-center gap-4.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-all duration-300 cursor-pointer active:scale-95"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-all duration-300 active:scale-95"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white dark:ring-[#050508] animate-bounce">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Session buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Dropdown
                  align="right"
                  trigger={
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors py-1.5 px-3 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-white/5 border border-transparent hover:border-slate-200/40 dark:hover:border-white/5">
                      <User className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-semibold max-w-[100px] truncate">{user?.name}</span>
                    </div>
                  }
                  items={user?.role === 'customer' ? menuItems : [
                    { label: 'Dashboard', icon: <HomeIcon className="w-4 h-4" />, onClick: () => navigate(`/${user?.role}/dashboard`) },
                    { divider: true },
                    { label: 'Logout', icon: <LogOut className="w-4 h-4" />, onClick: handleLogout, danger: true }
                  ]}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex items-center gap-2.5 md:hidden">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#050508]">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Burger toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-white/5 bg-white/95 dark:bg-[#050508]/95 backdrop-blur-xl px-4 py-5 flex flex-col gap-3.5 shadow-2xl">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-semibold py-2.5 px-4 hover:bg-slate-100/50 dark:hover:bg-white/5 rounded-2xl text-slate-700 dark:text-slate-300"
          >
            Home
          </Link>
          <Link
            to="/search"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-semibold py-2.5 px-4 hover:bg-slate-100/50 dark:hover:bg-white/5 rounded-2xl text-slate-700 dark:text-slate-300"
          >
            Search Food
          </Link>
          <Link
            to="/offers"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-semibold py-2.5 px-4 hover:bg-slate-100/50 dark:hover:bg-white/5 rounded-2xl text-slate-700 dark:text-slate-300"
          >
            Offers
          </Link>

          <hr className="border-slate-100 dark:border-white/5" />

          {isAuthenticated ? (
            <div className="flex flex-col gap-3.5">
              <Link
                to={user?.role === 'customer' ? '/profile' : `/${user?.role}/dashboard`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-sm font-semibold py-2 px-4 text-slate-700 dark:text-slate-300"
              >
                <User className="w-5 h-5 text-slate-400" />
                <span>{user?.name} (Dashboard)</span>
              </Link>
              <Button onClick={handleLogout} variant="outline" className="w-full">
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
