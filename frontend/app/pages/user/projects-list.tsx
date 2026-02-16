import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, LayoutGrid, List, Plus, Calendar, CheckCircle, AlertCircle, ChevronDown, FolderOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';
import { setLoading, setProjects, setError } from '~/redux/features/projectSlice';
import { projectService } from '~/services/httpServices/projectService';
import MobileShell from '~/components/layout/MobileShell';
import MobileHeader from '~/components/layout/MobileHeader';
import BottomNav from '~/components/layout/BottomNav';
import { AvatarStack } from '~/components/ui/user-avatar';
import { PageLoader } from '~/components/ui/loading-spinner';
import { EmptyState } from '~/components/ui/empty-state';
import { cn } from '~/lib/utils';
import type { Project } from '~/types/project';

type StatusFilter = 'All' | 'Active' | 'Completed' | 'Archived';
type SortOption = 'recent' | 'name' | 'progress';
type ViewMode = 'grid' | 'list';

const STATUS_FILTERS: StatusFilter[] = ['All', 'Active', 'Completed', 'Archived'];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Recent', value: 'recent' },
  { label: 'Name', value: 'name' },
  { label: 'Progress', value: 'progress' },
];

function getProjectStatusLabel(project: Project): { label: string; color: string; icon: 'done' | 'late' | 'date' } {
  if (project.progress >= 100 || project.status === 'completed') {
    return { label: 'Done', color: 'text-[#10B981]', icon: 'done' };
  }
  if (project.deadline) {
    const deadlineDate = new Date(project.deadline);
    if (deadlineDate < new Date() && project.status === 'active') {
      return { label: 'Late', color: 'text-[#EF4444]', icon: 'late' };
    }
    const formatted = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    return { label: formatted, color: 'text-[#64748B]', icon: 'date' };
  }
  return { label: 'No deadline', color: 'text-[#64748B]', icon: 'date' };
}

function sortProjects(projects: Project[], sort: SortOption): Project[] {
  const sorted = [...projects];
  switch (sort) {
    case 'name':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'progress':
      return sorted.sort((a, b) => b.progress - a.progress);
    case 'recent':
    default:
      return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

interface ProjectCardProps {
  project: Project;
  onNavigate: (id: string) => void;
}

function ProjectCard({ project, onNavigate }: ProjectCardProps) {
  const statusInfo = getProjectStatusLabel(project);
  const members = project?.members?.map((m) => ({ name: m.fullName, avatar: m.avatar }));

  return (
    <div
      onClick={() => onNavigate(project.id)}
      className="bg-white p-4 rounded-lg border border-[#E5E7EB] flex flex-col justify-between h-[180px] active:scale-[0.98] transition-transform select-none cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`Open project ${project.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate(project.id);
        }
      }}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-xl font-medium text-[#1E293B] leading-tight line-clamp-2 tracking-tight">
            {project.title}
          </h4>
        </div>
        {members?.length > 0 && (
          <div className="mb-4">
            <AvatarStack users={members} max={3} />
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="w-full bg-[#E5E7EB] h-1 rounded-full overflow-hidden">
          <div
            className="bg-[#4A90D9] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(project.progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {statusInfo.icon === 'done' ? (
              <span className={cn('flex items-center gap-1 text-xs', statusInfo.color)}>
                <CheckCircle className="w-3.5 h-3.5" /> {statusInfo.label}
              </span>
            ) : statusInfo.icon === 'late' ? (
              <span className={cn('flex items-center gap-1 text-xs', statusInfo.color)}>
                <AlertCircle className="w-3.5 h-3.5" /> {statusInfo.label}
              </span>
            ) : (
              <span className={cn('flex items-center gap-1 text-xs', statusInfo.color)}>
                <Calendar className="w-3.5 h-3.5" /> {statusInfo.label}
              </span>
            )}
          </div>
          <span className="text-xs text-[#64748B]">
            {project.completedTasks}/{project.totalTasks} tasks
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projects, loading, error } = useAppSelector((state) => state.project);

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const { projects: data } = await projectService.getProjects();
      dispatch(setProjects(data));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      dispatch(setError(message));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleNavigateToProject = useCallback((id: string) => {
    navigate(`/projects/${id}/board`);
  }, [navigate]);

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesFilter = activeFilter === 'All' || project.status === activeFilter.toLowerCase();
    const matchesSearch = !searchQuery || project.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sort projects
  const sortedProjects = sortProjects(filteredProjects, sortBy);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Recent';

  return (
    <MobileShell>
      <MobileHeader
        title="Projects"
        rightContent={
          <div className="flex items-center gap-4 text-[#1E293B]">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Toggle search"
            >
              <Search className="w-6 h-6" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center justify-center active:scale-95 transition-transform"
              aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? <LayoutGrid className="w-6 h-6" /> : <List className="w-6 h-6" />}
            </button>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto pb-[130px]">
        {/* Search Bar (collapsible) */}
        {showSearch && (
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full h-9 pl-9 pr-4 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9] transition-all"
                aria-label="Search projects"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Filter & Sort */}
        <div className="flex items-center justify-between pl-4 pr-4 py-4 gap-2">
          <div
            className="flex items-center gap-2 overflow-x-auto flex-1 pr-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {STATUS_FILTERS?.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'h-[32px] px-[12px] rounded-2xl text-xs font-medium whitespace-nowrap transition-all',
                  activeFilter === filter
                    ? 'bg-[#4A90D9] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#64748B] border border-transparent hover:border-[#E5E7EB]'
                )}
                aria-pressed={activeFilter === filter}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 text-sm text-[#64748B] font-medium cursor-pointer hover:text-[#1E293B] transition-colors"
              aria-label="Sort options"
              aria-expanded={showSortMenu}
            >
              <span>{currentSortLabel}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', showSortMenu && 'rotate-180')} />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-20 min-w-[120px] py-1">
                  {SORT_OPTIONS?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs font-medium transition-colors',
                        sortBy === option.value
                          ? 'text-[#4A90D9] bg-[#F0F7FF]'
                          : 'text-[#64748B] hover:bg-[#F9FAFB]'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            icon={<AlertCircle className="w-8 h-8" />}
            title="Failed to load projects"
            description={error}
            action={
              <button
                onClick={fetchProjects}
                className="px-4 py-2 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3B82F6] transition-colors"
              >
                Try Again
              </button>
            }
          />
        ) : sortedProjects?.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-8 h-8" />}
            title={searchQuery ? 'No projects found' : 'No projects yet'}
            description={
              searchQuery
                ? `No projects match "${searchQuery}". Try a different search term.`
                : 'Create your first project to get started with task management.'
            }
            action={
              !searchQuery ? (
                <button
                  onClick={() => navigate('/projects/new')}
                  className="px-4 py-2 bg-[#4A90D9] text-white text-sm font-medium rounded-lg hover:bg-[#3B82F6] transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              ) : undefined
            }
          />
        ) : (
          /* Projects Grid / List */
          <div
            className={cn(
              'px-4',
              viewMode === 'grid'
                ? 'grid grid-cols-2 gap-[12px]'
                : 'flex flex-col gap-3'
            )}
          >
            {sortedProjects?.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onNavigate={handleNavigateToProject}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate('/projects/new')}
        className="absolute bottom-[calc(56px+24px)] right-4 w-[56px] h-[56px] rounded-full bg-[#4A90D9] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(74,144,217,0.3)] hover:bg-[#3B82F6] active:scale-90 transition-all z-10"
        aria-label="Create new project"
      >
        <Plus className="w-7 h-7" />
      </button>

      <BottomNav />
    </MobileShell>
  );
}
