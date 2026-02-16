import { useState, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { adminService } from '~/services/httpServices/adminService';
import type { AdminSettings } from '~/types/admin';

// ============================================================
// Types
// ============================================================

interface KanbanColumn {
  id: string;
  name: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

// ============================================================
// Static Data (not in backend settings)
// ============================================================

const initialColumns: KanbanColumn[] = [
  { id: '1', name: 'To Do' },
  { id: '2', name: 'In Progress' },
  { id: '3', name: 'In Review' },
  { id: '4', name: 'Done' },
];

const initialLabels: Label[] = [
  { id: '1', name: 'Bug', color: '#EF4444' },
  { id: '2', name: 'Feature', color: '#10B981' },
  { id: '3', name: 'Design', color: '#8B5CF6' },
  { id: '4', name: 'Documentation', color: '#3B82F6' },
  { id: '5', name: 'Improvement', color: '#F59E0B' },
];

const LABEL_COLOR_PRESETS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

// ============================================================
// Component
// ============================================================

export default function SystemConfiguration() {
  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // General Settings (from API)
  const [maxFileSize, setMaxFileSize] = useState(10);
  const [fileTypes, setFileTypes] = useState<string[]>(['PDF', 'PNG', 'JPG', 'DOCX', 'XLSX']);
  const [newFileType, setNewFileType] = useState('');
  const [maxProjectsPerUser, setMaxProjectsPerUser] = useState(50);
  const [maxMembersPerProject, setMaxMembersPerProject] = useState(100);
  const [trashRetentionDays, setTrashRetentionDays] = useState(30);

  // Kanban columns (local only, not in backend settings yet)
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);

  // Notification Settings (local only, not in backend settings yet)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState('Weekly');
  const [deadlineReminder, setDeadlineReminder] = useState(24);

  // Label Configuration (local only)
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#94A3B8');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await adminService.getSettings();
      // Map API settings to state
      // Backend returns maxFileSize in bytes, convert to MB
      setMaxFileSize(Math.round(settings.maxFileSize / (1024 * 1024)));
      setFileTypes(settings.allowedFileTypes.map((t) => t.toUpperCase()));
      setMaxProjectsPerUser(settings.maxProjectsPerUser);
      setMaxMembersPerProject(settings.maxMembersPerProject);
      setTrashRetentionDays(settings.trashRetentionDays);
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save settings handler
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      await adminService.updateSettings({
        maxFileSize: maxFileSize * 1024 * 1024, // Convert MB back to bytes
        allowedFileTypes: fileTypes.map((t) => t.toLowerCase()),
        maxProjectsPerUser,
        maxMembersPerProject,
        trashRetentionDays,
      });
      setSaveSuccess(true);
      showToast('Settings saved successfully', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }, [maxFileSize, fileTypes, maxProjectsPerUser, maxMembersPerProject, trashRetentionDays, showToast]);

  // Discard changes
  const handleDiscard = useCallback(() => {
    fetchSettings();
    showToast('Changes discarded', 'success');
  }, [fetchSettings, showToast]);

  // ---- Kanban Column Handlers ----

  const handleColumnNameChange = useCallback((id: string, name: string) => {
    setColumns((prev) => prev.map((col) => (col.id === id ? { ...col, name } : col)));
  }, []);

  const handleRemoveColumn = useCallback((id: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== id));
  }, []);

  const handleAddColumn = useCallback(() => {
    const newId = String(Date.now());
    setColumns((prev) => [...prev, { id: newId, name: '' }]);
  }, []);

  // ---- File Type Handlers ----

  const handleRemoveFileType = useCallback((type: string) => {
    setFileTypes((prev) => prev.filter((t) => t !== type));
  }, []);

  const handleAddFileType = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && newFileType.trim()) {
        const normalized = newFileType.trim().toUpperCase();
        if (!fileTypes.includes(normalized)) {
          setFileTypes((prev) => [...prev, normalized]);
        }
        setNewFileType('');
      }
    },
    [newFileType, fileTypes]
  );

  // ---- Label Handlers ----

  const handleRemoveLabel = useCallback((id: string) => {
    setLabels((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleAddLabel = useCallback(() => {
    if (!newLabelName.trim()) return;
    const newId = String(Date.now());
    setLabels((prev) => [...prev, { id: newId, name: newLabelName.trim(), color: newLabelColor }]);
    setNewLabelName('');
    setNewLabelColor('#94A3B8');
  }, [newLabelName, newLabelColor]);

  // Loading state
  if (loading) {
    return (
      <>
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <span>Admin</span>
              <Icon icon="solar:alt-arrow-right-linear" width={12} height={12} />
              <span className="text-[#1E293B] font-medium">System Configuration</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1E293B]">System Configuration</h1>
          </div>
        </header>
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Icon icon="solar:refresh-linear" width={32} className="text-[#4A90D9] animate-spin" />
            <p className="text-sm text-[#64748B]">Loading settings...</p>
          </div>
        </div>
      </>
    );
  }

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

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <span>Admin</span>
            <Icon icon="solar:alt-arrow-right-linear" width={12} height={12} />
            <span className="text-[#1E293B] font-medium">System Configuration</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1E293B]">System Configuration</h1>
          <p className="text-sm text-[#64748B]">Platform-wide settings affecting all users and projects</p>
        </div>

        {/* Save / Discard Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDiscard}
            disabled={saving}
            className="h-[36px] px-4 flex items-center justify-center border border-[#E5E7EB] text-sm font-medium text-[#64748B] rounded-lg hover:bg-[#F8FAFC] hover:text-[#1E293B] transition-all disabled:opacity-50"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-[36px] px-5 flex items-center justify-center gap-2 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3b82f6] transition-all shadow-sm disabled:opacity-60"
          >
            {saving ? (
              <>
                <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Icon icon="solar:check-circle-linear" width={16} />
                Saved
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <Icon icon="solar:danger-circle-linear" className="text-red-500 flex-shrink-0" width={20} />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchSettings}
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Two-Column Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* ============================================================ */}
        {/* SECTION 1: General Settings */}
        {/* ============================================================ */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden self-start">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4A90D9]/10 flex items-center justify-center text-[#4A90D9] flex-shrink-0">
              <Icon icon="solar:settings-linear" width={20} height={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1E293B]">General Settings</h4>
              <p className="text-xs text-[#64748B]">Configure core application settings</p>
            </div>
          </div>

          {/* Section Content */}
          <div className="px-6 py-5 flex flex-col gap-0">
            {/* Max Projects Per User */}
            <div className="flex flex-col gap-2 pb-5 border-b border-[#F1F5F9]">
              <label className="text-sm font-medium text-[#1E293B]">Max Projects Per User</label>
              <input
                type="number"
                value={maxProjectsPerUser}
                onChange={(e) => setMaxProjectsPerUser(Number(e.target.value))}
                className="w-[120px] h-[40px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Max Members Per Project */}
            <div className="flex flex-col gap-2 py-5 border-b border-[#F1F5F9]">
              <label className="text-sm font-medium text-[#1E293B]">Max Members Per Project</label>
              <input
                type="number"
                value={maxMembersPerProject}
                onChange={(e) => setMaxMembersPerProject(Number(e.target.value))}
                className="w-[120px] h-[40px] px-4 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Trash Retention */}
            <div className="flex flex-col gap-2 py-5 border-b border-[#F1F5F9]">
              <label className="text-sm font-medium text-[#1E293B]">Trash Retention</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={trashRetentionDays}
                  onChange={(e) => setTrashRetentionDays(Number(e.target.value))}
                  className="w-[80px] h-[40px] text-center rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-[#64748B]">days</span>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex flex-col gap-3 py-5 border-b border-[#F1F5F9]">
              <div>
                <label className="text-sm font-medium text-[#1E293B]">Default Kanban Columns</label>
                <p className="text-xs text-[#94A3B8] mt-0.5">Drag to reorder. These apply to all new projects.</p>
              </div>

              <div className="flex flex-col gap-2">
                {columns.map((column) => (
                  <div key={column.id} className="flex items-center gap-2">
                    <button className="text-[#94A3B8] cursor-move hover:text-[#64748B] transition-colors">
                      <Icon icon="solar:hamburger-menu-linear" width={18} />
                    </button>
                    <input
                      type="text"
                      value={column.name}
                      onChange={(e) => handleColumnNameChange(column.id, e.target.value)}
                      className="flex-1 h-[36px] px-3 rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] focus:border-[#4A90D9] focus:outline-none bg-white"
                    />
                    <button
                      onClick={() => handleRemoveColumn(column.id)}
                      className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" width={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddColumn}
                className="self-start text-sm font-medium text-[#4A90D9] hover:text-[#3b82f6] flex items-center gap-1.5 mt-1 transition-colors"
              >
                <Icon icon="solar:add-circle-linear" width={16} />
                Add Column
              </button>
            </div>

            {/* Max File Upload */}
            <div className="flex flex-col gap-2 py-5 border-b border-[#F1F5F9]">
              <label className="text-sm font-medium text-[#1E293B]">Max File Upload Size</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={maxFileSize}
                  onChange={(e) => setMaxFileSize(Number(e.target.value))}
                  className="w-[80px] h-[40px] pl-4 pr-2 rounded-l-lg border border-r-0 border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="h-[40px] px-3 flex items-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-r-lg text-sm text-[#64748B] font-medium">
                  MB
                </div>
              </div>
            </div>

            {/* Allowed File Types */}
            <div className="flex flex-col gap-2 pt-5">
              <label className="text-sm font-medium text-[#1E293B]">Allowed File Types</label>
              <div className="flex flex-wrap gap-2 items-center">
                {fileTypes.map((type) => (
                  <div
                    key={type}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] rounded-full border border-[#E5E7EB]"
                  >
                    <span className="text-sm text-[#1E293B]">{type}</span>
                    <button
                      onClick={() => handleRemoveFileType(type)}
                      className="text-[#94A3B8] hover:text-[#64748B] transition-colors"
                    >
                      <Icon icon="solar:close-circle-bold" width={16} />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value)}
                  onKeyDown={handleAddFileType}
                  placeholder="+ Add type"
                  className="w-[90px] h-[34px] px-2 text-sm bg-transparent border-none focus:ring-0 focus:outline-none placeholder-[#94A3B8]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right Column */}
        <div className="flex flex-col gap-6">

          {/* ============================================================ */}
          {/* SECTION 2: Notification Settings */}
          {/* ============================================================ */}
          <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] flex-shrink-0">
                <Icon icon="solar:bell-linear" width={20} height={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1E293B]">Notification Settings</h4>
                <p className="text-xs text-[#64748B]">Manage email and reminder preferences</p>
              </div>
            </div>

            {/* Section Content */}
            <div className="px-6 py-5 flex flex-col gap-0">
              {/* Email Notifications Toggle */}
              <div className="flex items-center justify-between pb-5 border-b border-[#F1F5F9]">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm font-medium text-[#1E293B]">Email Notifications</label>
                  <span className="text-xs text-[#64748B]">Enable email notifications globally</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                    emailNotifications ? 'bg-[#4A90D9]' : 'bg-[#CBD5E1]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] ring-0 transition duration-200 ease-in-out ${
                      emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </button>
              </div>

              {/* Digest Frequency */}
              <div className="flex flex-col gap-2 py-5 border-b border-[#F1F5F9]">
                <label className="text-sm font-medium text-[#1E293B]">Default Digest Frequency</label>
                <div className="relative">
                  <select
                    value={digestFrequency}
                    onChange={(e) => setDigestFrequency(e.target.value)}
                    className="w-full h-[40px] px-4 appearance-none rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
                  >
                    <option>Off</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#64748B]">
                    <Icon icon="solar:alt-arrow-down-linear" width={14} />
                  </div>
                </div>
              </div>

              {/* Deadline Reminder */}
              <div className="flex flex-col gap-2 pt-5">
                <label className="text-sm font-medium text-[#1E293B]">Deadline Reminder</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={deadlineReminder}
                    onChange={(e) => setDeadlineReminder(Number(e.target.value))}
                    className="w-[72px] h-[40px] text-center rounded-lg border border-[#E5E7EB] text-sm text-[#1E293B] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm text-[#64748B]">hours before deadline</span>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 3: Label Configuration */}
          {/* ============================================================ */}
          <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981] flex-shrink-0">
                <Icon icon="solar:tag-linear" width={20} height={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1E293B]">Label Configuration</h4>
                <p className="text-xs text-[#64748B]">Customize project labels and colors</p>
              </div>
            </div>

            {/* Section Content */}
            <div className="px-6 py-4 flex flex-col gap-1">
              {/* Label Rows */}
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center h-[42px] gap-3 px-3 rounded-lg hover:bg-[#F8FAFC] transition-colors group"
                >
                  <div
                    className="w-5 h-5 rounded-full border border-black/5 flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-sm text-[#1E293B] flex-1">{label.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-[#94A3B8] hover:text-[#4A90D9] hover:bg-blue-50 rounded-md transition-colors">
                      <Icon icon="solar:pen-linear" width={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveLabel(label.id)}
                      className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" width={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Label Row */}
              <div className="flex items-center gap-3 mt-2 pt-4 border-t border-dashed border-[#E5E7EB]">
                <div className="relative">
                  <button
                    onClick={() => setColorPickerOpen(!colorPickerOpen)}
                    className="w-5 h-5 rounded-full flex items-center justify-center border border-black/5 transition-colors flex-shrink-0"
                    style={{ backgroundColor: newLabelColor }}
                    title="Pick Color"
                  >
                    {newLabelColor === '#94A3B8' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </button>

                  {/* Color Picker Dropdown */}
                  {colorPickerOpen && (
                    <div className="absolute top-8 left-0 z-10 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-2 flex flex-wrap gap-1.5 w-[140px]">
                      {LABEL_COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setNewLabelColor(color);
                            setColorPickerOpen(false);
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            newLabelColor === color ? 'border-[#1E293B] scale-110' : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddLabel();
                  }}
                  placeholder="New label name"
                  className="flex-1 h-[36px] px-3 rounded-lg border border-[#E5E7EB] text-sm focus:border-[#4A90D9] focus:outline-none placeholder-[#94A3B8] bg-white"
                />
                <button
                  onClick={handleAddLabel}
                  className="h-[36px] px-4 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3b82f6] transition-colors shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>

      <div className="h-8" />
    </>
  );
}
