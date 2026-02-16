import { useState, useMemo, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { DataTable } from '~/components/ui/data-table';
import type { ColumnDef } from '~/components/ui/data-table';
import { Drawer } from '~/components/ui/drawer';
import { adminService } from '~/services/httpServices/adminService';
import type {
  AdminProject,
  AdminProjectBackend,
  ProjectStatus,
  ProjectStatusDisplay,
  ProjectActivity,
} from '~/types/admin';

// ============================================================
// Helpers
// ============================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getStatusDisplay(status: ProjectStatus): ProjectStatusDisplay {
  const map: Record<ProjectStatus, ProjectStatusDisplay> = {
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
  };
  return map[status] || 'Active';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function mapBackendProject(p: AdminProjectBackend): AdminProject {
  return {
    id: p.id,
    name: p.title,
    description: p.description ?? undefined,
    owner: p.owner?.name ?? 'Unknown',
    ownerInitials: p.owner?.name ? getInitials(p.owner.name) : '??',
    ownerEmail: p.owner?.email ?? '',
    status: p.status,
    statusDisplay: getStatusDisplay(p.status),
    completionRate: Math.round(Number(p.completionPercentage) || 0),
    createdAt: formatDate(p.createdAt),
    deadline: formatDate(p.deadline),
  };
}

// ============================================================
// Status badge styling
// ============================================================

const statusBadgeStyles: Record<ProjectStatusDisplay, string> = {
  Active: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
  Completed: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
  Archived: 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20',
};

// ============================================================
// Static drawer data (backend doesn't have per-project detail endpoints)
// ============================================================

const mockDrawerActivities: ProjectActivity[] = [
  { id: '1', description: "Owner moved 'Task A' to In Review", timestamp: '2h ago', dotColor: 'bg-[#4A90D9]' },
  { id: '2', description: "Member completed 'Task B'", timestamp: '4h ago', dotColor: 'bg-[#10B981]' },
  { id: '3', description: 'Files uploaded', timestamp: 'Yesterday', dotColor: 'bg-[#8B5CF6]' },
  { id: '4', description: "New task created 'Task C'", timestamp: '2 days ago', dotColor: 'bg-[#F59E0B]' },
];

// ============================================================
// Component
// ============================================================

export default function ProjectManagement() {
  // Data state
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drawer
  const [drawerProject, setDrawerProject] = useState<AdminProject | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getProjects({
        search: search || undefined,
        page,
        limit,
      });
      const mappedProjects = result.projects.map(mapBackendProject);
      setProjects(mappedProjects);
      setTotal(result.pagination.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Delete project handler
  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    try {
      setActionLoading(projectId);
      await adminService.deleteProject(projectId);
      showToast('Project deleted successfully', 'success');
      if (drawerProject?.id === projectId) {
        setDrawerProject(null);
      }
      fetchProjects();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete project', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [fetchProjects, showToast, drawerProject]);

  // Column definitions
  const columns: ColumnDef<AdminProject>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Project Name',
        render: (row) => (
          <span className="text-sm font-semibold text-[#1E293B]">{row.name}</span>
        ),
      },
      {
        id: 'owner',
        header: 'Owner',
        render: (row) => <span className="text-sm text-[#1E293B]">{row.owner}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        render: (row) => (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusBadgeStyles[row.statusDisplay]}`}
          >
            {row.statusDisplay}
          </span>
        ),
      },
      {
        id: 'completion',
        header: 'Completion %',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="w-[60px] h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${row.completionRate === 100 ? 'bg-[#10B981]' : 'bg-[#4A90D9]'}`}
                style={{ width: `${row.completionRate}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[#64748B]">{row.completionRate}%</span>
          </div>
        ),
      },
      {
        id: 'created',
        header: 'Created',
        render: (row) => <span className="text-sm text-[#64748B]">{row.createdAt}</span>,
      },
      {
        id: 'deadline',
        header: 'Deadline',
        render: (row) => <span className="text-sm text-[#64748B]">{row.deadline}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        render: (row) => (
          <div data-action-cell className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setDrawerProject(row)}
              className="p-1.5 text-[#64748B] hover:text-[#4A90D9] hover:bg-blue-50 rounded-md transition-colors"
              title="View details"
            >
              <Icon icon="solar:eye-linear" width={16} />
            </button>
            <button
              onClick={() => handleDeleteProject(row.id)}
              disabled={actionLoading === row.id}
              className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Delete project"
            >
              {actionLoading === row.id ? (
                <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />
              ) : (
                <Icon icon="solar:trash-bin-trash-linear" width={16} />
              )}
            </button>
          </div>
        ),
      },
    ],
    [actionLoading, handleDeleteProject]
  );

  // Drawer computed values
  const drawerCircumference = 175.9;
  const drawerOffset = drawerProject
    ? drawerCircumference * (1 - drawerProject.completionRate / 100)
    : drawerCircumference;

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg border flex items-center gap-2 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <Icon
            icon={toast.type === 'success' ? 'solar:check-circle-linear' : 'solar:danger-circle-linear'}
            width={18}
          />
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-current opacity-60 hover:opacity-100"
          >
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {/* Breadcrumb & Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-[#64748B] mb-1">
          <span>Admin</span>
          <Icon icon="solar:alt-arrow-right-linear" width={12} height={12} />
          <span className="text-[#1E293B] font-medium">Project Management</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">Project Management</h1>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <Icon icon="solar:danger-circle-linear" className="text-red-500 flex-shrink-0" width={20} />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchProjects}
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-[320px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
              <Icon icon="solar:magnifer-linear" width={18} height={18} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="block w-full pl-10 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
              placeholder="Search projects by name..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Create Project button - disabled since admin doesn't have create endpoint */}
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-[#4A90D9]/50 text-white rounded-lg text-sm font-medium cursor-not-allowed shadow-sm"
            title="Use the main app to create projects"
          >
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Info banner about create project */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-sm text-blue-700">
        <Icon icon="solar:info-circle-linear" width={16} className="flex-shrink-0" />
        <span>Projects are created through the main application. Admin can view and delete projects here.</span>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Icon icon="solar:refresh-linear" width={32} className="text-[#4A90D9] animate-spin" />
            <p className="text-sm text-[#64748B]">Loading projects...</p>
          </div>
        </div>
      ) : (
        <DataTable<AdminProject>
          columns={columns}
          data={projects}
          keyExtractor={(p) => p.id}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(p) => setDrawerProject(p)}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          entityName="projects"
        />
      )}

      <div className="h-8" />

      {/* ============================================================ */}
      {/* Project Detail Drawer */}
      {/* ============================================================ */}
      <Drawer
        isOpen={drawerProject !== null}
        onClose={() => setDrawerProject(null)}
        footer={
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => setDrawerProject(null)}
              className="flex-1 h-[40px] flex items-center justify-center border border-[#64748B] text-[#64748B] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => drawerProject && handleDeleteProject(drawerProject.id)}
              disabled={!!actionLoading}
              className="flex-1 h-[40px] flex items-center justify-center bg-[#EF4444] text-white rounded-lg text-sm font-medium hover:bg-[#DC2626] transition-colors shadow-sm disabled:opacity-50"
            >
              {actionLoading === drawerProject?.id ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        }
      >
        {drawerProject && (
          <>
            {/* Header */}
            <div className="p-6 border-b border-[#E5E7EB]">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-2xl font-semibold text-[#1E293B] tracking-tight pr-8">
                  {drawerProject.name}
                </h3>
                <button
                  onClick={() => setDrawerProject(null)}
                  className="text-[#94A3B8] hover:text-[#64748B] transition-colors flex-shrink-0"
                >
                  <Icon icon="solar:close-circle-linear" width={24} height={24} />
                </button>
              </div>
              <p className="text-base text-[#64748B] leading-relaxed mb-6 line-clamp-2">
                {drawerProject.description ?? 'No description provided.'}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#64748B] w-16">Deadline</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-[#F59E0B] border border-amber-100">
                      {drawerProject.deadline}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#64748B] w-16">Status</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusBadgeStyles[drawerProject.statusDisplay]}`}
                    >
                      {drawerProject.statusDisplay}
                    </span>
                  </div>
                </div>
                {/* Circular Progress */}
                <div className="relative w-[64px] h-[64px] flex items-center justify-center">
                  <svg className="transform -rotate-90 w-full h-full">
                    <circle cx="32" cy="32" r="28" stroke="#E2E8F0" strokeWidth="4" fill="transparent" />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#4A90D9"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={drawerCircumference}
                      strokeDashoffset={drawerOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[18px] font-bold text-[#1E293B]">
                    {drawerProject.completionRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                  {drawerProject.ownerInitials}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1E293B]">{drawerProject.owner}</span>
                  <span className="text-sm text-[#4A90D9]">Project Owner</span>
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Created</p>
                  <p className="text-[14px] font-medium text-[#1E293B]">{drawerProject.createdAt}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Deadline</p>
                  <p className="text-[14px] font-medium text-[#1E293B]">{drawerProject.deadline}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Completion</p>
                  <p className="text-[14px] font-medium text-[#1E293B]">{drawerProject.completionRate}%</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#64748B] mb-1">Owner Email</p>
                  <p className="text-[14px] font-medium text-[#1E293B]">{drawerProject.ownerEmail || '\u2014'}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity (static) */}
            <div className="px-6 py-4">
              <h4 className="text-base font-semibold text-[#1E293B] mb-3">Recent Activity</h4>
              <div className="space-y-4 relative">
                <div className="absolute left-1.5 top-1.5 bottom-1.5 w-[1px] bg-[#E5E7EB]" />
                {mockDrawerActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 relative">
                    <div
                      className={`w-3 h-3 mt-1.5 rounded-full ${activity.dotColor} ring-4 ring-white z-10`}
                    />
                    <div className="flex flex-col">
                      <p className="text-sm text-[#1E293B]">{activity.description}</p>
                      <span className="text-xs text-[#94A3B8] mt-0.5">{activity.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
