import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, Settings, BarChart3, Trash2, Plus, MessageCircle, Paperclip, Loader2 } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import { PriorityDot } from '~/components/ui/priority-badge';
import { PageLoader } from '~/components/ui/loading-spinner';
import { cn } from '~/lib/utils';
import { projectService } from '~/services/httpServices/projectService';
import { taskService } from '~/services/httpServices/taskService';
import type { Column } from '~/types/project';
import type { Task, TaskPriority, CreateTaskRequest } from '~/types/task';

interface ColumnWithTasks extends Column {
  tasks: Task[];
  tasksLoading: boolean;
}

export default function BoardView() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectProgress, setProjectProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingTaskColumnId, setAddingTaskColumnId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const fetchBoard = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const [projectResponse, columnsResponse] = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getColumns(projectId),
      ]);

      const project = projectResponse;
      const columnsData = columnsResponse ?? [];

      setProjectTitle(project?.title ?? '');
      setProjectProgress(project?.progress ?? 0);

      const columnsWithTasks: ColumnWithTasks[] = columnsData?.map((col) => ({
        ...col,
        tasks: [],
        tasksLoading: true,
      }));
      setColumns(columnsWithTasks);
      setLoading(false);

      // Fetch tasks for each column in parallel
      const taskResults = await Promise.all(
        columnsData?.map((col) =>
          taskService.getTasks({ projectId, columnId: col.id })
            .then((response) => response?.tasks ?? [])
            .catch(() => [] as Task[])
        )
      );

      setColumns((prev) =>
        prev.map((col, index) => ({
          ...col,
          tasks: taskResults[index] || [],
          tasksLoading: false,
        }))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to load board';
      setError(message);
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleAddTask = async (columnId: string) => {
    if (!newTaskTitle.trim() || !projectId || creatingTask) return;

    setCreatingTask(true);
    try {
      const data: CreateTaskRequest = {
        title: newTaskTitle.trim(),
        columnId,
        priority: 'medium',
      };
      const newTask = await taskService.createTask(data);
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? { ...col, tasks: [...col.tasks, newTask], taskCount: col.taskCount + 1 }
            : col
        )
      );
      setNewTaskTitle('');
      setAddingTaskColumnId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to create task';
      setError(message);
    } finally {
      setCreatingTask(false);
    }
  };

  const formatDueDate = (dateStr?: string): { text: string; isOverdue: boolean } | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isOverdue = date < now;
    const text = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { text, isOverdue };
  };

  if (loading) {
    return (
      <MobileShell>
        <PageLoader />
      </MobileShell>
    );
  }

  if (error) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button
            onClick={fetchBoard}
            className="px-4 py-2 bg-[#4A90D9] text-white rounded-lg text-sm font-medium hover:bg-[#3B82F6] transition-colors"
          >
            Retry
          </button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <header className="h-[56px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-3 shrink-0 z-30">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button onClick={() => navigate('/projects')} className="text-[#64748B] hover:text-[#1E293B] transition-colors shrink-0" aria-label="Back to projects">
            <ArrowLeft className="w-[22px] h-[22px]" />
          </button>
          <h4 className="text-lg font-semibold tracking-tight text-[#1E293B] truncate">{projectTitle}</h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="text-[#4A90D9] p-1.5 rounded hover:bg-[#F0F7FF]" aria-label="Board view"><LayoutGridIcon className="w-5 h-5" /></button>
          <button onClick={() => navigate(`/projects/${projectId}/calendar`)} className="text-[#94A3B8] p-1.5 rounded hover:text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Calendar view"><Calendar className="w-5 h-5" /></button>
          <button onClick={() => navigate(`/projects/${projectId}/settings`)} className="text-[#94A3B8] p-1.5 rounded hover:text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Board settings"><Settings className="w-5 h-5" /></button>
          <button onClick={() => navigate(`/projects/${projectId}/dashboard`)} className="text-[#94A3B8] p-1.5 rounded hover:text-[#64748B] hover:bg-[#F1F5F9]" aria-label="Dashboard"><BarChart3 className="w-5 h-5" /></button>
          <button onClick={() => navigate(`/projects/${projectId}/trash`)} className="text-[#94A3B8] p-1.5 rounded hover:text-red-500 hover:bg-red-50" aria-label="Trash"><Trash2 className="w-5 h-5" /></button>
          <div className="h-5 bg-[#4A90D9] text-white text-[10px] font-semibold rounded-full px-2 flex items-center justify-center ml-1">{projectProgress}%</div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="h-full flex p-3 gap-3 min-w-max">
          {columns?.map((col) => (
            <div key={col.id} className="w-[260px] h-full flex flex-col bg-[#F1F5F9] rounded-xl p-2.5 shrink-0">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1E293B]">{col.title}</span>
                  <span className="bg-[#94A3B8] text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">{col?.tasks?.length ?? 0}</span>
                  {col?.wipLimit ? <span className="text-[10px] font-medium text-[#94A3B8]">{col?.tasks?.length ?? 0}/{col.wipLimit}</span> : null}
                </div>
                <button
                  onClick={() => {
                    setAddingTaskColumnId(col.id);
                    setNewTaskTitle('');
                  }}
                  className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-[#64748B] hover:text-[#4A90D9] transition-colors"
                  aria-label={`Add task to ${col.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5" style={{ scrollbarWidth: 'none' }}>
                {col.tasksLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#94A3B8]" />
                  </div>
                ) : (
                  col?.tasks?.map((task) => {
                    const due = formatDueDate(task.dueDate);
                    return (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className={cn(
                          'bg-white p-3 rounded-lg border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow cursor-pointer',
                          task.isCompleted && 'opacity-60 hover:opacity-100'
                        )}
                      >
                        <div className="flex items-start gap-2 mb-1.5">
                          <PriorityDot priority={task.priority} className="mt-1.5" />
                          <h4 className={cn('text-sm font-medium text-[#1E293B] leading-snug', task.isCompleted && 'line-through')}>{task.title}</h4>
                        </div>
                        {task?.labels?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2 pl-4">
                            {task?.labels?.map((label) => (
                              <span
                                key={label.id}
                                className="h-5 px-1.5 rounded-full text-[10px] font-medium flex items-center"
                                style={{ backgroundColor: `${label.color}15`, color: label.color }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pl-4">
                          {task.assignee ? (
                            <img src={task.assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.fullName)}&size=20`} alt={task.assignee.fullName} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5" />
                          )}
                          <div className="flex items-center gap-2 text-[10px]">
                            {due && (
                              <span className={cn('flex items-center gap-1', due.isOverdue ? 'text-red-500 font-medium' : 'text-[#64748B]')}>
                                <Calendar className="w-3 h-3" /> {due.text}
                              </span>
                            )}
                            {task.commentsCount > 0 && (
                              <span className="flex items-center gap-1 text-[#64748B]"><MessageCircle className="w-3 h-3" /> {task.commentsCount}</span>
                            )}
                            {task.attachmentsCount > 0 && (
                              <span className="flex items-center gap-1 text-[#64748B]"><Paperclip className="w-3 h-3" /> {task.attachmentsCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Add Task Inline Form */}
                {addingTaskColumnId === col.id && (
                  <div className="bg-white p-3 rounded-lg border border-[#4A90D9] shadow-sm">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(col.id);
                        if (e.key === 'Escape') setAddingTaskColumnId(null);
                      }}
                      placeholder="Task title..."
                      autoFocus
                      className="w-full bg-transparent border-none text-sm placeholder-[#94A3B8] focus:ring-0 p-0 text-[#1E293B] outline-none mb-2"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddTask(col.id)}
                        disabled={creatingTask || !newTaskTitle.trim()}
                        className="h-7 px-3 rounded-md bg-[#4A90D9] text-white text-xs font-medium hover:bg-[#3B82F6] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {creatingTask && <Loader2 className="w-3 h-3 animate-spin" />}
                        Add
                      </button>
                      <button
                        onClick={() => setAddingTaskColumnId(null)}
                        className="h-7 px-3 rounded-md text-[#64748B] text-xs font-medium hover:bg-[#F1F5F9] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
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
