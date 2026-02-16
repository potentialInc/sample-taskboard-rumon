import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useAppSelector } from '~/redux/store/hooks';
import { authService } from '~/services/httpServices/authService';
import { PageLoader } from '~/components/ui/loading-spinner';

export default function AuthLayout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [checking, setChecking] = useState(true);
  const checkedRef = useRef(false);

  // Redirect if already authenticated in Redux (e.g. after login)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/projects', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check session once on mount
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    authService.checkLogin()
      .then(() => {
        navigate('/projects', { replace: true });
      })
      .catch(() => {
        setChecking(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking && !isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center p-4 text-[#1E293B]">
      <Outlet />
    </div>
  );
}
