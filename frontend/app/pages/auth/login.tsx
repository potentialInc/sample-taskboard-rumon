import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { loginAction } from '~/utils/actions/auth';
import { loginSchema } from '~/utils/validations/auth';
import type { LoginFormData } from '~/utils/validations/auth';
import { useAppDispatch } from '~/redux/store/hooks';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('error') === 'google_auth_failed') {
      setGoogleError('Google login failed. Please try again.');
    }
  }, [searchParams]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors }, setError } = form;

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await loginAction(data, dispatch);
      navigate('/projects');
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Invalid credentials';
      setError('root', { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#4A90D9] select-none">
          TaskBoard
        </h1>
      </div>

      {/* Root Error */}
      {(errors.root || googleError) && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs text-red-600">{errors.root?.message || googleError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Email */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
            <Mail className="w-5 h-5" />
          </div>
          <input
            {...register('email')}
            type="email"
            placeholder="Email address"
            className="w-full h-[48px] pl-11 pr-4 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
            aria-label="Email address"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors duration-200">
              <Lock className="w-5 h-5" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full h-[48px] pl-11 pr-11 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
              aria-label="Password"
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
          {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
          <div className="flex justify-end mt-2">
            <Link to="/forgot-password" className="text-xs font-medium text-[#64748B] hover:text-[#4A90D9] transition-colors">
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[48px] mt-2 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-base font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="h-px bg-[#E5E7EB] flex-1" />
        <span className="text-xs text-[#64748B] font-medium">Or continue with</span>
        <div className="h-px bg-[#E5E7EB] flex-1" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={() => { window.location.href = `${API_BASE_URL}/auth/google`; }}
        className="w-full h-[48px] bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#1E293B] text-base font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-[#64748B]">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-[#4A90D9] font-medium hover:underline ml-0.5">Sign Up</Link>
        </p>
      </div>
    </main>
  );
}
