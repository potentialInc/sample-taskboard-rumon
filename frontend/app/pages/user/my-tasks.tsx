import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import MobileHeader from '~/components/layout/MobileHeader';
import BottomNav from '~/components/layout/BottomNav';
import { PriorityDot } from '~/components/ui/priority-badge';
import { PageLoader } from '~/components/ui/loading-spinner';
import { EmptyState } from '~/components/ui/empty-state';
import { cn } from '~/lib/utils';
import { taskService } from '~/services/httpServices/taskService';
import { useAppSelector } from '~/redux/store/hooks';
import type { Task, TaskPriority } from '~/types/task';

type FilterType = 'All' | 'Overdue' | 'Due Today' | 'Due This Week';

interface TaskGroup {
  project: string;
  projectId: string;
  tasks: Task[];
}

export default function MyTasks() {
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);

  const fetchTasks = useCallback(async () => {
    if (!authUser?.id) return;
    setLoading(true);
    setError(null);

    try {
      const [myTasksResponse, overdueResponse] = await Promise.all([
        taskService.getTasks({ assigneeId: authUser.id }),
        taskService.getOverdueTasks().catch(() => [] as Task[]),
      ]);

      setAllTasks(myTasksResponse?.tasks ?? []);
      setOverdueTasks(Array.isArray(overdueResponse) ? overdueResponse : []);
      setOverdueCount(Array.isArray(overdueResponse) ? overdueResponse.length : 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to load tasks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getFilteredTasks = (): Task[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

    switch (activeFilter) {
      case 'Overdue':
        return overdueTasks;
      case 'Due Today':
        return allTasks.filter((t) => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due.toDateString() === today.toDateString();
        });
      case 'Due This Week':
        return allTasks.filter((t) => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due >= today && due <= endOfWeek;
        });
      default:
        return allTasks;
    }
  };

  const groupTasksByProject = (tasks: Task[]): TaskGroup[] => {
    const groups: Record<string, TaskGroup> = {};
    for (const task of tasks) {
      const projectKey = task.projectId || 'unknown';
      if (!groups[projectKey]) {
        groups[projectKey] = {
          project: task.columnTitle ? task.columnTitle.split(' - ')[0] : `Project`,
          projectId: task.projectId || '',
          tasks: [],
        };
      }
      groups[projectKey].tasks.push(task);
    }
    return Object.values(groups);
  };

  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  };

  const formatDueDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusStyle = (task: Task): { label: string; color: string } => {
    if (task.isCompleted) {
      return { label: 'Done', color: 'bg-[#D1FAE5] text-[#065F46]' };
    }
    return {
      label: task.columnTitle ?? 'To Do',
      color: 'bg-[#E0F2FE] text-[#0284C7]',
    };
  };

  const filteredTasks = getFilteredTasks();
  const taskGroups = groupTasksByProject(filteredTasks);

  const filters: { label: FilterType; badge?: number }[] = [
    { label: 'All' },
    { label: 'Overdue', badge: overdueCount > 0 ? overdueCount : undefined },
    { label: 'Due Today' },
    { label: 'Due This Week' },
  ];

  if (loading) {
    return (
      <MobileShell>
        <MobileHeader title="My Tasks" />
        <PageLoader />
        <BottomNav />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <MobileHeader title="My Tasks" />

      {/* Filter & Sort Row */}
      <section className="z-10 bg-[#F9FAFB]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3 border-b border-[#E5E7EB]/50 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto flex-grow pr-2" style={{ scrollbarWidth: 'none' }}>
          {filters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              className={cn(
                'flex-shrink-0 h-[32px] px-[12px] rounded-2xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                activeFilter === filter.label
                  ? 'bg-[#4A90D9] text-white shadow-sm'
                  : 'bg-[#F1F5F9] text-[#64748B] border border-transparent hover:border-[#E5E7EB]'
              )}
            >
              {filter.label}
              {filter.badge && (
                <span className="bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{filter.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-shrink-0">
          <select className="h-10 pl-3 pr-8 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:border-[#4A90D9] shadow-sm appearance-none">
            <option>Due date</option>
            <option>Priority</option>
            <option>Project</option>
          </select>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
          <p className="text-xs text-red-600">{error}</p>
          <button onClick={fetchTasks} className="text-red-500 hover:text-red-700 text-xs font-medium">Retry</button>
        </div>
      )}

      {/* Task List */}
      <main className="flex-1 overflow-y-auto px-4 pb-[70px]">
        {taskGroups.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description={activeFilter === 'All' ? "You don't have any assigned tasks yet." : `No ${activeFilter.toLowerCase()} tasks.`}
            className="mt-8"
          />
        ) : (
          taskGroups.map((group) => (
            <div key={group.projectId} className="flex flex-col mt-4 rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm">
              <div className="bg-[#F1F5F9] px-4 py-3 border-l-[3px] border-[#4A90D9] flex items-center">
                <h4 className="text-sm font-semibold text-[#1E293B] uppercase tracking-wider">{group.project}</h4>
              </div>

              <div className="flex flex-col bg-white">
                {group.tasks.map((task) => {
                  const overdue = isOverdue(task);
                  const status = getStatusStyle(task);
                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className={cn(
                        'group flex items-center gap-3 p-4 bg-white border-b border-[#E5E7EB] border-l-[3px] hover:bg-[#F8FAFC] transition-colors cursor-pointer',
                        overdue ? 'border-l-[#EF4444]' : 'border-l-transparent'
                      )}
                    >
                      <PriorityDot priority={task.priority} className="mt-0.5" />

                      <div className="flex flex-col flex-grow min-w-0 gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base font-medium text-[#1E293B] truncate">{task.title}</span>
                          {task.dueDate && (
                            overdue ? (
                              <span className="text-xs font-bold text-[#EF4444] whitespace-nowrap flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {formatDueDate(task.dueDate)}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-[#64748B] whitespace-nowrap">{formatDueDate(task.dueDate)}</span>
                            )
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold', status.color)}>{status.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </MobileShell>
  );
}
