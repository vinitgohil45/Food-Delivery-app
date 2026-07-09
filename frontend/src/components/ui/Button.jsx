import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon = null,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95';

  const variants = {
    primary: 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 dark:shadow-brand-500/5 dark:hover:shadow-brand-500/20 border border-brand-500/20',
    secondary: 'bg-white/60 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 backdrop-blur-md border border-slate-200/40 dark:border-white/5 shadow-premium dark:shadow-glass-dark',
    outline: 'border border-slate-200/60 dark:border-neutral-800/80 hover:bg-slate-100/50 dark:hover:bg-neutral-800/40 text-slate-700 dark:text-slate-200 backdrop-blur-sm',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg shadow-rose-500/15 border border-rose-500/20',
    ghost: 'hover:bg-slate-100/60 dark:hover:bg-neutral-900/40 text-slate-600 dark:text-slate-300',
  };

  const sizes = {
    sm: 'text-xs py-2 px-4 rounded-xl',
    md: 'text-sm py-3 px-6 rounded-2xl',
    lg: 'text-base py-4 px-8 rounded-2xl',
  };

  return (
    <motion.button
      whileTap={!disabled && !isLoading ? { scale: 0.96 } : {}}
      whileHover={!disabled && !isLoading ? { scale: 1.02, y: -1 } : {}}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="mr-2 inline-flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
