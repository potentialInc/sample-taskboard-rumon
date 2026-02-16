import { Icon } from '@iconify/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  footer?: React.ReactNode;
}

export function StatCard({ title, value, icon, iconBgColor, iconColor, footer }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#64748B]">{title}</p>
          <h3 className="text-2xl font-semibold text-[#1E293B] mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center ${iconColor}`}>
          <Icon icon={icon} width={24} height={24} />
        </div>
      </div>
      {footer && (
        <div className="flex items-center gap-1 text-xs">
          {footer}
        </div>
      )}
    </div>
  );
}
