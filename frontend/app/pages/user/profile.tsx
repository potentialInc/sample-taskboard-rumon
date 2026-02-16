import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Camera, Loader2 } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import BottomNav from '~/components/layout/BottomNav';
import { PageLoader } from '~/components/ui/loading-spinner';
import { cn } from '~/lib/utils';
import { userService } from '~/services/httpServices/userService';
import { authService } from '~/services/httpServices/authService';
import { useAppSelector, useAppDispatch } from '~/redux/store/hooks';
import { setCurrentProfile, updateProfile as updateProfileAction } from '~/redux/features/userSlice';
import { logout as logoutAction } from '~/redux/features/authSlice';
import type { UserProfile, UserPreferences } from '~/types/user';

type DigestOption = 'Off' | 'Daily' | 'Weekly';

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Notification preference local state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState<DigestOption>('Daily');
  const [assignments, setAssignments] = useState(true);
  const [deadlines, setDeadlines] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [statusChanges, setStatusChanges] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileData, prefsData] = await Promise.all([
        userService.getMe(),
        userService.getPreferences().catch(() => null),
      ]);

      setProfile(profileData);
      dispatch(setCurrentProfile(profileData));

      if (prefsData) {
        setPreferences(prefsData);
        setPushEnabled(prefsData.pushNotifications);
        setCommentsEnabled(true); // Default - API doesn't have granular
        setEmailDigest(prefsData.dailyDigest ? 'Daily' : 'Off');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to load profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSavePreferences = async () => {
    if (savingPreferences) return;
    setSavingPreferences(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data: Partial<UserPreferences> = {
        pushNotifications: pushEnabled,
        emailNotifications: assignments || deadlines || commentsEnabled || statusChanges,
        dailyDigest: emailDigest === 'Daily',
      };
      await userService.updatePreferences(data);
      setSuccessMessage('Preferences saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(message);
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await authService.logout();
    } catch {
      // Logout even if API call fails
    } finally {
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  // Auto-save preferences when toggles change
  useEffect(() => {
    if (!loading && profile) {
      const timeout = setTimeout(() => {
        handleSavePreferences();
      }, 1000);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushEnabled, emailDigest, assignments, deadlines, commentsEnabled, statusChanges]);

  if (loading) {
    return (
      <MobileShell>
        <header className="bg-white h-[56px] flex items-center justify-center px-4 shrink-0 z-20 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold tracking-tight text-[#1E293B]">Profile</h2>
        </header>
        <PageLoader />
        <BottomNav />
      </MobileShell>
    );
  }

  const displayName = profile?.fullName || authUser?.fullName || 'User';
  const displayEmail = profile?.email || authUser?.email || '';
  const displayJobTitle = profile?.jobTitle || authUser?.jobTitle || '';
  const displayAvatar = profile?.avatar || authUser?.avatar;

  return (
    <MobileShell>
      <header className="bg-white h-[56px] flex items-center justify-center px-4 shrink-0 z-20 border-b border-[#E5E7EB]">
        <h2 className="text-lg font-semibold tracking-tight text-[#1E293B]">Profile</h2>
      </header>

      <main className="flex-1 overflow-y-auto pb-[70px] p-4 flex flex-col gap-4" style={{ scrollbarWidth: 'none' }}>
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

        {/* Account Info Card */}
        <section className="bg-white rounded-lg p-5 shadow-sm border border-[#E5E7EB] flex flex-col items-center">
          <div className="relative mb-3">
            <img
              src={displayAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=80`}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-[#E5E7EB] text-[#4A90D9] flex items-center justify-center hover:bg-[#F9FAFB] transition-colors" aria-label="Change photo">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-xl font-semibold tracking-tight text-[#1E293B] mb-1">{displayName}</h3>
          <div className="text-sm text-[#64748B] mb-0.5">{displayEmail}</div>
          {displayJobTitle && <div className="text-sm text-[#64748B]">{displayJobTitle}</div>}

          {/* Stats */}
          {profile && (
            <div className="flex items-center gap-6 mt-4 mb-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-[#1E293B]">{profile.projectCount}</div>
                <div className="text-[10px] text-[#64748B] font-medium">Projects</div>
              </div>
              <div className="w-px h-8 bg-[#E5E7EB]" />
              <div className="text-center">
                <div className="text-lg font-semibold text-[#1E293B]">{profile.taskCount}</div>
                <div className="text-[10px] text-[#64748B] font-medium">Tasks</div>
              </div>
              <div className="w-px h-8 bg-[#E5E7EB]" />
              <div className="text-center">
                <div className="text-lg font-semibold text-[#1E293B]">{profile.completedTaskCount}</div>
                <div className="text-[10px] text-[#64748B] font-medium">Completed</div>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/profile/edit')}
            className="mt-4 h-10 w-[120px] rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#1E293B] hover:bg-[#F9FAFB] transition-colors flex items-center justify-center"
          >
            Edit Profile
          </button>
        </section>

        {/* Notification Preferences Card */}
        <section className="bg-white rounded-lg p-5 shadow-sm border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base font-semibold tracking-tight text-[#1E293B]">Notification Preferences</h4>
            {savingPreferences && <Loader2 className="w-4 h-4 animate-spin text-[#4A90D9]" />}
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-medium text-[#1E293B]">Push notifications</span>
            <Toggle enabled={pushEnabled} onChange={setPushEnabled} size="lg" />
          </div>

          {/* Email Digest */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-medium text-[#1E293B]">Email digest</span>
            <div className="flex bg-[#F3F4F6] rounded-md p-0.5 h-8 items-center">
              {(['Off', 'Daily', 'Weekly'] as DigestOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setEmailDigest(option)}
                  className={cn(
                    'px-3 h-full text-xs font-medium rounded transition-colors',
                    emailDigest === option ? 'bg-white text-[#1E293B] shadow-sm border border-[#E5E7EB]' : 'text-[#64748B] hover:text-[#1E293B]'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#E5E7EB] w-full mb-5" />

          {/* Sub Toggles */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1E293B]">Assignments</span>
              <Toggle enabled={assignments} onChange={setAssignments} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1E293B]">Deadlines</span>
              <Toggle enabled={deadlines} onChange={setDeadlines} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1E293B]">Comments</span>
              <Toggle enabled={commentsEnabled} onChange={setCommentsEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1E293B]">Status Changes</span>
              <Toggle enabled={statusChanges} onChange={setStatusChanges} />
            </div>
          </div>
        </section>

        {/* Danger Zone Card */}
        <section className="bg-white rounded-lg p-5 shadow-sm border border-[#E5E7EB]">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full h-12 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#64748B] hover:bg-[#F9FAFB] hover:text-[#1E293B] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loggingOut && <Loader2 className="w-4 h-4 animate-spin" />}
            Log Out
          </button>
          <button className="w-full h-12 mt-3 rounded-lg text-sm font-medium text-[#EF4444] hover:bg-red-50 transition-colors flex items-center justify-center">
            Delete Account
          </button>
        </section>

        {/* App Info */}
        <div className="text-center">
          <span className="text-xs text-[#94A3B8]">App version: 1.1.0</span>
        </div>
      </main>

      <BottomNav />
    </MobileShell>
  );
}

function Toggle({ enabled, onChange, size = 'sm' }: { enabled: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'lg' }) {
  const isLg = size === 'lg';
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative rounded-full transition-colors cursor-pointer',
        isLg ? 'w-11 h-6' : 'w-9 h-5',
        enabled ? 'bg-[#4A90D9]' : 'bg-[#E5E7EB]'
      )}
      role="switch"
      aria-checked={enabled}
    >
      <div className={cn(
        'absolute top-0.5 bg-white rounded-full shadow-sm transition-transform',
        isLg ? 'w-5 h-5' : 'w-4 h-4',
        enabled ? (isLg ? 'right-0.5 left-auto translate-x-0' : 'right-0.5 left-auto translate-x-0') : 'left-0.5'
      )} />
    </button>
  );
}
