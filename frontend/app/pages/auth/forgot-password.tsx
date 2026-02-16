import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { forgotPasswordAction } from '~/utils/actions/auth';
import { forgotPasswordSchema } from '~/utils/validations/auth';
import type { ForgotPasswordFormData } from '~/utils/validations/auth';

export default function ForgotPassword() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors }, setError } = form;

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await forgotPasswordAction(data);
      setSubmittedEmail(data.email);
      setShowSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to send reset link';
      setError('root', { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-[80px] h-[80px] rounded-full bg-emerald-500/15 flex items-center justify-center mb-6 text-emerald-500">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-semibold text-[#1E293B] tracking-tight mb-2">
            OTP code sent to your email
          </h2>
          <p className="text-sm text-[#64748B] mb-6">
            Check your inbox and spam folder for the 4-digit code
          </p>
          <Link
            to={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
            className="w-full h-[48px] bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-base font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center mb-4"
          >
            Enter OTP Code
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium text-[#64748B] hover:text-[#4A90D9] flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
      {/* Back Arrow */}
      <Link
        to="/login"
        className="inline-flex items-center justify-center w-[44px] h-[44px] -ml-2 mb-2 text-[#64748B] hover:text-[#1E293B] rounded-full hover:bg-gray-50 transition-colors"
        aria-label="Back to Login"
      >
        <ArrowLeft className="w-6 h-6" />
      </Link>

      <h1 className="text-2xl font-semibold text-[#1E293B] tracking-tight mb-2">
        Reset your password
      </h1>
      <p className="text-base text-[#64748B] mb-6">
        Enter your email and we&apos;ll send a reset link
      </p>

      {/* Root Error */}
      {errors.root && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs text-red-600">{errors.root.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
            <Mail className="w-5 h-5" />
          </div>
          <input
            {...register('email')}
            type="email"
            placeholder="Email address"
            className="w-full h-[48px] pl-11 pr-4 text-base bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
            aria-label="Email address"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[48px] mt-2 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-base font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
        </button>
      </form>
    </main>
  );
}
