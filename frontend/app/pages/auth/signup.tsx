import { useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, User, Mail, Briefcase, Lock, Shield, Camera, Info, Loader2 } from 'lucide-react';
import { registerAction } from '~/utils/actions/auth';
import { registerSchema } from '~/utils/validations/auth';
import type { RegisterFormData } from '~/utils/validations/auth';

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      jobTitle: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false as unknown as true,
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors }, setError, watch } = form;
  const password = watch('password');
  const passwordLength = password?.length ?? 0;

  const onSubmit = async (data: RegisterFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await registerAction(data);
      navigate('/login');
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Registration failed';
      setError('root', { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 flex flex-col relative my-auto">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2 text-[#4A90D9]">
          <span className="text-xl font-bold tracking-tight text-[#1E293B]">TaskBoard</span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1E293B] tracking-tight">Create an account</h1>
        <p className="text-sm text-[#64748B] mt-1">Start managing your tasks effectively</p>
      </div>

      {/* Root Error */}
      {errors.root && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs text-red-600">{errors.root.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center justify-center gap-2 mb-2">
          <div className="relative group">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-[80px] h-[80px] rounded-full bg-[#F1F5F9] border border-[#E5E7EB] flex items-center justify-center cursor-pointer hover:bg-[#E2E8F0] transition-colors relative overflow-hidden group-hover:border-[#4A90D9]"
              aria-label="Upload profile photo"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-[#64748B] group-hover:text-[#4A90D9] transition-colors" />
              )}
            </button>
          </div>
          <span className="text-xs text-[#64748B]">Tap to upload photo (Optional)</span>
        </div>

        {/* Full Name */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
            <User className="w-5 h-5" />
          </div>
          <input
            {...register('fullName')}
            type="text"
            placeholder="Full name"
            className="w-full h-[48px] pl-11 pr-4 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
            aria-label="Full name"
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.fullName.message}</p>}
        </div>

        {/* Email */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
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

        {/* Job Title */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
            <Briefcase className="w-5 h-5" />
          </div>
          <input
            {...register('jobTitle')}
            type="text"
            placeholder="Job title"
            className="w-full h-[48px] pl-11 pr-20 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
            aria-label="Job title (optional)"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-[10px] uppercase font-medium text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded">Optional</span>
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
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
          <div className={`flex items-center gap-1 text-xs transition-colors pl-1 ${
            passwordLength === 0 ? 'text-[#64748B]' : passwordLength < 8 ? 'text-amber-500' : 'text-emerald-500'
          }`}>
            <Info className="w-3 h-3" />
            <span>Minimum 8 characters</span>
          </div>
          {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#4A90D9] transition-colors">
            <Shield className="w-5 h-5" />
          </div>
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            className="w-full h-[48px] pl-11 pr-11 text-sm bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all duration-200"
            aria-label="Confirm password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#1E293B] transition-colors"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword.message}</p>}
        </div>

        {/* Terms Checkbox */}
        <div className="mt-2">
          <label className="flex items-start gap-3 cursor-pointer group select-none">
            <input
              {...register('agreeToTerms')}
              type="checkbox"
              className="mt-0.5 w-5 h-5 text-[#4A90D9] border-[#E5E7EB] rounded focus:ring-2 focus:ring-[#4A90D9]/20"
            />
            <span className="text-sm text-[#64748B] leading-tight">
              I agree to the <a href="#" className="text-[#4A90D9] hover:underline hover:text-[#3B82F6]">Terms of Service</a> and <a href="#" className="text-[#4A90D9] hover:underline hover:text-[#3B82F6]">Privacy Policy</a>.
            </span>
          </label>
          {errors.agreeToTerms && <p className="text-xs text-red-500 mt-1 ml-8">{errors.agreeToTerms.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[48px] mt-4 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-sm font-semibold rounded-md shadow-sm hover:shadow active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center border-t border-[#E5E7EB] pt-6">
        <p className="text-sm text-[#64748B]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#4A90D9] font-medium hover:text-[#3B82F6] ml-1 transition-colors">Log In</Link>
        </p>
      </div>
    </main>
  );
}
