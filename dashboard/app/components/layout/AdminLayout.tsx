import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router';
import AdminSidebar, { SIDEBAR_STORAGE_KEY } from '~/components/layout/AdminSidebar';
import { adminService } from '~/services/httpServices/adminService';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const checkedRef = useRef(false);

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    adminService.checkLogin()
      .then(() => {
        setAuthChecked(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  if (!authChecked) {
    return (
      <div className="bg-[#F9FAFB] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90D9]" />
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] text-[#1E293B] flex min-h-screen overflow-hidden">
      <AdminSidebar collapsed={collapsed} onToggle={handleToggle} />
      <main
        className={`flex-1 h-screen overflow-y-auto custom-scrollbar bg-[#F9FAFB] p-8 transition-[margin-left] duration-300 ease-in-out ${
          collapsed ? 'ml-[64px]' : 'ml-[240px]'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
