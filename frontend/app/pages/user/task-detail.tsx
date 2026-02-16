import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Calendar, Check, PlusCircle, Play, Send, Trash2, Loader2 } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import MobileHeader from '~/components/layout/MobileHeader';
import { PriorityDot } from '~/components/ui/priority-badge';
import { PageLoader } from '~/components/ui/loading-spinner';
import { ConfirmDialog, useConfirmDialog } from '~/components/ui/confirm-dialog';
import { cn } from '~/lib/utils';
import { taskService } from '~/services/httpServices/taskService';
import { useAppSelector } from '~/redux/store/hooks';
import type { Task, SubTask, TaskComment, TaskAttachment, TimeEntry } from '~/types/task';

export default function TaskDetail() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const authUser = useAppSelector((state) => state.auth.user);

  const [task, setTask] = useState<Task | null>(null);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newSubTask, setNewSubTask] = useState('');
  const [addingSubTask, setAddingSubTask] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [togglingSubtask, setTogglingSubtask] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteDialog = useConfirmDialog();

  const fetchTaskData = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);

    try {
      const [taskResponse, subtasksResponse, commentsResponse, attachmentsResponse] = await Promise.all([
        taskService.getTaskById(taskId),
        taskService.getSubtasks(taskId).catch(() => [] as SubTask[]),
        taskService.getComments(taskId).catch(() => [] as TaskComment[]),
        taskService.getAttachments(taskId).catch(() => [] as TaskAttachment[]),
      ]);

      setTask(taskResponse);
      setSubTasks(Array.isArray(subtasksResponse) ? subtasksResponse : []);
      setComments(Array.isArray(commentsResponse) ? commentsResponse : []);
      setAttachments(Array.isArray(attachmentsResponse) ? attachmentsResponse : []);

      // Fetch time entries separately (non-blocking)
      taskService.getTimeEntries(taskId)
        .then((response) => setTimeEntries(response))
        .catch(() => setTimeEntries([]));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to load task';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);

  const toggleSubTask = async (subtaskId: string) => {
    if (togglingSubtask) return;
    setTogglingSubtask(subtaskId);

    // Optimistic update
    setSubTasks((prev) =>
      prev.map((t) => t.id === subtaskId ? { ...t, isCompleted: !t.isCompleted } : t)
    );

    try {
      await taskService.toggleSubtask(subtaskId);
    } catch {
      // Revert on failure
      setSubTasks((prev) =>
        prev.map((t) => t.id === subtaskId ? { ...t, isCompleted: !t.isCompleted } : t)
      );
    } finally {
      setTogglingSubtask(null);
    }
  };

  const addSubTask = async () => {
    if (!newSubTask.trim() || !taskId || addingSubTask) return;
    setAddingSubTask(true);

    try {
      const response = await taskService.createSubtask(taskId, newSubTask.trim());
      setSubTasks((prev) => [...prev, response]);
      setNewSubTask('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add sub-task';
      setError(message);
    } finally {
      setAddingSubTask(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !taskId || sendingComment) return;
    setSendingComment(true);

    try {
      const response = await taskService.createComment(taskId, { text: newComment.trim() });
      setComments((prev) => [...prev, response]);
      setNewComment('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to send comment';
      setError(message);
    } finally {
      setSendingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId || deleting) return;
    setDeleting(true);

    try {
      await taskService.deleteTask(taskId);
      navigate(-1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setError(message);
      setDeleting(false);
      deleteDialog.close();
    }
  };

  const handleStartTimer = async () => {
    if (!taskId) return;
    try {
      const response = await taskService.startTimer(taskId);
      setTimeEntries((prev) => [response, ...prev]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start timer';
      setError(message);
    }
  };

  const formatDuration = (seconds: number): string => {
    const s = seconds || 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  };

  const totalTime = timeEntries.reduce((sum, e) => sum + (e.durationSeconds || 0), 0);

  const completedCount = subTasks.filter((t) => t.isCompleted).length;
  const progressPercent = subTasks.length > 0 ? (completedCount / subTasks.length) * 100 : 0;

  if (loading) {
    return (
      <MobileShell>
        <PageLoader />
      </MobileShell>
    );
  }

  if (error && !task) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button
            onClick={fetchTaskData}
            className="px-4 py-2 bg-[#4A90D9] text-white rounded-lg text-sm font-medium hover:bg-[#3B82F6] transition-colors"
          >
            Retry
          </button>
        </div>
      </MobileShell>
    );
  }

  if (!task) return null;

  const priorityLabel: Record<string, string> = {
    critical: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <MobileShell>
      <MobileHeader title={task.title} showBack backTo={task.projectId ? `/projects/${task.projectId}/board` : undefined} />

      <main className="flex-1 overflow-y-auto p-3 pb-6 flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
        {/* Inline Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
          </div>
        )}

        {/* Status & Priority */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4A90D9]/15 text-[#4A90D9]">
            {task.columnTitle ?? 'Unknown'}
          </span>
          <div className="flex items-center gap-1.5">
            <PriorityDot priority={task.priority} />
            <span className="text-xs font-medium text-[#1E293B]">{priorityLabel[task.priority]}</span>
          </div>
        </div>

        {/* Metadata Card */}
        <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm flex flex-col gap-4">
          {task.description && (
            <p className="text-sm leading-relaxed text-[#1E293B]">{task.description}</p>
          )}

          <div className="grid grid-cols-[80px_1fr] gap-y-3 items-center">
            <div className="text-xs font-medium text-[#64748B]">Assignee</div>
            <div className="flex items-center gap-2">
              {task.assignee ? (
                <>
                  <img
                    src={task.assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.fullName)}&size=24`}
                    alt={task.assignee.fullName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-[#1E293B]">{task.assignee.fullName}</span>
                </>
              ) : (
                <span className="text-xs text-[#94A3B8]">Unassigned</span>
              )}
            </div>

            <div className="text-xs font-medium text-[#64748B]">Due date</div>
            <div className="flex items-center gap-1.5 text-[#1E293B]">
              <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-xs font-medium">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'No due date'}
              </span>
            </div>

            {task?.labels?.length > 0 && (
              <>
                <div className="text-xs font-medium text-[#64748B]">Labels</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {task?.labels?.map((label) => (
                    <span
                      key={label.id}
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: `${label.color}15`, color: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Sub-tasks Card */}
        <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Sub-tasks</h4>
            <span className="text-xs font-medium text-[#64748B]">{completedCount}/{subTasks.length}</span>
          </div>

          <div className="h-1 w-full bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
            <div className="h-full bg-[#10B981] rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="flex flex-col gap-2.5">
            {subTasks.map((st) => (
              <label key={st.id} className="flex items-start gap-2.5 cursor-pointer group">
                <button
                  onClick={() => toggleSubTask(st.id)}
                  disabled={togglingSubtask === st.id}
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    st.isCompleted ? 'bg-[#4A90D9] border-[#4A90D9]' : 'border-[#CBD5E1] bg-white group-hover:border-[#4A90D9]'
                  )}
                >
                  {st.isCompleted && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className={cn('text-sm select-none', st.isCompleted ? 'text-[#94A3B8] line-through' : 'text-[#1E293B]')}>{st.title}</span>
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2.5 pl-0.5">
            <PlusCircle className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={newSubTask}
              onChange={(e) => setNewSubTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
              placeholder="Add a sub-task..."
              disabled={addingSubTask}
              className="w-full bg-transparent border-none text-sm placeholder-[#94A3B8] focus:ring-0 p-0 text-[#1E293B] outline-none disabled:opacity-50"
            />
            {addingSubTask && <Loader2 className="w-4 h-4 animate-spin text-[#94A3B8]" />}
          </div>
        </section>

        {/* Time Tracking Card */}
        <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Time Tracking</h4>
            <button
              onClick={handleStartTimer}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E5E7EB] text-[#4A90D9] hover:bg-[#F0F7FF] transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Start Timer</span>
            </button>
          </div>

          {timeEntries.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-0.5 h-7 rounded-full bg-[#E5E7EB]" />
                    <div className="flex flex-col">
                      <span className="text-[#1E293B] font-medium">{entry.description || 'Time entry'}</span>
                      <span className="text-[#64748B] text-[10px]">
                        {new Date(entry.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {entry.entryType === 'timer' && !entry.endedAt && ' (running)'}
                      </span>
                    </div>
                  </div>
                  <span className="font-medium text-[#1E293B]">{formatDuration(entry.durationSeconds)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8] text-center py-2">No time entries yet</p>
          )}

          {totalTime > 0 && (
            <div className="mt-3 pt-2.5 border-t border-dashed border-[#E5E7EB] flex justify-end">
              <span className="text-xs text-[#1E293B]">Total: <span className="font-semibold">{formatDuration(totalTime)}</span></span>
            </div>
          )}
        </section>

        {/* Comments Card */}
        <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Comments</h4>
            <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{comments.length}</span>
          </div>

          {comments.length > 0 ? (
            <div className="flex flex-col gap-3 mb-3">
              {comments.map((comment) => {
                const authorName = comment.author?.fullName ?? 'Unknown';
                const authorAvatar = comment.author?.avatar;
                return (
                  <div key={comment.id} className="flex gap-2.5">
                    <img
                      src={authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&size=24`}
                      alt={authorName}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#1E293B]">{authorName}</span>
                        <span className="text-[10px] text-[#94A3B8]">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-[#475569] leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8] text-center py-2 mb-3">No comments yet</p>
          )}

          <div className="flex items-center gap-2.5">
            <img
              src={authUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser?.fullName || 'User')}&size=24`}
              alt="User"
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                placeholder="Write a comment..."
                disabled={sendingComment}
                className="w-full h-[34px] pl-2.5 pr-8 bg-[#F8FAFC] border border-[#E5E7EB] rounded-md text-xs focus:outline-none focus:border-[#4A90D9] focus:bg-white transition-colors placeholder-[#94A3B8] text-[#1E293B] disabled:opacity-50"
              />
              <button
                onClick={handleSendComment}
                disabled={sendingComment || !newComment.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#4A90D9] hover:text-[#3B82F6] p-0.5 disabled:opacity-50"
                aria-label="Send comment"
              >
                {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </section>

        {/* Move to Trash */}
        <button
          onClick={deleteDialog.open}
          className="w-full h-12 shrink-0 flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] text-[#EF4444] font-medium hover:bg-red-50 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Move to Trash
        </button>
      </main>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={handleDelete}
        title="Delete Task"
        description="Are you sure you want to move this task to trash? You can restore it within 30 days."
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </MobileShell>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
