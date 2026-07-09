import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { loginSchema } from '../utils/validation';
import { Mail, Lock, EyeOff, Eye } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const result = await login(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || 'Logged in successfully!');
      
      const sessionUser = JSON.parse(localStorage.getItem('user')) || {};
      const userRole = sessionUser.role || result.data?.user?.role || 'customer';

      if (userRole === 'customer') {
        navigate('/');
      } else {
        navigate(`/${userRole}/dashboard`);
      }
    } else {
      toast.error(result.message || 'Authentication failed');
    }
  };

  const fillCredentials = (email, password) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[75vh] flex items-center justify-center py-8 px-4"
    >
      <div className="max-w-md w-full p-8 rounded-[28px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-2xl flex flex-col gap-6 relative overflow-hidden shine-hover">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Welcome Back
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500">
            Sign in to manage your orders and cravings
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
            Sign In
          </Button>
        </form>

        {/* Demo Roles Credentials */}
        <div className="border-t border-slate-100 dark:border-white/5 pt-5 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest text-center select-none">
            Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => fillCredentials('customer@cravego.com', 'password123')}
              className="p-3 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-center select-none cursor-pointer active:scale-95"
            >
              Customer Account
            </button>
            <button
              onClick={() => fillCredentials('owner@cravego.com', 'password123')}
              className="p-3 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-center select-none cursor-pointer active:scale-95"
            >
              Restaurant Owner
            </button>
            <button
              onClick={() => fillCredentials('driver@cravego.com', 'password123')}
              className="p-3 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-center select-none cursor-pointer active:scale-95"
            >
              Delivery Partner
            </button>
            <button
              onClick={() => fillCredentials('admin@cravego.com', 'password123')}
              className="p-3 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-center select-none cursor-pointer active:scale-95"
            >
              System Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 font-medium">
          New to CraveGo?{' '}
          <Link
            to="/register"
            className="font-bold text-brand-500 hover:text-brand-600 transition-colors"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
