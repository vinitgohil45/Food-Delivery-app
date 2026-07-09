import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import Card from './Card';

const StatsCard = ({
  title,
  value,
  subtitle,
  trend, // { type: 'up' | 'down', value: string }
  icon,
  sparkline = [30, 45, 35, 60, 50, 75, 80], // default SVG path helper values
  className = '',
}) => {
  const isUp = trend?.type === 'up';

  // Compute simple SVG polyline path for sparkline visualization
  const width = 100;
  const height = 30;
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline);
  const range = max - min || 1;
  const points = sparkline
    .map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Card className={cn("relative overflow-hidden group hover:glow-brand transition-all duration-300", className)}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wide text-slate-400 dark:text-neutral-500 uppercase select-none">
            {title}
          </span>
          <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-1 flex items-baseline gap-1">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              {value}
            </motion.span>
          </h3>
        </div>

        {icon && (
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-neutral-800/60 text-slate-600 dark:text-slate-300 group-hover:scale-110 group-hover:bg-brand-500/10 group-hover:text-brand-500 transition-all duration-300">
            {icon}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-5">
        <div className="flex flex-col gap-0.5">
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-bold flex items-center justify-center rounded-lg px-1.5 py-0.5",
                isUp 
                  ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20" 
                  : "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20"
              )}>
                {isUp ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500">
                {subtitle || 'vs last month'}
              </span>
            </div>
          )}
        </div>

        {/* Premium SVG Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <div className="w-24 h-8 overflow-hidden select-none pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
              <polyline
                fill="none"
                stroke={isUp ? '#10b981' : '#f43f5e'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
