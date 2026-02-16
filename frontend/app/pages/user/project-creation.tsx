import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, X, LayoutGrid, Loader2 } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import MobileHeader from '~/components/layout/MobileHeader';
import { UserAvatar } from '~/components/ui/user-avatar';
import { projectService } from '~/services/httpServices/projectService';

export default function ProjectCreation() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState<{ email: string; initials: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = () => {
    if (memberEmail && !members.find((m) => m.email === memberEmail)) {
      const initials = memberEmail.split('@')[0].split('.').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
      setMembers([...members, { email: memberEmail, initials }]);
      setMemberEmail('');
    }
  };

  const removeMember = (email: string) => {
    setMembers(members.filter((m) => m.email !== email));
  };

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    setError(null);

    try {
      const project = await projectService.createProject({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        inviteEmails: members.length > 0 ? members.map((m) => m.email) : undefined,
      });
      navigate(`/projects/${project.id}/board`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to create project';
      setError(message);
      setCreating(false);
    }
  };

  return (
    <MobileShell>
      <MobileHeader title="New Project" showBack backTo="/projects" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 max-w-[600px] mx-auto">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
              <p className="text-xs text-red-600">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
            </div>
          )}

          {/* Project Details */}
          <section className="mb-8">
            <h4 className="text-lg font-semibold text-[#1E293B] mb-4">Project Details</h4>
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">Project title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project title"
                  className="w-full h-[48px] px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-base outline-none focus:border-[#4A90D9] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description (optional)"
                  className="w-full min-h-[120px] p-3 bg-white border border-[#E5E7EB] rounded-[6px] text-base outline-none focus:border-[#4A90D9] transition-colors resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1E293B]">Deadline</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full h-[48px] pl-10 pr-3 bg-white border border-[#E5E7EB] rounded-[6px] text-base outline-none focus:border-[#4A90D9] transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Board Template */}
          <section className="mb-8">
            <h4 className="text-lg font-semibold text-[#1E293B] mb-4">Board Template</h4>
            <div className="w-full bg-[#F0F7FF] border-2 border-[#4A90D9] rounded-[10px] p-4 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4A90D9] text-white flex items-center justify-center">
                  <LayoutGrid className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#1E293B]">Default</span>
                  <p className="text-[11px] text-[#64748B]">To Do, In Progress, Review, Done</p>
                </div>
              </div>
            </div>
          </section>

          {/* Invite Members */}
          <section className="mb-[100px]">
            <h4 className="text-lg font-semibold text-[#1E293B] mb-4">Invite Members</h4>
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="name@email.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                className="grow h-[48px] px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-base outline-none focus:border-[#4A90D9]"
              />
              <button onClick={addMember} className="w-[80px] h-[48px] bg-[#4A90D9] text-white font-medium rounded-[6px] hover:bg-[#3B82F6] transition-colors">
                Add
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {members.map((member) => (
                <div key={member.email} className="flex items-center justify-between p-2 bg-white border border-[#E5E7EB] rounded-[6px]">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={member.email} size="md" />
                    <span className="text-sm text-[#1E293B] font-medium">{member.email}</span>
                  </div>
                  <button onClick={() => removeMember(member.email)} className="text-[#94A3B8] hover:text-red-500 p-1" aria-label={`Remove ${member.email}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Sticky Bottom */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-[#E5E7EB] p-4 z-30">
        <button
          onClick={handleCreate}
          disabled={creating || !title.trim()}
          className="w-full h-[48px] bg-[#4A90D9] text-white font-semibold rounded-[6px] flex items-center justify-center gap-2 shadow-sm hover:bg-[#3B82F6] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {creating && <Loader2 className="w-5 h-5 animate-spin" />}
          {creating ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </MobileShell>
  );
}
