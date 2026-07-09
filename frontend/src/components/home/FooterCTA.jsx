import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoArrowForwardOutline } from 'react-icons/io5';

const FooterCTA = () => {
  return (
    <div className="relative rounded-[40px] overflow-hidden bg-gradient-to-tr from-rose-500 to-brand-500 text-white p-8 sm:p-12 text-center flex flex-col items-center gap-6 shadow-premium my-6">
      
      {/* Visual background accents */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-xl flex flex-col gap-3"
      >
        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit self-center">
          Partner Opportunities
        </span>
        <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          Want to double your restaurant sales?
        </h3>
        <p className="text-white/80 text-xs sm:text-sm font-semibold leading-relaxed">
          List your kitchen on CraveGo today to reach thousands of local diners. We handle the ordering, logistics, and delivery so you can focus on building amazing menus.
        </p>
      </motion.div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative z-10">
        <Link
          to="/register?role=restaurant_owner"
          className="inline-flex items-center gap-2 bg-white text-brand-500 hover:bg-neutral-50 px-6 py-3.5 rounded-2xl text-xs font-black shadow-md transition-all"
        >
          <span>Join as Restaurant Partner</span>
          <IoArrowForwardOutline className="text-sm" />
        </Link>
      </motion.div>
    </div>
  );
};

export default FooterCTA;
