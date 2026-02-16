import { cn } from '~/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  error: 'bg-red-50 text-red-600',
  info: 'bg-blue-50 text-blue-600',
  default: 'bg-slate-100 text-slate-600',
};

export function StatusBadge({ variant = 'default', children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}
