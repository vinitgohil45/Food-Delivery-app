import React from 'react';
import { motion } from 'framer-motion';
import { IoLogoApple, IoLogoGooglePlaystore, IoPhonePortraitOutline } from 'react-icons/io5';

const DownloadApp = () => {
  return (
    <section className="relative rounded-[40px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-900 dark:to-neutral-950 border border-slate-205/30 dark:border-white/5 py-12 px-8 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-10 transition-colors duration-300">
      
      {/* Visual Mobile Mock Icon */}
      <div className="hidden md:flex items-center justify-center w-40 h-40 rounded-full bg-brand-500/10 text-brand-500 animate-bounce relative">
        <IoPhonePortraitOutline className="text-7xl" />
        <span className="absolute -top-1 right-2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
          Live Status
        </span>
      </div>

      <div className="flex flex-col gap-3 text-center md:text-left max-w-xl">
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">CraveGo Mobile Experience</span>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
          CraveGo in your pocket! Download our mobile apps
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
          Get real-time delivery tracking alerts, saved location quick-orders, and personalized AI meal suggestions on the go. Available now.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            href="#"
            className="flex items-center gap-2.5 bg-slate-900 hover:bg-black text-white py-3 px-5 rounded-2xl text-xs font-bold transition-all shadow-md"
          >
            <IoLogoApple className="text-lg" />
            <div className="flex flex-col text-left">
              <span className="text-[8px] text-white/60 font-semibold uppercase tracking-wider">Download on the</span>
              <span className="text-xs font-black tracking-tight leading-tight">App Store</span>
            </div>
          </motion.a>

          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            href="#"
            className="flex items-center gap-2.5 bg-slate-900 hover:bg-black text-white py-3 px-5 rounded-2xl text-xs font-bold transition-all shadow-md"
          >
            <IoLogoGooglePlaystore className="text-lg" />
            <div className="flex flex-col text-left">
              <span className="text-[8px] text-white/60 font-semibold uppercase tracking-wider">Get it on</span>
              <span className="text-xs font-black tracking-tight leading-tight">Google Play</span>
            </div>
          </motion.a>
        </div>
      </div>
    </section>
  );
};

export default DownloadApp;
