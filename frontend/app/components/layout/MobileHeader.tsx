import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { cn } from '~/lib/utils';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  rightContent?: ReactNode;
  className?: string;
}

export default function MobileHeader({ title, showBack = false, backTo, rightContent, className }: MobileHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={cn(
      'h-[56px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 shrink-0 z-20',
      className
    )}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center text-[#1E293B] active:opacity-70 transition-opacity"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-lg font-semibold tracking-tight text-[#1E293B] truncate">{title}</h2>
      </div>
      {rightContent && (
        <div className="flex items-center gap-2 shrink-0">
          {rightContent}
        </div>
      )}
    </header>
  );
}
