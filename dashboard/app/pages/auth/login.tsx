import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@iconify/react';
import { adminService } from '~/services/httpServices/adminService';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await adminService.adminLogin({ email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-[#4A90D9] rounded-lg flex items-center justify-center text-white font-bold text-lg tracking-tighter mb-3">
            TB
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">TaskBoard Admin</h1>
          <p className="text-sm text-[#64748B] mt-1">Sign in to your admin account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <Icon icon="solar:danger-circle-linear" className="text-red-500 flex-shrink-0" width={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#1E293B]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Icon icon="solar:letter-linear" width={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full h-[44px] pl-10 pr-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[#1E293B]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Icon icon="solar:lock-keyhole-linear" width={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full h-[44px] pl-10 pr-11 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  tabIndex={-1}
                >
                  <Icon
                    icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
                    width={18}
                  />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-[44px] flex items-center justify-center gap-2 bg-[#4A90D9] hover:bg-[#3b82f6] text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-60 mt-1"
            >
              {loading ? (
                <>
                  <Icon icon="solar:refresh-linear" width={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#94A3B8] mt-6">
          Admin access only. Contact your administrator for access.
        </p>
      </div>
    </div>
  );
}
