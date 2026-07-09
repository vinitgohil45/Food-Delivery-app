import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Card = ({
  children,
  className = '',
  hoverEffect = true,
  onClick,
  ...props
}) => {
  const CardWrapper = onClick ? motion.button : motion.div;
  const isClickable = typeof onClick === 'function';

  return (
    <CardWrapper
      whileHover={hoverEffect ? { y: -4, scale: 1.01 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        'glass-card-premium p-6 rounded-[24px] text-left w-full transition-all duration-300 relative overflow-hidden shine-hover',
        isClickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/40 select-none' : '',
        hoverEffect ? 'hover:shadow-premium-hover hover:border-slate-300/40 dark:hover:border-white/15' : '',
        className
      )}
      {...props}
    >
      {children}
    </CardWrapper>
  );
};

export default Card;
