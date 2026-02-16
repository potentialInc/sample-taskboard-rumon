import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router';
import { ClipboardList, CheckCircle, Bell, TrendingUp, Download, MoreHorizontal, AlertCircle, Calendar } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';
import { setLoading, setDashboard, setError } from '~/redux/features/projectSlice';
import { projectService } from '~/services/httpServices/projectService';
import MobileShell from '~/components/layout/MobileShell';
import MobileHeader from '~/components/layout/MobileHeader';
import { PageLoader } from '~/components/ui/loading-spinner';
import { EmptyState } from '~/components/ui/empty-state';
import { cn } from '~/lib/utils';
import type { TaskPriority } from '~/types/task';

// --- Filter types ---

type PriorityFilter = 'all' | TaskPriority;

const PRIORITY_FILTERS: { label: string; value: PriorityFilter }[] = [
  { label: 'All Priorities', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'critical' },
];

// --- Chart sub-components ---

interface StatCardProps {
  label: string;
  value: number | string;
  valueColor?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  footer?: React.ReactNode;
}

function StatCard({ label, value, valueColor = 'text-[#1E293B]', icon, iconBgColor, iconColor, footer }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex flex-col justify-between h-[104px] shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-[#64748B]">{label}</span>
          <span className={cn('text-2xl font-bold tracking-tight', valueColor)}>{value}</span>
        </div>
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', iconBgColor, iconColor)}>
          {icon}
        </div>
      </div>
      {footer && <div className="mt-auto">{footer}</div>}
    </div>
  );
}

interface CircularProgressProps {
  percentage: number;
  color?: string;
  size?: number;
  label?: string;
}

function CircularProgress({ percentage, color = '#4A90D9', size = 64, label }: CircularProgressProps) {
  const clampedPct = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} ${clampedPct}%, #F1F5F9 0)`,
        }}
        role="progressbar"
        aria-valuenow={clampedPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${clampedPct}% completion`}
      >
        <div
          className="bg-white rounded-full flex flex-col items-center justify-center"
          style={{ width: size * 0.75, height: size * 0.75 }}
        >
          <span className="text-sm font-bold text-[#1E293B] leading-none">{clampedPct}%</span>
        </div>
      </div>
      {label && <span className="text-[10px] font-medium text-[#64748B] mt-1.5">{label}</span>}
    </div>
  );
}

interface DonutChartProps {
  segments: { label: string; count: number; color: string }[];
  centerLabel?: string;
  centerValue?: string | number;
}

function DonutChart({ segments, centerLabel, centerValue }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return null;

  // Build conic-gradient segments
  let accumulated = 0;
  const gradientParts = segments.map((seg) => {
    const start = accumulated;
    accumulated += (seg.count / total) * 100;
    return `${seg.color} ${start}% ${accumulated}%`;
  });

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <div
        className="w-full h-full rounded-full"
        style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}
        role="img"
        aria-label={`Donut chart: ${segments.map((s) => `${s.label} ${s.count}`).join(', ')}`}
      />
      <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          {centerValue !== undefined && (
            <span className="text-sm font-bold text-[#1E293B]">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-[10px] text-[#64748B] uppercase font-medium">{centerLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatusBarChartProps {
  items: { name: string; count: number; color: string }[];
  total: number;
}

function StatusBarChart({ items, total }: StatusBarChartProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const widthPct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={item.name} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium text-[#64748B] mb-1">
              <span>{item.name}</span>
              <span>{item.count}</span>
            </div>
            <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', item.color)}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MemberWorkloadItemProps {
  name: string;
  initials: string;
  taskCount: number;
  maxTasks: number;
  bgColor: string;
  textColor: string;
}

function MemberWorkloadItem({ name, initials, taskCount, maxTasks, bgColor, textColor }: MemberWorkloadItemProps) {
  const widthPct = maxTasks > 0 ? Math.round((taskCount / maxTasks) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', bgColor, textColor)}>
        {initials}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-[#1E293B]">{name}</span>
          <span className="text-xs font-medium text-[#64748B]">{taskCount} tasks</span>
        </div>
        <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full">
          <div className="bg-[#4A90D9] h-1.5 rounded-full transition-all duration-500" style={{ width: `${widthPct}%` }} />
        </div>
      </div>
    </div>
  );
}

interface CompletionTrendChartProps {
  data: { date: string; completed: number }[];
  trendLabel?: string;
}

function CompletionTrendChart({ data, trendLabel }: CompletionTrendChartProps) {
  // Generate SVG path from trend data
  const pathData = useMemo(() => {
    if (data.length === 0) return { linePath: '', areaPath: '', maxVal: 0 };
    const maxVal = Math.max(...data.map((d) => d.completed), 1);
    const points = data.map((d, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
      const y = 40 - (d.completed / maxVal) * 35;
      return { x, y };
    });
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaPath = `M0,40 L${points.map((p) => `${p.x},${p.y}`).join(' L')} L100,40 Z`;
    return { linePath, areaPath, maxVal, points };
  }, [data]);

  const dateLabels = useMemo(() => {
    if (data.length <= 4) return data.map((d) => d.date);
    // Pick 4 evenly-spaced labels
    const step = Math.floor(data.length / 3);
    return [data[0].date, data[step].date, data[step * 2].date, data[data.length - 1].date];
  }, [data]);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[#1E293B]">Completion Trend</h4>
        {trendLabel && (
          <span className="text-xs text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded-md font-medium">{trendLabel}</span>
        )}
      </div>
      <div className="w-full h-40 relative">
        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <path d={pathData.areaPath} fill="#10B981" fillOpacity="0.1" />
          <path d={pathData.linePath} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {pathData.points && pathData.points.length > 0 && (
            <>
              <circle
                cx={pathData.points[Math.floor(pathData.points.length / 2)]?.x}
                cy={pathData.points[Math.floor(pathData.points.length / 2)]?.y}
                r="1.5"
                fill="#FFFFFF"
                stroke="#10B981"
                strokeWidth="1"
              />
              <circle
                cx={pathData.points[pathData.points.length - 1]?.x}
                cy={pathData.points[pathData.points.length - 1]?.y}
                r="1.5"
                fill="#FFFFFF"
                stroke="#10B981"
                strokeWidth="1"
              />
            </>
          )}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-[#94A3B8] mt-2 px-1">
        {dateLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}

// --- Member color palette ---

const MEMBER_COLORS = [
  { bg: 'bg-[#E0E7FF]', text: 'text-[#4F46E5]' },
  { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' },
  { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
  { bg: 'border border-[#E5E7EB] bg-white', text: 'text-[#94A3B8]' },
  { bg: 'bg-[#FCE7F3]', text: 'text-[#BE185D]' },
  { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]' },
];

function getInitials(name?: string): string {
  return (name || '?')
    .split(' ')
    .map((n) => n?.[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

// --- Priority color mapping ---

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94A3B8',
  medium: '#4A90D9',
  high: '#F59E0B',
  critical: '#EF4444',
  urgent: '#EF4444',
};

// --- Status bar color mapping ---

const STATUS_BAR_COLORS: Record<string, string> = {
  'to do': 'bg-[#4A90D9]/60',
  'in progress': 'bg-[#4A90D9]/80',
  'review': 'bg-[#4A90D9]',
  'done': 'bg-[#10B981]',
};

function getStatusBarColor(status: string): string {
  return STATUS_BAR_COLORS[status.toLowerCase()] ?? 'bg-[#4A90D9]';
}

// --- Main Component ---

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const dispatch = useAppDispatch();
  const { dashboard, loading, error } = useAppSelector((state) => state.project);

  const [activePriority, setActivePriority] = useState<PriorityFilter>('all');
  const [isExporting, setIsExporting] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!projectId) return;
    try {
      dispatch(setLoading(true));
      const data = await projectService.getDashboard(projectId);
      dispatch(setDashboard(data));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      dispatch(setError(message));
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    fetchDashboard();
    return () => {
      dispatch(setDashboard(null));
    };
  }, [fetchDashboard, dispatch]);

  const handleExport = useCallback(async () => {
    if (!projectId || isExporting) return;
    setIsExporting(true);
    try {
      const blob = await projectService.exportProject(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}-export.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Export failed silently -- could add toast notification
    } finally {
      setIsExporting(false);
    }
  }, [projectId, isExporting]);

  // Normalize data: handle both array and object formats from backend
  const statusList = useMemo(() => {
    const raw = dashboard?.tasksByStatus;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return Object.entries(raw).map(([status, count]) => ({ status, count: count as number }));
  }, [dashboard]);

  const priorityList = useMemo(() => {
    const raw = dashboard?.tasksByPriority;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return Object.entries(raw).map(([priority, count]) => ({ priority, count: count as number }));
  }, [dashboard]);

  // Computed values
  const totalTasks = useMemo(() => {
    return statusList.reduce((sum, s) => sum + (s?.count ?? 0), 0);
  }, [statusList]);

  const completedTasks = useMemo(() => {
    const done = statusList.find((s) => s?.status?.toLowerCase() === 'done');
    return done?.count ?? 0;
  }, [statusList]);

  const completionRate = useMemo(() => {
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [totalTasks, completedTasks]);

  const donutSegments = useMemo(() => {
    return priorityList.map((p) => ({
      label: p?.priority ?? '',
      count: p?.count ?? 0,
      color: PRIORITY_COLORS[p?.priority?.toLowerCase()] ?? '#94A3B8',
    }));
  }, [priorityList]);

  const statusItems = useMemo(() => {
    return statusList.map((s) => ({
      name: s?.status ?? '',
      count: s?.count ?? 0,
      color: getStatusBarColor(s?.status ?? ''),
    }));
  }, [statusList]);

  const maxMemberTasks = useMemo(() => {
    if (!dashboard) return 0;
    return Math.max(...(dashboard?.memberWorkload ?? []).map((m) => m?.taskCount ?? 0), 1);
  }, [dashboard]);

  // Render

  if (loading) {
    return (
      <MobileShell>
        <MobileHeader title="Dashboard" showBack backTo={`/projects/${projectId}/board`} />
        <PageLoader />
      </MobileShell>
    );
  }

  if (error) {
    return (
      <MobileShell>
        <MobileHeader title="Dashboard" showBack backTo={`/projects/${projectId}/board`} />
        <EmptyState
          icon={<AlertCircle className="w-8 h-8" />}
          title="Failed to load dashboard"
          description={error}
          action={
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3B82F6] transition-colors"
            >
              Try Again
            </button>
          }
        />
      </MobileShell>
    );
  }

  if (!dashboard) {
    return (
      <MobileShell>
        <MobileHeader title="Dashboard" showBack backTo={`/projects/${projectId}/board`} />
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" />}
          title="No dashboard data"
          description="Dashboard data is not available for this project."
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <MobileHeader title="Dashboard" showBack backTo={`/projects/${projectId}/board`} />

      <main className="flex-1 overflow-y-auto p-3 pb-6 flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
        {/* Filter Bar */}
        <section className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Date Range */}
            <div className="flex items-center gap-1.5 h-9 bg-white border border-[#E5E7EB] rounded-md px-2.5 w-full">
              <Calendar className="w-4 h-4 text-[#64748B] shrink-0" />
              <input
                type="text"
                placeholder="Jan 1"
                className="w-full bg-transparent text-xs focus:outline-none text-[#1E293B]"
                aria-label="Start date"
                readOnly
              />
              <span className="text-[#94A3B8] text-xs">-</span>
              <input
                type="text"
                placeholder="Feb 1"
                className="w-full bg-transparent text-xs focus:outline-none text-[#1E293B] text-right"
                aria-label="End date"
                readOnly
              />
            </div>

            {/* Assignee */}
            <div className="relative h-9">
              <select
                className="w-full h-full bg-white border border-[#E5E7EB] rounded-md px-2.5 text-xs text-[#1E293B] appearance-none focus:outline-none focus:border-[#4A90D9]"
                aria-label="Filter by member"
              >
                <option>All members</option>
                {dashboard?.memberWorkload?.map((member) => (
                  <option key={member.memberId} value={member.memberId}>{member.memberName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority Chips */}
          <div className="flex flex-wrap gap-1.5">
            {PRIORITY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActivePriority(filter.value)}
                className={cn(
                  'px-3 py-1 rounded-full text-[10px] font-medium transition-colors',
                  activePriority === filter.value ? 'bg-[#4A90D9] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                )}
                aria-pressed={activePriority === filter.value}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-2.5">
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            icon={<ClipboardList className="w-4 h-4" />}
            iconBgColor="bg-[#4A90D9]/10"
            iconColor="text-[#4A90D9]"
            footer={
              <div className="text-[10px] text-[#10B981] flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12% vs last month</span>
              </div>
            }
          />

          <StatCard
            label="Completed"
            value={completedTasks}
            valueColor="text-[#10B981]"
            icon={<CheckCircle className="w-4 h-4" />}
            iconBgColor="bg-[#10B981]/10"
            iconColor="text-[#10B981]"
            footer={
              <div className="w-full bg-[#F1F5F9] h-1 rounded-full mt-1">
                <div
                  className="bg-[#10B981] h-1 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            }
          />

          <StatCard
            label="Overdue"
            value={dashboard?.overdueTasks ?? 0}
            valueColor="text-[#EF4444]"
            icon={<Bell className="w-4 h-4" />}
            iconBgColor="bg-[#EF4444]/10"
            iconColor="text-[#EF4444]"
            footer={
              <div className="text-[10px] text-[#64748B] mt-1">
                {(dashboard?.overdueTasks ?? 0) > 0 ? 'Requires attention' : 'All on track'}
              </div>
            }
          />

          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex flex-col items-center justify-center h-[104px] shadow-sm">
            <CircularProgress percentage={completionRate} label="Completion Rate" />
          </div>
        </section>

        {/* Tasks by Status */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#1E293B]">Tasks by Status</h4>
            <button className="text-[#94A3B8] hover:text-[#64748B]" aria-label="More options">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <StatusBarChart items={statusItems} total={totalTasks} />
        </div>

        {/* Tasks by Priority */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm flex flex-row gap-3 items-center">
          <div className="flex-grow w-full">
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Tasks by Priority</h4>
            <div className="grid grid-cols-2 gap-2.5">
              {priorityList.map((item) => (
                <div key={item?.priority} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[item?.priority?.toLowerCase()] ?? '#94A3B8' }}
                  />
                  <span className="text-xs text-[#64748B]">
                    {(item?.priority ?? '').charAt(0).toUpperCase() + (item?.priority ?? '').slice(1)} ({item?.count ?? 0})
                  </span>
                </div>
              ))}
            </div>
          </div>
          <DonutChart
            segments={donutSegments}
            centerValue={totalTasks}
            centerLabel="Tasks"
          />
        </div>

        {/* Member Workload */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 shadow-sm">
          <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Member Workload</h4>
          <div className="flex flex-col gap-4">
            {dashboard?.memberWorkload?.map((member, index) => {
              const colorSet = MEMBER_COLORS[index % MEMBER_COLORS.length];
              return (
                <MemberWorkloadItem
                  key={member.memberId}
                  name={member.memberName}
                  initials={getInitials(member.memberName)}
                  taskCount={member.taskCount}
                  maxTasks={maxMemberTasks}
                  bgColor={colorSet.bg}
                  textColor={colorSet.text}
                />
              );
            })}
          </div>
        </div>

        {/* Completion Trend */}
        {dashboard?.completionTrend?.length > 0 && (
          <CompletionTrendChart
            data={dashboard.completionTrend}
            trendLabel="+8% this week"
          />
        )}

        {/* Export Action */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full h-12 shrink-0 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#64748B] hover:bg-[#F9FAFB] hover:text-[#1E293B] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </main>
    </MobileShell>
  );
}
