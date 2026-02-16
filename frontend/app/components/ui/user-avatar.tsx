import { cn } from '~/lib/utils';

interface UserAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

function getInitials(name?: string): string {
  return (name || '?')
    .split(' ')
    .map((n) => n?.[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

const bgColors = [
  'bg-[#E0F2FE] text-[#0369A1]',
  'bg-[#FCE7F3] text-[#BE185D]',
  'bg-[#FEF3C7] text-[#B45309]',
  'bg-[#D1FAE5] text-[#065F46]',
  'bg-[#EDE9FE] text-[#6D28D9]',
  'bg-[#FEE2E2] text-[#B91C1C]',
];

function getColorFromName(name?: string): string {
  const safeName = name || '';
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function UserAvatar({ src, name, size = 'sm', className }: UserAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={cn('rounded-full object-cover border-2 border-white', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-bold border-2 border-white',
      sizeClasses[size],
      getColorFromName(name),
      className
    )}>
      {getInitials(name)}
    </div>
  );
}

interface AvatarStackProps {
  users: { name: string; avatar?: string }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export function AvatarStack({ users, max = 3, size = 'sm' }: AvatarStackProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user, i) => (
        <UserAvatar key={i} src={user.avatar} name={user.name} size={size} />
      ))}
      {remaining > 0 && (
        <div className={cn(
          'rounded-full border-2 border-white bg-[#F1F5F9] flex items-center justify-center font-medium text-[#64748B]',
          sizeClasses[size]
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
