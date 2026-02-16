import { cn } from '~/lib/utils';
import type { TaskPriority } from '~/types/task';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const priorityConfig: Record<TaskPriority, { color: string; label: string }> = {
  critical: { color: 'bg-red-500', label: 'Critical' },
  high: { color: 'bg-orange-500', label: 'High' },
  medium: { color: 'bg-[#4A90D9]', label: 'Medium' },
  low: { color: 'bg-gray-400', label: 'Low' },
};

export function PriorityDot({ priority, className }: PriorityBadgeProps) {
  return (
    <div className={cn('w-2 h-2 rounded-full shrink-0', priorityConfig[priority].color, className)} />
  );
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium',
      priority === 'critical' && 'bg-red-50 text-red-600',
      priority === 'high' && 'bg-orange-50 text-orange-600',
      priority === 'medium' && 'bg-blue-50 text-blue-600',
      priority === 'low' && 'bg-slate-100 text-slate-600',
      className
    )}>
      <div className={cn('w-1.5 h-1.5 rounded-full', config.color)} />
      {config.label}
    </span>
  );
}
