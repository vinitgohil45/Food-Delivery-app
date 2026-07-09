import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const Dropdown = ({
  trigger,
  items = [],
  align = 'right',
  className = '',
  triggerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignments = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top',
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={cn("cursor-pointer", triggerClassName)}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={cn(
              "absolute mt-2.5 w-56 rounded-2xl glass-card-premium p-1.5 z-50 shadow-xl focus:outline-none",
              alignments[align]
            )}
          >
            <div className="flex flex-col gap-1">
              {items.map((item, idx) => {
                if (item.divider) {
                  return <div key={idx} className="h-px bg-slate-100 dark:bg-white/5 my-1" />;
                }
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full px-3.5 py-2.5 text-sm rounded-xl transition-all duration-200 text-left font-medium select-none outline-none",
                      item.danger
                        ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                    )}
                  >
                    {item.icon && <span className="mr-2.5 text-base flex items-center justify-center">{item.icon}</span>}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
