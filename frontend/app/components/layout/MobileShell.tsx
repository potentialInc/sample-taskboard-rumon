import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

interface MobileShellProps {
  children: ReactNode;
  className?: string;
}

export default function MobileShell({ children, className }: MobileShellProps) {
  return (
    <div className={cn(
      'w-full max-w-[402px] bg-[#F9FAFB] relative flex flex-col h-screen',
      'md:h-[90vh] md:my-auto md:border md:border-[#E5E7EB] md:rounded-[24px] md:shadow-2xl overflow-hidden',
      className
    )}>
      {children}
    </div>
  );
}
