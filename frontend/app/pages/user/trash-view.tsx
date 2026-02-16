import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Info, User, Clock, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import MobileHeader from '~/components/layout/MobileHeader';
import { PageLoader } from '~/components/ui/loading-spinner';
import { ConfirmDialog, useConfirmDialog } from '~/components/ui/confirm-dialog';
import { cn } from '~/lib/utils';
import { taskService } from '~/services/httpServices/taskService';
import type { Task } from '~/types/task';

export default function TrashView() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteDialog = useConfirmDialog();

  const fetchTrash = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const response = await taskService.getTrash(projectId);
      setItems(Array.isArray(response) ? response : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to load trash';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const restoreItem = async (id: string) => {
    if (restoringId) return;
    setRestoringId(id);

    try {
      await taskService.restoreTask(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to restore task';
      setError(message);
    } finally {
      setRestoringId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setPendingDeleteId(id);
    deleteDialog.open();
  };

  const handlePermanentDelete = async () => {
    if (!pendingDeleteId || deletingId) return;
    setDeletingId(pendingDeleteId);

    try {
      await taskService.permanentlyDelete(pendingDeleteId);
      setItems((prev) => prev.filter((item) => item.id !== pendingDeleteId));
      deleteDialog.close();
      setPendingDeleteId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to permanently delete task';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const getDaysRemaining = (deletedAt?: string): number => {
    if (!deletedAt) return 30;
    const deleted = new Date(deletedAt);
    const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  };

  const formatDeletedDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <MobileShell>
        <MobileHeader title="Trash" showBack backTo={`/projects/${projectId}/board`} />
        <PageLoader />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <MobileHeader title="Trash" showBack backTo={`/projects/${projectId}/board`} />

      <main className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'none' }}>
        {/* Info Banner */}
        <div className="bg-[#FEF3C7] rounded-lg p-3 mb-3 flex items-start gap-3 border border-[#FCD34D]/20">
          <Info className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
          <p className="text-sm text-[#92400E] leading-relaxed">Tasks are permanently deleted after 30 days.</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
            <p className="text-xs text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
          </div>
        )}

        {items.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => {
              const daysRemaining = getDaysRemaining(item.deletedAt);
              const isWarning = daysRemaining <= 5;

              return (
                <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-lg p-3 transition-shadow hover:shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-sm font-medium text-[#1E293B] line-through decoration-[#94A3B8] decoration-1 opacity-75 leading-snug">{item.title}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#64748B]">
                      {item.assignee && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            Deleted by {item.assignee.fullName}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                        </>
                      )}
                      <span>{formatDeletedDate(item.deletedAt)}</span>
                      <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                      {isWarning ? (
                        <span className="text-[#F59E0B] font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {daysRemaining} days remaining
                        </span>
                      ) : (
                        <span>{daysRemaining} days remaining</span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-[#F1F5F9]">
                      <button
                        onClick={() => confirmDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="h-[32px] px-3 rounded-md text-[#EF4444] text-xs font-medium hover:bg-[#FEF2F2] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {deletingId === item.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Delete Permanently
                      </button>
                      <button
                        onClick={() => restoreItem(item.id)}
                        disabled={restoringId === item.id}
                        className="h-[32px] px-3 rounded-md border border-[#4A90D9] text-[#4A90D9] text-xs font-medium hover:bg-[#F0F9FF] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {restoringId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-3 text-[#10B981]">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h4 className="text-sm font-medium text-[#1E293B] mb-1">No deleted tasks</h4>
            <p className="text-xs text-[#64748B]">Trash is empty</p>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={() => {
          deleteDialog.close();
          setPendingDeleteId(null);
        }}
        onConfirm={handlePermanentDelete}
        title="Delete Permanently"
        description="This action cannot be undone. The task will be permanently deleted."
        confirmText="Delete Forever"
        variant="danger"
        isLoading={!!deletingId}
      />
    </MobileShell>
  );
}
