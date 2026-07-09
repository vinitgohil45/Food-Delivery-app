import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { registerSchema } from '../utils/validation';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';

const Register = () => {
  const { register: signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', role: 'customer' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const result = await signup(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || 'Verification code sent!');
      navigate('/verify-otp', { state: { email: data.email, purpose: 'email_verification' } });
    } else {
      toast.error(result.message || 'Registration failed');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[85vh] flex items-center justify-center py-8 px-4"
    >
      <div className="max-w-md w-full p-8 rounded-[28px] glass-card-premium border border-slate-200/50 dark:border-white/5 shadow-2xl flex flex-col gap-6 relative overflow-hidden shine-hover">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Create Account
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500">
            Join CraveGo to order delicious food and track deliveries
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            icon={<User className="w-4 h-4" />}
            error={errors.name}
            {...register('name', { required: 'Name is required' })}
          />

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
            label="Phone Number"
            type="tel"
            placeholder="9876543210"
            icon={<Phone className="w-4 h-4" />}
            error={errors.phone}
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Phone number must be exactly 10 digits',
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            error={errors.password}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          {/* Role selector dropdown */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 select-none pl-0.5">
              Register As
            </label>
            <select
              className="w-full py-3.5 px-4.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 transition-all duration-300 backdrop-blur-sm"
              {...register('role', { required: 'Please select a role' })}
            >
              <option value="customer">Customer</option>
              <option value="restaurant_owner">Restaurant Owner</option>
              <option value="delivery_partner">Delivery Partner</option>
            </select>
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
            Create Account <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 font-medium">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-brand-500 hover:text-brand-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
