import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { resetPasswordAction } from '~/utils/actions/auth';
import { resetPasswordSchema } from '~/utils/validations/auth';
import type { ResetPasswordFormData } from '~/utils/validations/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const otpFromUrl = searchParams.get('otp') || '';

  const [otp, setOtp] = useState(otpFromUrl);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors }, setError, watch } = form;
  const password = watch('password');
  const meetsMinLength = password ? password.length >= 8 : false;

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (isSubmitting) return;

    if (!email) {
      setError('root', { message: 'Missing email parameter. Please use the link from your email.' });
      return;
    }

    if (!otp || otp.length !== 4) {
      setError('root', { message: 'Please enter the 4-digit OTP code from your email.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordAction({ ...data, email, otp });
      setShowSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Password reset failed';
      setError('root', { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-[80px] h-[80px] rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-base font-medium text-[#1E293B] mb-2">Password reset successfully</h2>
          <p className="text-xs text-[#64748B] flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Redirecting to login...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
      <h1 className="text-2xl font-semibold text-[#1E293B] tracking-tight mb-6">
        Create new password
      </h1>

      {/* Root Error */}
      {errors.root && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs text-red-600">{errors.root.message}</p>
        </div>
      )}

      {/* Missing Email Warning */}
      {!email && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-600">No email parameter found. Please use the link from your email.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* OTP Code */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#1E293B]">OTP Code</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter 4-digit OTP"
              className="w-full h-[48px] pl-11 pr-4 text-base tracking-[0.3em] bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
              aria-label="OTP code"
            />
          </div>
          <p className="text-xs text-[#64748B]">Enter the 4-digit code sent to your email</p>
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
              <Lock className="w-5 h-5" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              className="w-full h-[48px] pl-11 pr-11 text-base bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
              aria-label="New password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${meetsMinLength ? 'text-emerald-500' : 'text-[#64748B]'}`}>
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Minimum 8 characters</span>
          </div>
          {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
              <Lock className="w-5 h-5" />
            </div>
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              className="w-full h-[48px] pl-11 pr-11 text-base bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
              aria-label="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.confirmPassword.message}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full h-[48px] mt-2 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-base font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
        </button>
      </form>
    </main>
  );
}
