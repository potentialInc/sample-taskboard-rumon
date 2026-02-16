import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { adminService } from '~/services/httpServices/adminService';

export default function AuthLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }

    adminService.checkLogin()
      .then(() => {
        navigate('/', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('token');
        setChecking(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90D9]" />
      </div>
    );
  }

  return (
    <div className="relative">
      <Outlet />
    </div>
  );
}