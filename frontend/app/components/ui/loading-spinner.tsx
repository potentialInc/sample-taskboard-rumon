import { Loader2 } from 'lucide-react';
import { cn } from '~/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-[#4A90D9]', sizeMap[size])} />
      {text && <span className="text-sm text-[#64748B]">{text}</span>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}
