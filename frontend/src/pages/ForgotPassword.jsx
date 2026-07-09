import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { forgotPasswordSchema } from '../utils/validation';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      if (response.data?.success) {
        toast.success(response.data.message || 'Reset code sent successfully!');
        navigate('/verify-otp', { state: { email: data.email, purpose: 'password_reset' } });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit request. Please try again.';
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
        <div className="flex flex-col gap-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-500 transition-colors self-start mb-2 group cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" /> Back to Sign In
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Forgot Password
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 leading-relaxed">
            Enter your email address and we'll send you a 6-digit code to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email}
            {...register('email')}
          />

          <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
            Send Reset Code
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
