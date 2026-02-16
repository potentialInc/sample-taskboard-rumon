import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { authService } from '~/services/httpServices/authService';

type VerifyState = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'error');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid or missing verification token.');
      setState('error');
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => setState('success'))
      .catch(() => {
        setErrorMessage('Verification failed. The link may have expired.');
        setState('error');
      });
  }, [token]);

  return (
    <main className="w-full max-w-[402px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
      <div className="flex flex-col items-center text-center py-4">
        {state === 'loading' && (
          <>
            <div className="w-[80px] h-[80px] rounded-full bg-[#4A90D9]/10 flex items-center justify-center mb-6 text-[#4A90D9]">
              <Loader2 className="w-12 h-12 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E293B] tracking-tight mb-2">
              Verifying your email...
            </h2>
            <p className="text-sm text-[#64748B]">Please wait a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-[80px] h-[80px] rounded-full bg-emerald-500/15 flex items-center justify-center mb-6 text-emerald-500">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E293B] tracking-tight mb-2">
              Email verified successfully
            </h2>
            <p className="text-sm text-[#64748B] mb-8">
              Your account is now active. You can log in.
            </p>
            <Link
              to="/login"
              className="h-[48px] px-8 bg-[#4A90D9] hover:bg-[#3B82F6] text-white text-base font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center"
            >
              Go to Login
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-[80px] h-[80px] rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E293B] tracking-tight mb-2">
              Verification failed
            </h2>
            <p className="text-sm text-[#64748B] mb-8">
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
            <Link
              to="/login"
              className="text-base font-medium text-[#4A90D9] hover:text-[#3B82F6] flex items-center gap-2 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Back to Login
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
