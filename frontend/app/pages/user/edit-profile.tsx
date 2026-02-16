import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Camera, Loader2 } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import { PageLoader } from '~/components/ui/loading-spinner';
import { userService } from '~/services/httpServices/userService';
import { useAppSelector, useAppDispatch } from '~/redux/store/hooks';
import { updateProfile as updateProfileAction, setCurrentProfile } from '~/redux/features/userSlice';
import type { UserProfile } from '~/types/user';

export default function EditProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentProfile = useAppSelector((state) => state.user.currentProfile);

  const [loading, setLoading] = useState(!currentProfile);
  const [profile, setProfile] = useState<UserProfile | null>(currentProfile);
  const [fullName, setFullName] = useState(currentProfile?.fullName ?? '');
  const [jobTitle, setJobTitle] = useState(currentProfile?.jobTitle ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile if not in Redux store
  useEffect(() => {
    if (currentProfile) {
      setProfile(currentProfile);
      setFullName(currentProfile.fullName);
      setJobTitle(currentProfile.jobTitle ?? '');
      setLoading(false);
      return;
    }

    userService.getMe()
      .then((data) => {
        setProfile(data);
        dispatch(setCurrentProfile(data));
        setFullName(data.fullName);
        setJobTitle(data.jobTitle ?? '');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load profile';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [currentProfile, dispatch]);

  const hasChanges = profile
    ? fullName !== profile.fullName || jobTitle !== (profile.jobTitle ?? '') || avatarFile !== null
    : false;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (saving || !hasChanges) return;
    setSaving(true);
    setError(null);

    try {
      const updatedProfile = await userService.updateProfile({
        fullName,
        jobTitle: jobTitle || undefined,
        avatar: avatarFile ?? undefined,
      });

      dispatch(updateProfileAction(updatedProfile));
      navigate('/profile');
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to update profile';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MobileShell>
        <header className="bg-white h-[56px] flex items-center justify-center px-4 shrink-0 z-20 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold tracking-tight text-[#1E293B]">Edit Profile</h2>
        </header>
        <PageLoader />
      </MobileShell>
    );
  }

  const displayEmail = profile?.email ?? '';
  const displayAvatar = avatarPreview ?? profile?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&size=80`;

  return (
    <MobileShell>
      <header className="bg-white h-[56px] flex items-center justify-center px-4 shrink-0 z-20 border-b border-[#E5E7EB] relative">
        <button
          onClick={() => navigate('/profile')}
          className="absolute left-4 text-[#1E293B] hover:text-[#64748B] transition-colors flex items-center justify-center p-1 -ml-1"
          aria-label="Back to profile"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold tracking-tight text-[#1E293B]">Edit Profile</h2>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[90px]">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
          </div>
        )}

        {/* Profile Photo */}
        <div className="flex flex-col items-center justify-center mb-5">
          <div className="relative cursor-pointer group">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <img
              src={displayAvatar}
              alt={fullName || 'Profile'}
              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-[#E5E7EB] text-[#4A90D9] flex items-center justify-center group-hover:bg-[#F9FAFB] transition-colors"
              aria-label="Change photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullname" className="text-sm font-medium text-[#1E293B]">Full name</label>
            <input
              id="fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-[44px] w-full rounded-lg border border-[#E5E7EB] px-4 text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="jobtitle" className="text-sm font-medium text-[#1E293B]">Job title</label>
            <input
              id="jobtitle"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="h-[44px] w-full rounded-lg border border-[#E5E7EB] px-4 text-sm text-[#1E293B] bg-white placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[#1E293B]">Email</label>
            <input
              id="email"
              type="email"
              value={displayEmail}
              disabled
              className="h-[44px] w-full rounded-lg border border-[#E5E7EB] px-4 text-sm text-[#94A3B8] bg-[#F9FAFB] cursor-not-allowed select-none"
            />
            <p className="text-xs text-[#64748B]">Changing email requires re-verification</p>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="absolute bottom-0 w-full bg-white border-t border-[#E5E7EB] p-4 z-20">
        <button
          onClick={hasChanges ? handleSave : undefined}
          disabled={!hasChanges || saving}
          className={`w-full h-[44px] bg-[#4A90D9] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-opacity ${
            hasChanges && !saving ? 'hover:bg-[#3B82F6] active:scale-[0.99]' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </MobileShell>
  );
}
