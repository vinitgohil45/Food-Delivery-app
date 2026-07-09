import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { cn } from '../utils/cn';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white dark:bg-[#050508]/80 border-t border-slate-200/40 dark:border-white/5 transition-all duration-300 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-brand-500 to-rose-500 bg-clip-text text-transparent select-none">
              CraveGo
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs font-medium">
              Order fresh ingredients and favorite food from top-rated restaurants nearby. Premium quality, lightning-fast delivery.
            </p>
            <div className="flex gap-4 text-slate-400 dark:text-neutral-500 mt-2.5">
              <a href="#" className="hover:text-brand-500 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" className="hover:text-brand-500 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="hover:text-brand-500 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-5">
              CraveGo
            </h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <li><Link to="/" className="hover:text-brand-500 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-brand-500 transition-colors">Contact</Link></li>
              <li><Link to="/careers" className="hover:text-brand-500 transition-colors">Careers</Link></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Partner With Us</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-5">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <li><a href="#" className="hover:text-brand-500 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Refund Policy</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Cookie Settings</a></li>
            </ul>
          </div>

          {/* Mobile Apps */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-5">
              Install App
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="#"
                className="flex items-center justify-center gap-2 border border-slate-200/50 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 py-3 px-4 rounded-2xl text-xs text-slate-700 dark:text-slate-300 font-semibold transition-all duration-300 active:scale-95"
              >
                App Store
              </a>
              <a
                href="#"
                className="flex items-center justify-center gap-2 border border-slate-200/50 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 py-3 px-4 rounded-2xl text-xs text-slate-700 dark:text-slate-300 font-semibold transition-all duration-300 active:scale-95"
              >
                Google Play
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-14 pt-8 border-t border-slate-100 dark:border-white/5 text-xs text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} CraveGo Technologies. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-slate-400 hover:text-brand-500 transition-all duration-300 mt-4 sm:mt-0 font-semibold cursor-pointer active:scale-95 hover:-translate-y-0.5"
          >
            <span>Back to top</span>
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-brand-500/10 hover:text-brand-500 transition-colors">
              <ArrowUp className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
