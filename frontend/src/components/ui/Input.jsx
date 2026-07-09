import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  placeholder,
  className = '',
  icon = null,
  rightIcon = null,
  ...props
}, ref) => {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && (
        <label className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 select-none pl-0.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center group">
        {icon && (
          <div className="absolute left-4 text-slate-400 dark:text-neutral-500 text-lg pointer-events-none group-focus-within:text-brand-500 transition-colors duration-300">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={cn(
            "w-full py-3.5 text-sm rounded-2xl bg-white/50 dark:bg-white/5 border text-slate-800 dark:text-slate-100 placeholder-slate-400/80 dark:placeholder-neutral-500 focus:outline-none focus:ring-4 transition-all duration-300 backdrop-blur-sm",
            icon ? 'pl-12' : 'pl-4.5',
            rightIcon ? 'pr-12' : 'pr-4.5',
            error
              ? 'border-rose-500/40 focus:border-rose-500 focus:ring-rose-500/10'
              : 'border-slate-200/70 dark:border-white/5 hover:border-slate-300/80 dark:hover:border-white/10 focus:border-brand-500/50 focus:ring-brand-500/10 focus:bg-white dark:focus:bg-black/40'
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 text-slate-400 dark:text-neutral-500 text-lg flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs font-medium text-rose-500 mt-0.5 pl-1 animate-fadeIn">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
