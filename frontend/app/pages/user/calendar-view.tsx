import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, Settings, BarChart3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import { LoadingSpinner } from '~/components/ui/loading-spinner';
import { cn } from '~/lib/utils';
import { taskService } from '~/services/httpServices/taskService';
import { projectService } from '~/services/httpServices/projectService';
import type { CalendarTask } from '~/types/task';

type ViewMode = 'Week' | 'Month';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarTask[];
  hasMore: number;
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const priorityColorMap: Record<string, string> = {
  critical: 'bg-[#EF4444]',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-[#94A3B8]',
};

export default function CalendarView() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectProgress, setProjectProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate start and end dates based on current month/week
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'Month') {
      // First day of the month's calendar (may include prev month days)
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      // Last day of the month's calendar (may include next month days)
      const lastDay = new Date(year, month + 1, 0);
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
    } else {
      // Week view
      const dayOfWeek = currentDate.getDay();
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - dayOfWeek);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
    }
  }, [currentDate, viewMode]);

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: { startDate: string; endDate: string; projectId?: string } = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
      if (projectId) {
        params.projectId = projectId;
      }

      const [calendarResponse, projectResponse] = await Promise.all([
        taskService.getCalendarTasks(params),
        projectId ? projectService.getProjectById(projectId).catch(() => null) : Promise.resolve(null),
      ]);

      setCalendarTasks(Array.isArray(calendarResponse) ? calendarResponse : []);
      if (projectResponse) {
        const project = projectResponse;
        setProjectTitle(project?.title ?? '');
        setProjectProgress(project?.progress ?? 0);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to load calendar';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, projectId]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const navigateMonth = (direction: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'Month') {
        next.setMonth(next.getMonth() + direction);
      } else {
        next.setDate(next.getDate() + direction * 7);
      }
      return next;
    });
  };

  // Build calendar grid
  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    if (viewMode === 'Month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const days: CalendarDay[] = [];

      // Leading days from previous month
      for (let i = 0; i < firstDay.getDay(); i++) {
        const date = new Date(year, month, -(firstDay.getDay() - i - 1));
        days.push({
          date,
          day: date.getDate(),
          isCurrentMonth: false,
          isToday: false,
          events: [],
          hasMore: 0,
        });
      }

      // Current month days
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(year, month, d);
        days.push({
          date,
          day: d,
          isCurrentMonth: true,
          isToday: date.toDateString() === today.toDateString(),
          events: [],
          hasMore: 0,
        });
      }

      // Trailing days to fill grid
      const remaining = 7 - (days.length % 7);
      if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
          const date = new Date(year, month + 1, i);
          days.push({
            date,
            day: i,
            isCurrentMonth: false,
            isToday: false,
            events: [],
            hasMore: 0,
          });
        }
      }

      // Assign tasks to days
      const maxEvents = 2;
      for (const task of calendarTasks) {
        const taskDate = new Date(task.dueDate);
        const dayEntry = days.find((d) => d.date.toDateString() === taskDate.toDateString());
        if (dayEntry) {
          if (dayEntry.events.length < maxEvents) {
            dayEntry.events.push(task);
          } else {
            dayEntry.hasMore++;
          }
        }
      }

      return days;
    } else {
      // Week view
      const dayOfWeek = currentDate.getDay();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

      const days: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        days.push({
          date,
          day: date.getDate(),
          isCurrentMonth: date.getMonth() === month,
          isToday: date.toDateString() === today.toDateString(),
          events: [],
          hasMore: 0,
        });
      }

      // Assign tasks
      for (const task of calendarTasks) {
        const taskDate = new Date(task.dueDate);
        const dayEntry = days.find((d) => d.date.toDateString() === taskDate.toDateString());
        if (dayEntry) {
          dayEntry.events.push(task);
        }
      }

      return days;
    }
  }, [currentDate, viewMode, calendarTasks]);

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <MobileShell>
      <header className="h-[56px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-3 shrink-0 z-30">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button onClick={() => navigate('/projects')} className="text-[#64748B] hover:text-[#1E293B] transition-colors shrink-0" aria-label="Back to projects">
            <ArrowLeft className="w-[22px] h-[22px]" />
          </button>
          <h4 className="text-lg font-semibold tracking-tight text-[#1E293B] truncate">{projectTitle || 'Calendar'}</h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => navigate(`/projects/${projectId}/board`)} className="text-[#94A3B8] p-1.5 rounded hover:text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Board view"><LayoutGridIcon className="w-5 h-5" /></button>
          <button className="text-[#4A90D9] p-1.5 rounded hover:bg-[#F0F7FF]" aria-label="Calendar view"><Calendar className="w-5 h-5" /></button>
          <button onClick={() => navigate(`/projects/${projectId}/settings`)} className="text-[#94A3B8] p-1.5 rounded hover:text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Board settings"><Settings className="w-5 h-5" /></button>
          <button onClick={() => navigate(`/projects/${projectId}/dashboard`)} className="text-[#94A3B8] p-1.5 rounded hover:text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Dashboard"><BarChart3 className="w-5 h-5" /></button>
          <button onClick={() => navigate(`/projects/${projectId}/trash`)} className="text-[#94A3B8] p-1.5 rounded hover:text-red-500 hover:bg-red-50" aria-label="Trash"><Trash2 className="w-5 h-5" /></button>
          {projectProgress > 0 && (
            <div className="h-5 bg-[#4A90D9] text-white text-[10px] font-semibold rounded-full px-2 flex items-center justify-center ml-1">{projectProgress}%</div>
          )}
        </div>
      </header>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E5E7EB] bg-white shrink-0">
        <div className="bg-[#F1F5F9] p-0.5 rounded-lg flex items-center h-[28px]">
          {(['Week', 'Month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-2.5 h-full flex items-center justify-center text-[10px] font-medium rounded-md',
                viewMode === mode ? 'text-[#4A90D9] bg-white shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigateMonth(-1)} className="text-[#64748B] hover:text-[#1E293B] p-0.5" aria-label="Previous">
            <ChevronLeft className="w-[18px] h-[18px]" />
          </button>
          <span className="text-sm font-semibold tracking-tight text-[#1E293B]">{monthLabel}</span>
          <button onClick={() => navigateMonth(1)} className="text-[#64748B] hover:text-[#1E293B] p-0.5" aria-label="Next">
            <ChevronRight className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-3 mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
          <p className="text-xs text-red-600">{error}</p>
          <button onClick={fetchCalendarData} className="text-red-500 hover:text-red-700 text-xs font-medium">Retry</button>
        </div>
      )}

      {/* Calendar Grid */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-white relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        )}

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          {weekdays.map((day) => (
            <div key={day} className="py-1.5 text-center text-[10px] font-medium text-[#64748B]">{day}</div>
          ))}
        </div>

        {/* Calendar Days */}
        {viewMode === 'Month' ? (
          <div className="grid grid-cols-7 auto-rows-fr flex-1">
            {calendarDays.map((dayData, index) => (
              <div
                key={index}
                className={cn(
                  'border-b border-r border-[#E5E7EB] p-1 min-h-[72px] flex flex-col gap-1',
                  dayData.isToday ? 'bg-[#F0F7FF]' : dayData.isCurrentMonth ? 'hover:bg-[#F8FAFC] transition-colors' : 'bg-white'
                )}
              >
                {dayData.isToday ? (
                  <div className="w-5 h-5 rounded-full bg-[#4A90D9] flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-semibold text-white">{dayData.day}</span>
                  </div>
                ) : (
                  <span className={cn('text-xs font-medium', dayData.isCurrentMonth ? 'text-[#1E293B]' : 'text-[#94A3B8]')}>{dayData.day}</span>
                )}
                {dayData.events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/tasks/${event.id}`)}
                    className={cn('h-4 w-full rounded px-1.5 flex items-center cursor-pointer hover:opacity-90', priorityColorMap[event.priority] || 'bg-blue-500')}
                  >
                    <span className="text-[10px] font-medium text-white truncate">{event.title}</span>
                  </div>
                ))}
                {dayData.hasMore > 0 && (
                  <button className="text-[10px] font-medium text-[#4A90D9] hover:underline text-left pl-0.5">+{dayData.hasMore} more</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Week view - show more detail per day
          <div className="grid grid-cols-7 flex-1">
            {calendarDays.map((dayData, index) => (
              <div
                key={index}
                className={cn(
                  'border-r border-[#E5E7EB] p-1.5 flex flex-col gap-1.5',
                  dayData.isToday ? 'bg-[#F0F7FF]' : 'hover:bg-[#F8FAFC] transition-colors'
                )}
              >
                <div className="text-center mb-1">
                  {dayData.isToday ? (
                    <div className="w-7 h-7 rounded-full bg-[#4A90D9] flex items-center justify-center shadow-sm mx-auto">
                      <span className="text-xs font-semibold text-white">{dayData.day}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-[#1E293B]">{dayData.day}</span>
                  )}
                </div>
                {dayData.events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/tasks/${event.id}`)}
                    className={cn(
                      'rounded px-1.5 py-1 flex flex-col cursor-pointer hover:opacity-90',
                      priorityColorMap[event.priority] || 'bg-blue-500'
                    )}
                  >
                    <span className="text-[10px] font-medium text-white truncate">{event.title}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </MobileShell>
  );
}

function LayoutGridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
