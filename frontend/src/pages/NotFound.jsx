import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center p-8 rounded-[32px] glass-card border border-slate-200/50 dark:border-white/5 shadow-premium flex flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-9xl font-extrabold tracking-widest text-slate-200 dark:text-neutral-800 select-none relative"
        >
          404
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold tracking-widest text-brand-500 uppercase select-text">
            Page Not Found
          </span>
        </motion.div>

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Lost in Transit?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            The page you are looking for does not exist or has been relocated to another address.
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex-1"
          >
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="primary"
            className="flex-1"
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
