import React, { Component } from 'react';
import { IoWarningOutline } from 'react-icons/io5';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-700 p-6">
          <div className="max-w-md w-full text-center p-8 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium">
            <div className="inline-flex p-4 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 mb-6">
              <IoWarningOutline className="text-4xl" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-3">
              Something went wrong
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              An unexpected error occurred while loading this page. Please try reloading the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
