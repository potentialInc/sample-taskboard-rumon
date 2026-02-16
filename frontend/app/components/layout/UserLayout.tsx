import { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useAppSelector, useAppDispatch } from '~/redux/store/hooks';
import { setUser, logout } from '~/redux/features/authSlice';
import { authService } from '~/services/httpServices/authService';
import { PageLoader } from '~/components/ui/loading-spinner';

export default function UserLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const checkedRef = useRef(false);

  // Verify session once on mount
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    authService.checkLogin()
      .then((userData) => {
        dispatch(setUser(userData));
      })
      .catch(() => {
        dispatch(logout());
        navigate('/login', { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthenticated && !user) {
    return (
      <div className="bg-[#F9FAFB] min-h-screen flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] text-[#1E293B] flex justify-center min-h-screen w-full">
      <Outlet />
    </div>
  );
}
