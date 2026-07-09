import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { resetPasswordSchema } from '../utils/validation';
import { Lock } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  useEffect(() => {
    if (!email || !otp) {
      toast.error('Session expired. Please restart the forgot password request.');
      navigate('/forgot-password');
    }
  }, [email, otp, navigate, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        password: data.password,
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Password updated successfully!');
        navigate('/login');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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
            Reset Password
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 leading-relaxed">
            Set your new login password. All other active sessions will be terminated for security.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            error={errors.password}
            {...register('password')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />

          <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
            Reset Password
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
