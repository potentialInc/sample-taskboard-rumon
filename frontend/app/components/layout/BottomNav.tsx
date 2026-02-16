import { useLocation, useNavigate } from 'react-router';
import { LayoutGrid, CheckSquare, Bell, UserCircle } from 'lucide-react';
import { cn } from '~/lib/utils';

const navItems = [
  { icon: LayoutGrid, label: 'Projects', path: '/projects' },
  { icon: CheckSquare, label: 'My Tasks', path: '/my-tasks' },
  { icon: Bell, label: 'Inbox', path: '/notifications' },
  { icon: UserCircle, label: 'Profile', path: '/profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="absolute bottom-0 w-full h-[56px] bg-white border-t border-[#E5E7EB] flex items-center justify-between px-2 z-20">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors',
              isActive ? 'text-[#4A90D9]' : 'text-[#94A3B8] hover:text-[#64748B]'
            )}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
