import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Timeline = ({
  steps = [],
  currentStepIndex = 0,
  className = '',
}) => {
  return (
    <div className={cn("flex flex-col gap-8 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-neutral-800/80", className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex;
        const isActive = idx === currentStepIndex;

        return (
          <div key={idx} className="relative flex flex-col gap-1.5 text-left">
            {/* Step dot */}
            <div className="absolute -left-[27px] top-1.5 flex items-center justify-center">
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-3.5 h-3.5 rounded-full bg-brand-500 shadow-md shadow-brand-500/20"
                />
              ) : isActive ? (
                <motion.div
                  animate={{
                    scale: [1, 1.25, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                  }}
                  className="w-3.5 h-3.5 rounded-full bg-brand-500 ring-4 ring-brand-500/20"
                />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-slate-300 dark:bg-neutral-700" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex items-center gap-2">
              <h4 className={cn(
                "text-sm font-semibold transition-all duration-300",
                isActive ? "text-brand-500" : isCompleted ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-neutral-500"
              )}>
                {step.title}
              </h4>
              {step.time && (
                <span className="text-xs text-slate-400 dark:text-neutral-500 font-medium">
                  {step.time}
                </span>
              )}
            </div>
            {step.description && (
              <p className={cn(
                "text-xs transition-all duration-300",
                isActive || isCompleted ? "text-slate-500 dark:text-slate-400" : "text-slate-400/70 dark:text-neutral-600"
              )}>
                {step.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
