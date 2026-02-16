import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { GripVertical, Trash2, PlusCircle, Calendar, AlertTriangle, Loader2, X } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import MobileHeader from '~/components/layout/MobileHeader';
import { UserAvatar } from '~/components/ui/user-avatar';
import { PageLoader } from '~/components/ui/loading-spinner';
import { ConfirmDialog, useConfirmDialog } from '~/components/ui/confirm-dialog';
import { cn } from '~/lib/utils';
import { projectService } from '~/services/httpServices/projectService';
import type { Project, Column, ProjectMember } from '~/types/project';

export default function BoardSettings() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [boardDeadline, setBoardDeadline] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Column operations
  const [addingColumn, setAddingColumn] = useState(false);
  const [removingColumnId, setRemovingColumnId] = useState<string | null>(null);
  const [updatingColumnId, setUpdatingColumnId] = useState<string | null>(null);

  // Member operations
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showInviteInput, setShowInviteInput] = useState(false);

  // Danger zone
  const [archiving, setArchiving] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const deleteProjectDialog = useConfirmDialog();
  const archiveDialog = useConfirmDialog();

  const fetchSettings = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const [projectResponse, columnsResponse, membersResponse] = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getColumns(projectId),
        projectService.getMembers(projectId).catch(() => [] as ProjectMember[]),
      ]);

      const projectData = projectResponse;
      const columnsData = Array.isArray(columnsResponse) ? columnsResponse : [];
      const membersData = Array.isArray(membersResponse) ? membersResponse : [];

      setProject(projectData);
      setColumns(columnsData);
      setMembers(membersData);

      setBoardTitle(projectData?.title ?? '');
      setBoardDescription(projectData?.description || '');
      setBoardDeadline(projectData?.deadline || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to load settings';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveInfo = async () => {
    if (!projectId || savingInfo) return;
    setSavingInfo(true);
    setError(null);

    try {
      const updated = await projectService.updateProject(projectId, {
        title: boardTitle,
        description: boardDescription,
        deadline: boardDeadline || undefined,
      });
      setProject(updated);
      showSuccess('Project info saved');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save project info';
      setError(message);
    } finally {
      setSavingInfo(false);
    }
  };

  // Column operations
  const updateColumnName = async (columnId: string, name: string) => {
    setColumns((prev) => prev.map((c) => c.id === columnId ? { ...c, title: name } : c));
  };

  const updateWipLimit = async (columnId: string, wipLimit: number) => {
    setColumns((prev) => prev.map((c) => c.id === columnId ? { ...c, wipLimit } : c));
  };

  const saveColumn = async (column: Column) => {
    setUpdatingColumnId(column.id);
    try {
      await projectService.updateColumn(column.id, {
        name: column.title,
        wipLimit: column.wipLimit || undefined,
      });
      showSuccess('Column updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update column';
      setError(message);
    } finally {
      setUpdatingColumnId(null);
    }
  };

  const removeColumn = async (columnId: string) => {
    if (columns.length <= 2) return;
    setRemovingColumnId(columnId);

    try {
      await projectService.deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      showSuccess('Column removed');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove column';
      setError(message);
    } finally {
      setRemovingColumnId(null);
    }
  };

  const addColumn = async () => {
    if (!projectId || columns.length >= 8 || addingColumn) return;
    setAddingColumn(true);

    try {
      const created = await projectService.createColumn(projectId, { name: 'New Column' });
      setColumns((prev) => [...prev, created]);
      showSuccess('Column added');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add column';
      setError(message);
    } finally {
      setAddingColumn(false);
    }
  };

  // Member operations
  const handleAddMember = async () => {
    if (!projectId || !newMemberEmail.trim() || addingMember) return;
    setAddingMember(true);
    setError(null);

    try {
      const result = await projectService.addMembers(projectId, [newMemberEmail.trim()]);
      const invited = result?.invited ?? [];
      const alreadyMembers = result?.alreadyMembers ?? [];

      if (alreadyMembers?.length > 0) {
        setError(`${alreadyMembers.join(', ')} is already a member`);
      }

      if (invited?.length > 0) {
        // Refetch members to get the updated list with full member details
        const updatedMembers = await projectService.getMembers(projectId);
        setMembers(Array.isArray(updatedMembers) ? updatedMembers : []);
        showSuccess('Member invited');
      }

      setNewMemberEmail('');
      setShowInviteInput(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to invite member';
      setError(message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!projectId || removingMemberId) return;
    setRemovingMemberId(userId);

    try {
      await projectService.removeMember(projectId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      showSuccess('Member removed');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      setError(message);
    } finally {
      setRemovingMemberId(null);
    }
  };

  // Danger zone operations
  const handleArchive = async () => {
    if (!projectId || archiving) return;
    setArchiving(true);

    try {
      await projectService.archiveProject(projectId);
      archiveDialog.close();
      navigate('/projects');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to archive project';
      setError(message);
      setArchiving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId || deletingProject) return;
    setDeletingProject(true);

    try {
      await projectService.deleteProject(projectId);
      deleteProjectDialog.close();
      navigate('/projects');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      setError(message);
      setDeletingProject(false);
    }
  };

  const getMemberInitials = (name: string): string => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <MobileShell>
        <MobileHeader title="Board Settings" showBack backTo={`/projects/${projectId}/board`} />
        <PageLoader />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <MobileHeader title="Board Settings" showBack backTo={`/projects/${projectId}/board`} />

      <main className="flex-1 overflow-y-auto p-3 pb-6 flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <p className="text-xs text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Section 1: Project Info */}
        <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
          <h4 className="text-sm font-semibold tracking-tight text-[#1E293B] mb-3">Project Info</h4>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#1E293B]">Board Title</label>
              <input
                type="text"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                className="h-9 px-3 rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all w-full text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#1E293B]">Description</label>
              <textarea
                rows={3}
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                className="p-2.5 rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all w-full text-sm resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#1E293B]">Deadline</label>
              <div className="relative">
                <input
                  type="date"
                  value={boardDeadline ? boardDeadline.split('T')[0] : ''}
                  onChange={(e) => setBoardDeadline(e.target.value)}
                  className="h-9 px-3 pl-9 rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all w-full text-sm"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              </div>
            </div>

            <button
              onClick={handleSaveInfo}
              disabled={savingInfo}
              className="h-9 px-4 rounded-md bg-[#4A90D9] text-white text-sm font-medium hover:bg-[#3B82F6] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 self-end"
            >
              {savingInfo && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </section>

        {/* Section 2: Columns */}
        <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
          <h4 className="text-sm font-semibold tracking-tight text-[#1E293B] mb-3">Columns</h4>

          <div className="flex flex-col gap-2 mb-4">
            {columns?.map((col) => (
              <div key={col.id} className="flex items-center gap-2 group">
                <div className="text-[#94A3B8] cursor-move hover:text-[#64748B] p-1">
                  <GripVertical className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={col.title}
                  onChange={(e) => updateColumnName(col.id, e.target.value)}
                  onBlur={() => saveColumn(col)}
                  className="h-8 px-2.5 flex-grow rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] transition-all text-xs"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#64748B] whitespace-nowrap">WIP</label>
                  <input
                    type="number"
                    value={col.wipLimit || 0}
                    onChange={(e) => updateWipLimit(col.id, Number(e.target.value))}
                    onBlur={() => saveColumn(col)}
                    className="h-8 w-[52px] px-1.5 text-center rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] transition-all text-xs"
                  />
                </div>
                <button
                  onClick={() => removeColumn(col.id)}
                  disabled={columns.length <= 2 || removingColumnId === col.id}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors disabled:opacity-30"
                  aria-label={`Remove column ${col.title}`}
                >
                  {removingColumnId === col.id ? (
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  ) : (
                    <Trash2 className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addColumn}
            disabled={columns.length >= 8 || addingColumn}
            className="w-full h-8 flex items-center justify-center gap-1.5 rounded-md border border-[#E5E7EB] text-[#4A90D9] font-medium hover:bg-[#F9FAFB] hover:border-[#4A90D9]/50 transition-colors text-xs disabled:opacity-50"
          >
            {addingColumn ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <PlusCircle className="w-[18px] h-[18px]" />}
            Add Column
          </button>
        </section>

        {/* Section 3: Members */}
        <section className="bg-white rounded-lg p-3 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold tracking-tight text-[#1E293B]">Members</h4>
              <span className="bg-[#F1F5F9] text-[#64748B] text-xs font-medium px-2 py-0.5 rounded-full">{members.length}</span>
            </div>
            <button
              onClick={() => setShowInviteInput(!showInviteInput)}
              className="text-xs font-medium text-[#4A90D9] hover:text-[#3B82F6] transition-colors"
            >
              {showInviteInput ? 'Cancel' : 'Invite'}
            </button>
          </div>

          {/* Invite Input */}
          {showInviteInput && (
            <div className="flex items-center gap-2 mb-3">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                placeholder="Enter email address..."
                className="h-8 px-2.5 flex-grow rounded-md border border-[#E5E7EB] bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] transition-all text-xs placeholder-[#94A3B8]"
              />
              <button
                onClick={handleAddMember}
                disabled={addingMember || !newMemberEmail.trim()}
                className="h-8 px-3 rounded-md bg-[#4A90D9] text-white text-xs font-medium hover:bg-[#3B82F6] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {addingMember && <Loader2 className="w-3 h-3 animate-spin" />}
                Send
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {members?.map((member, index) => (
              <div key={member.id}>
                <div className="flex items-center justify-between p-1">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={member.avatar}
                      name={member.fullName}
                      size="md"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#1E293B] leading-none mb-1">{member.fullName}</span>
                      <span className="text-xs text-[#64748B] leading-none">{member.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-[#F1F5F9] text-[#64748B] text-xs px-2 py-1 rounded font-medium capitalize">{member.role}</span>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={removingMemberId === member.userId}
                        className="text-xs font-medium text-[#EF4444] hover:text-[#B91C1C] transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {removingMemberId === member.userId && <Loader2 className="w-3 h-3 animate-spin" />}
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {index < members.length - 1 && <div className="h-px bg-[#F1F5F9] w-full mt-3" />}
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-lg p-4 border border-[#EF4444]/30 shadow-sm relative overflow-visible">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-[#EF4444]/20" />

          <h4 className="text-sm font-semibold tracking-tight text-[#EF4444] mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-[18px] h-[18px]" />
            Danger Zone
          </h4>

          <div className="flex flex-col gap-2">
            <button
              onClick={archiveDialog.open}
              className="w-full h-12 flex items-center justify-center rounded-lg border border-[#F59E0B] text-[#D97706] font-medium hover:bg-[#FFFBEB] transition-colors text-sm"
            >
              Archive Project
            </button>
            <button
              onClick={deleteProjectDialog.open}
              className="w-full h-12 flex items-center justify-center rounded-lg bg-[#EF4444] text-white font-medium hover:bg-[#DC2626] transition-colors shadow-sm text-sm"
            >
              Delete Project
            </button>
          </div>
          <p className="text-[10px] text-[#64748B] mt-3 text-center">Once you delete a project, there is no going back. Please be certain.</p>
        </section>
      </main>

      {/* Archive Confirmation */}
      <ConfirmDialog
        open={archiveDialog.isOpen}
        onClose={archiveDialog.close}
        onConfirm={handleArchive}
        title="Archive Project"
        description="This project will be archived and hidden from the active projects list. You can restore it later."
        confirmText="Archive"
        isLoading={archiving}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteProjectDialog.isOpen}
        onClose={deleteProjectDialog.close}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        description="This action cannot be undone. All tasks, columns, and data associated with this project will be permanently deleted."
        confirmText="Delete Project"
        variant="danger"
        isLoading={deletingProject}
      />
    </MobileShell>
  );
}
