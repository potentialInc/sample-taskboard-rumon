import { useState, useCallback, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { DataTable } from '~/components/ui/data-table';
import type { ColumnDef } from '~/components/ui/data-table';
import { Modal } from '~/components/ui/modal';
import { Drawer, DrawerHeader } from '~/components/ui/drawer';
import { adminService } from '~/services/httpServices/adminService';
import type {
  AdminUser,
  AdminUserBackend,
  UserRole,
  UserRoleDisplay,
  UserStatus,
} from '~/types/admin';

// ============================================================
// Helpers
// ============================================================

const AVATAR_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-600' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-purple-100', text: 'text-purple-600' },
  { bg: 'bg-pink-100', text: 'text-pink-600' },
  { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  { bg: 'bg-teal-100', text: 'text-teal-600' },
  { bg: 'bg-orange-100', text: 'text-orange-600' },
  { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  { bg: 'bg-red-100', text: 'text-red-600' },
  { bg: 'bg-gray-100', text: 'text-gray-600' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string) {
  // Deterministic color based on id hash
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getRoleDisplay(role: UserRole): UserRoleDisplay {
  const map: Record<UserRole, UserRoleDisplay> = {
    admin: 'Admin',
    owner: 'Owner',
    member: 'Member',
  };
  return map[role] || 'Member';
}

function formatDate(dateStr: string): string {
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

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return formatDate(dateStr);
  } catch {
    return 'Unknown';
  }
}

function mapBackendUser(u: AdminUserBackend): AdminUser {
  const color = getAvatarColor(u.id);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.profilePhotoUrl ?? undefined,
    initials: getInitials(u.name),
    avatarBgColor: color.bg,
    avatarTextColor: color.text,
    role: u.role,
    roleDisplay: getRoleDisplay(u.role),
    status: u.isActive ? 'Active' : 'Inactive',
    isActive: u.isActive,
    jobTitle: u.jobTitle,
    projectsCount: null, // Not available from backend
    tasksCount: null, // Not available from backend
    registeredAt: formatDate(u.createdAt),
    lastActive: formatRelativeTime(u.lastActiveAt),
  };
}

// ============================================================
// Role badge styling
// ============================================================

const roleBadgeStyles: Record<UserRoleDisplay, string> = {
  Admin: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20',
  Owner: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
  Member: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
};

const statusDotColors: Record<UserStatus, string> = {
  Active: 'bg-[#10B981]',
  Inactive: 'bg-[#64748B]',
};

const statusTextColors: Record<UserStatus, string> = {
  Active: 'text-[#1E293B]',
  Inactive: 'text-[#64748B]',
};

// ============================================================
// Component
// ============================================================

export default function UserManagement() {
  // Data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId for loading state

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All Status'>('All Status');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal / Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState<AdminUser | null>(null);
  const [drawerTab, setDrawerTab] = useState<'Projects' | 'Tasks' | 'Activity'>('Projects');

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'member' as UserRole,
    password: '',
    jobTitle: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Show toast
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getUsers({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'All Status' ? statusFilter : undefined,
        page,
        limit,
      });
      const mappedUsers = result.users.map(mapBackendUser);
      setUsers(mappedUsers);
      setTotal(result.pagination.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search with debounce reset page
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Create user handler
  const handleCreateUser = useCallback(async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError('Please fill in all required fields');
      return;
    }
    if (createForm.password.length < 8) {
      setCreateError('Password must be at least 8 characters');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      await adminService.createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        jobTitle: createForm.jobTitle || undefined,
      });
      setCreateModalOpen(false);
      setCreateForm({ name: '', email: '', role: 'member', password: '', jobTitle: '' });
      setShowPassword(false);
      showToast('User created successfully', 'success');
      fetchUsers();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  }, [createForm, fetchUsers, showToast]);

  // Delete user handler
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      setActionLoading(userId);
      await adminService.deleteUser(userId);
      showToast('User deleted successfully', 'success');
      if (drawerUser?.id === userId) {
        setDrawerUser(null);
      }
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [fetchUsers, showToast, drawerUser]);

  // Suspend user handler
  const handleSuspendUser = useCallback(async (userId: string) => {
    try {
      setActionLoading(userId);
      await adminService.suspendUser(userId);
      showToast('User suspended successfully', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to suspend user', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [fetchUsers, showToast]);

  // Activate user handler
  const handleActivateUser = useCallback(async (userId: string) => {
    try {
      setActionLoading(userId);
      await adminService.activateUser(userId);
      showToast('User activated successfully', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to activate user', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [fetchUsers, showToast]);

  // Column definitions
  const columns: ColumnDef<AdminUser>[] = useMemo(
    () => [
      {
        id: 'user',
        header: 'User',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full ${row.avatarBgColor} flex items-center justify-center ${row.avatarTextColor} font-bold text-xs`}
            >
              {row.initials}
            </div>
            <span className="text-sm font-medium text-[#1E293B]">{row.name}</span>
          </div>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        render: (row) => <span className="text-sm text-[#64748B]">{row.email}</span>,
      },
      {
        id: 'role',
        header: 'Role',
        render: (row) => (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${roleBadgeStyles[row.roleDisplay]}`}
          >
            {row.roleDisplay}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${statusDotColors[row.status]}`} />
            <span className={`text-sm ${statusTextColors[row.status]}`}>{row.status}</span>
          </div>
        ),
      },
      {
        id: 'projects',
        header: 'Projects',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        render: (row) => (
          <span className="text-sm text-[#64748B]">
            {row.projectsCount !== null ? row.projectsCount : '\u2014'}
          </span>
        ),
      },
      {
        id: 'tasks',
        header: 'Tasks',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        render: (row) => (
          <span className="text-sm text-[#64748B]">
            {row.tasksCount !== null ? row.tasksCount : '\u2014'}
          </span>
        ),
      },
      {
        id: 'registered',
        header: 'Registered',
        render: (row) => <span className="text-sm text-[#64748B]">{row.registeredAt}</span>,
      },
      {
        id: 'lastActive',
        header: 'Last Active',
        render: (row) => <span className="text-sm text-[#64748B]">{row.lastActive}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        render: (row) => (
          <div data-action-cell className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setDrawerUser(row)}
              className="p-1.5 text-[#64748B] hover:text-[#4A90D9] hover:bg-blue-50 rounded-md transition-colors"
              title="View details"
            >
              <Icon icon="solar:pen-linear" width={16} />
            </button>
            {row.isActive ? (
              <button
                onClick={() => handleSuspendUser(row.id)}
                disabled={actionLoading === row.id}
                className="p-1.5 text-[#64748B] hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
                title="Suspend user"
              >
                {actionLoading === row.id ? (
                  <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />
                ) : (
                  <Icon icon="solar:forbidden-circle-linear" width={16} />
                )}
              </button>
            ) : (
              <button
                onClick={() => handleActivateUser(row.id)}
                disabled={actionLoading === row.id}
                className="p-1.5 text-[#64748B] hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                title="Activate user"
              >
                {actionLoading === row.id ? (
                  <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />
                ) : (
                  <Icon icon="solar:check-circle-linear" width={16} />
                )}
              </button>
            )}
            <button
              onClick={() => handleDeleteUser(row.id)}
              disabled={actionLoading === row.id}
              className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Delete user"
            >
              <Icon icon="solar:trash-bin-trash-linear" width={16} />
            </button>
          </div>
        ),
      },
    ],
    [actionLoading, handleSuspendUser, handleActivateUser, handleDeleteUser]
  );

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
          <span className="text-[#1E293B] font-medium">User Management</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">User Management</h1>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <Icon icon="solar:danger-circle-linear" className="text-red-500 flex-shrink-0" width={20} />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchUsers}
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Action Bar */}
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
              placeholder="Search users by name or email..."
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | 'all');
                setPage(1);
              }}
              className="appearance-none h-full pl-3 pr-8 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] cursor-pointer min-w-[120px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="member">Member</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#64748B]">
              <Icon icon="solar:alt-arrow-down-linear" width={12} />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus | 'All Status');
                setPage(1);
              }}
              className="appearance-none h-full pl-3 pr-8 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] cursor-pointer min-w-[120px]"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#64748B]">
              <Icon icon="solar:alt-arrow-down-linear" width={12} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          <div className="relative">
            <button
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-3 py-2 border border-[#E5E7EB] rounded-lg bg-gray-50 text-[#94A3B8] text-sm font-medium cursor-not-allowed disabled:opacity-60"
            >
              <span>Bulk Actions</span>
              <Icon icon="solar:alt-arrow-down-linear" width={12} />
            </button>
          </div>

          {/* Create User */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A90D9] hover:bg-[#3b82f6] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Icon icon="solar:refresh-linear" width={32} className="text-[#4A90D9] animate-spin" />
            <p className="text-sm text-[#64748B]">Loading users...</p>
          </div>
        </div>
      ) : (
        <DataTable<AdminUser>
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(u) => setDrawerUser(u)}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          entityName="users"
        />
      )}

      <div className="h-8" />

      {/* ============================================================ */}
      {/* Create User Modal */}
      {/* ============================================================ */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setShowPassword(false);
          setCreateError(null);
          setCreateForm({ name: '', email: '', role: 'member', password: '', jobTitle: '' });
        }}
        title="Create New User"
        description="Add a new member to the workspace"
        icon="solar:user-plus-linear"
        footer={
          <>
            <button
              onClick={() => {
                setCreateModalOpen(false);
                setShowPassword(false);
                setCreateError(null);
                setCreateForm({ name: '', email: '', role: 'member', password: '', jobTitle: '' });
              }}
              className="h-[40px] px-5 flex items-center justify-center border border-[#E5E7EB] text-sm font-medium text-[#64748B] rounded-lg hover:bg-white hover:text-[#1E293B] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              disabled={createLoading}
              className="h-[40px] px-5 flex items-center gap-2 justify-center bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3b82f6] transition-all shadow-sm disabled:opacity-60"
            >
              {createLoading ? (
                <Icon icon="solar:refresh-linear" width={16} height={16} className="animate-spin" />
              ) : (
                <Icon icon="solar:add-circle-linear" width={16} height={16} />
              )}
              {createLoading ? 'Creating...' : 'Create User'}
            </button>
          </>
        }
      >
        {/* Create Error */}
        {createError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <Icon icon="solar:danger-circle-linear" width={16} />
            {createError}
          </div>
        )}

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E293B]">
            Full Name <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Jane Smith"
            className="h-[44px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E293B]">
            Email Address <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="e.g. jane@company.com"
            className="h-[44px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
          />
        </div>

        {/* Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E293B]">
            Role <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full h-[44px] px-4 appearance-none rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
            >
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="member">Member</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
              <Icon icon="solar:alt-arrow-down-linear" width={14} />
            </div>
          </div>
        </div>

        {/* Job Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E293B]">Job Title</label>
          <input
            type="text"
            value={createForm.jobTitle}
            onChange={(e) => setCreateForm((f) => ({ ...f, jobTitle: e.target.value }))}
            placeholder="e.g. Product Designer"
            className="h-[44px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1E293B]">
            Password <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Minimum 8 characters"
              className="w-full h-[44px] px-4 pr-11 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8] hover:text-[#64748B] transition-colors"
            >
              <Icon
                icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
                width={20}
                height={20}
              />
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* User Detail Drawer */}
      {/* ============================================================ */}
      <Drawer
        isOpen={drawerUser !== null}
        onClose={() => setDrawerUser(null)}
        footer={
          <div className="flex justify-between items-center w-full">
            <button
              onClick={() => drawerUser && handleDeleteUser(drawerUser.id)}
              className="text-sm font-medium text-[#EF4444] hover:text-red-700 transition-colors hover:bg-red-50 px-3 py-2 rounded-lg"
            >
              Delete User
            </button>
            <button
              onClick={() => setDrawerUser(null)}
              className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1E293B] hover:bg-gray-50 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        }
      >
        {drawerUser && (
          <>
            {/* Header */}
            <DrawerHeader onClose={() => setDrawerUser(null)}>
              <div className="px-5 pt-5 pb-6 border-b border-[#E5E7EB] flex flex-col items-center">
                <div
                  className={`w-[64px] h-[64px] rounded-full ${drawerUser.avatarBgColor} flex items-center justify-center ${drawerUser.avatarTextColor} font-bold text-2xl mb-3 mt-2`}
                >
                  {drawerUser.initials}
                </div>
                <h2 className="text-[20px] font-bold text-[#1E293B] tracking-tight mb-0.5">
                  {drawerUser.name}
                </h2>
                <p className="text-[14px] text-[#64748B] mb-3">{drawerUser.email}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${roleBadgeStyles[drawerUser.roleDisplay]}`}
                  >
                    {drawerUser.roleDisplay}
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E5E7EB] bg-white">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDotColors[drawerUser.status]}`} />
                    <span className="text-xs font-medium text-[#1E293B]">{drawerUser.status}</span>
                  </div>
                </div>
              </div>
            </DrawerHeader>

            {/* Account Actions */}
            <div className="p-4 flex gap-2">
              <button className="flex-1 py-2 px-3 border border-[#4A90D9] text-[#4A90D9] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors bg-white">
                Edit User
              </button>
              {drawerUser.isActive ? (
                <button
                  onClick={() => handleSuspendUser(drawerUser.id)}
                  disabled={actionLoading === drawerUser.id}
                  className="flex-1 py-2 px-3 border border-[#E5E7EB] text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors bg-white disabled:opacity-50"
                >
                  {actionLoading === drawerUser.id ? 'Suspending...' : 'Suspend'}
                </button>
              ) : (
                <button
                  onClick={() => handleActivateUser(drawerUser.id)}
                  disabled={actionLoading === drawerUser.id}
                  className="flex-1 py-2 px-3 border border-[#E5E7EB] text-emerald-500 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors bg-white disabled:opacity-50"
                >
                  {actionLoading === drawerUser.id ? 'Activating...' : 'Activate'}
                </button>
              )}
              <button
                onClick={() => handleDeleteUser(drawerUser.id)}
                className="py-2 px-3 border border-[#E5E7EB] text-[#EF4444] rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-200 transition-colors bg-white"
              >
                Delete
              </button>
            </div>

            {/* Info Grid */}
            <div className="px-4 pb-6 grid grid-cols-2 gap-y-4 gap-x-3">
              <div>
                <p className="text-[12px] text-[#64748B] mb-1">Job Title</p>
                <p className="text-[14px] font-medium text-[#1E293B]">
                  {drawerUser.jobTitle || '\u2014'}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] mb-1">Role</p>
                <p className="text-[14px] font-medium text-[#1E293B]">{drawerUser.roleDisplay}</p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] mb-1">Registered</p>
                <p className="text-[14px] font-medium text-[#1E293B]">{drawerUser.registeredAt}</p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] mb-1">Last Active</p>
                <p className="text-[14px] font-medium text-[#1E293B]">{drawerUser.lastActive}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-[#E5E7EB]">
              <div className="flex border-b border-[#E5E7EB] px-4">
                {(['Projects', 'Tasks', 'Activity'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className={`px-4 py-3 text-sm font-medium border-b-[2px] transition-colors ${
                      drawerTab === tab
                        ? 'text-[#4A90D9] border-[#4A90D9]'
                        : 'text-[#64748B] hover:text-[#1E293B] border-transparent'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content: Projects */}
            {drawerTab === 'Projects' && (
              <div className="p-4 text-sm text-[#64748B] text-center">
                Project assignments coming soon...
              </div>
            )}

            {drawerTab === 'Tasks' && (
              <div className="p-4 text-sm text-[#64748B] text-center">
                Task list coming soon...
              </div>
            )}

            {drawerTab === 'Activity' && (
              <div className="p-4 text-sm text-[#64748B] text-center">
                Activity log coming soon...
              </div>
            )}

            <div className="h-4" />
          </>
        )}
      </Drawer>
    </>
  );
}
