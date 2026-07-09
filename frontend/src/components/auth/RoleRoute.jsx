import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IoShieldOutline } from 'react-icons/io5';
import Button from '../ui/Button';

const RoleRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-700">
        <div className="flex flex-col items-center gap-4 w-full max-w-sm p-6 text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Checking authorizations...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(user?.role);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-700 p-6">
        <div className="max-w-md w-full text-center p-8 rounded-3xl glass-card border border-slate-200/50 dark:border-white/5 shadow-premium">
          <div className="inline-flex p-4 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 mb-6">
            <IoShieldOutline className="text-4xl" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-3">
            Access Denied
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            You do not have the required permissions to view this dashboard. If you believe this is an error, contact administration.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            variant="primary"
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default RoleRoute;
