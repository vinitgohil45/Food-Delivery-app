import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { otpSchema } from '../utils/validation';
import { ShieldCheck } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';

const VerifyOTP = () => {
  const { checkAuthStatus } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = location.state?.email || '';
  const purpose = location.state?.purpose || 'email_verification';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onSubmit = async (data) => {
    if (!email) {
      toast.error('Email context is missing. Please restart the request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: data.otp,
        purpose,
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'OTP verified successfully!');
        
        if (purpose === 'email_verification') {
          await checkAuthStatus();
          navigate('/');
        } else if (purpose === 'password_reset') {
          navigate('/reset-password', { state: { email, otp: data.otp } });
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed. Please try again.';
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
          <div className="inline-flex p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/20 text-brand-500 self-center text-3xl mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Verify OTP
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 max-w-[280px] mx-auto leading-relaxed">
            Enter the 6-digit code sent to <span className="font-bold text-slate-600 dark:text-slate-200">{email || 'your email'}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
          <Input
            label="Verification Code"
            type="text"
            placeholder="123456"
            maxLength={6}
            error={errors.otp}
            {...register('otp')}
          />

          <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
            Verify Code
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 font-medium">
          Didn't receive code?{' '}
          <button
            onClick={() => toast.info('A new OTP has been sent (simulated)')}
            className="font-bold text-brand-500 hover:text-brand-600 transition-colors cursor-pointer"
          >
            Resend OTP
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default VerifyOTP;
