import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { StatCard } from "~/components/ui/stat-card";
import { adminService } from "~/services/httpServices/adminService";
import type { DashboardStats, TrendPoint } from "~/types/admin";

// ============================================================
// Helpers
// ============================================================

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Unknown";
  }
}

const PERIOD_OPTIONS = ["Today", "Last 7 Days", "Last 30 Days", "Custom"] as const;

const ACTION_TYPE_META: Record<
  string,
  { icon: string; bg: string; color: string; label: string }
> = {
  task_created: {
    icon: "solar:clipboard-add-linear",
    bg: "bg-[#4A90D9]/10",
    color: "text-[#4A90D9]",
    label: "Task created",
  },
  task_updated: {
    icon: "solar:clipboard-check-linear",
    bg: "bg-purple-500/10",
    color: "text-purple-500",
    label: "Task updated",
  },
  task_deleted: {
    icon: "solar:clipboard-remove-linear",
    bg: "bg-red-500/10",
    color: "text-red-500",
    label: "Task deleted",
  },
  status_changed: {
    icon: "solar:refresh-circle-linear",
    bg: "bg-blue-500/10",
    color: "text-blue-500",
    label: "Status changed",
  },
  comment_added: {
    icon: "solar:chat-round-line-linear",
    bg: "bg-emerald-500/10",
    color: "text-emerald-500",
    label: "Comment added",
  },
  member_added: {
    icon: "solar:user-plus-linear",
    bg: "bg-[#4A90D9]/10",
    color: "text-[#4A90D9]",
    label: "Member added",
  },
  member_removed: {
    icon: "solar:user-minus-linear",
    bg: "bg-orange-500/10",
    color: "text-orange-500",
    label: "Member removed",
  },
  project_created: {
    icon: "solar:folder-add-linear",
    bg: "bg-emerald-500/10",
    color: "text-emerald-500",
    label: "Project created",
  },
  attachment_added: {
    icon: "solar:paperclip-linear",
    bg: "bg-cyan-500/10",
    color: "text-cyan-500",
    label: "Attachment added",
  },
};

const DEFAULT_META = {
  icon: "solar:document-linear",
  bg: "bg-gray-500/10",
  color: "text-gray-500",
  label: "Activity",
};

// ============================================================
// Chart Grid Lines (HTML divs — matches prototype exactly)
// ============================================================

function ChartGridLines() {
  return (
    <div className="absolute inset-0 flex flex-col justify-between">
      <div className="border-b border-dashed border-[#E5E7EB] w-full h-0" />
      <div className="border-b border-dashed border-[#E5E7EB] w-full h-0" />
      <div className="border-b border-dashed border-[#E5E7EB] w-full h-0" />
      <div className="border-b border-dashed border-[#E5E7EB] w-full h-0" />
      <div className="border-b border-[#E5E7EB] w-full h-0" />
    </div>
  );
}

// ============================================================
// Helper: build smooth cubic bezier path from data
// ============================================================

function buildCurvePath(data: TrendPoint[]) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 40 - (d.value / maxVal) * 35,
  }));

  let pathD = "";
  if (points.length > 1) {
    pathD = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
      pathD += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
    }
  }

  return { points, pathD };
}

// ============================================================
// Line Chart with Dots (User Registration Trend)
// ============================================================

function LineChartWithDots({ data }: { data: TrendPoint[] }) {
  const { points, pathD } = buildCurvePath(data);

  return (
    <div className="flex-1 w-full relative">
      <ChartGridLines />
      <svg
        viewBox="0 0 100 40"
        className="w-full h-full absolute inset-0 text-[#4A90D9]"
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Dots on interior points only */}
        {points
          .filter((_, i) => i > 0 && i < points.length - 1)
          .map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              className="fill-white stroke-current"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
      </svg>
    </div>
  );
}

// ============================================================
// Area Chart without Dots (Task Completion Rate)
// ============================================================

function AreaChart({ data }: { data: TrendPoint[] }) {
  const { pathD } = buildCurvePath(data);
  const lastPoint = data.length - 1;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const lastX = (lastPoint / Math.max(data.length - 1, 1)) * 100;
  const areaD = pathD ? `${pathD} L${lastX},40 L0,40 Z` : "";

  return (
    <div className="flex-1 w-full relative">
      <ChartGridLines />
      <svg
        viewBox="0 0 100 40"
        className="w-full h-full absolute inset-0 text-[#8B5CF6]"
        preserveAspectRatio="none"
      >
        {/* Area fill — very subtle 5% opacity */}
        {areaD && (
          <path
            d={areaD}
            fill="#8B5CF6"
            fillOpacity="0.05"
            stroke="none"
          />
        )}
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

// ============================================================
// Mini Bar Chart
// ============================================================

function MiniBarChart({ data }: { data: TrendPoint[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex-1 flex items-end justify-between gap-3 px-2">
      {data.map((bar) => {
        const heightPct = Math.max((bar.value / maxVal) * 100, 4);
        return (
          <div
            key={bar.date}
            className="w-full bg-emerald-500/10 rounded-t-sm hover:bg-emerald-500/20 transition-colors relative group"
            style={{ height: `${heightPct}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1E293B] text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {bar.value}
            </div>
            <div className="w-full h-full bg-emerald-500 rounded-t-sm opacity-80" />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Last 7 Days");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <span>Admin</span>
            <Icon icon="solar:alt-arrow-right-linear" width={12} height={12} />
            <span className="text-[#1E293B] font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1E293B]">
            Overview
          </h1>
        </div>

        {/* Period Filter */}
        <div className="flex items-center bg-white p-1 rounded-lg border border-[#E5E7EB] shadow-sm">
          {PERIOD_OPTIONS.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedPeriod === period
                  ? "bg-[#4A90D9] text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <Icon
            icon="solar:danger-circle-linear"
            className="text-red-500 flex-shrink-0"
            width={20}
          />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchStats}
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
                    <div className="h-7 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                </div>
                <div className="h-3 w-32 bg-gray-200 rounded mt-4" />
              </div>
            ))}
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Total Users"
              value={formatNumber(stats.totalUsers)}
              icon="solar:users-group-rounded-linear"
              iconBgColor="bg-[#4A90D9]/10"
              iconColor="text-[#4A90D9]"
              footer={
                <>
                  <span className="text-emerald-500 font-medium flex items-center">
                    <Icon
                      icon="solar:arrow-right-up-linear"
                      className="mr-0.5"
                    />
                    24
                  </span>
                  <span className="text-[#64748B]">new this week</span>
                </>
              }
            />
            <StatCard
              title="Total Projects"
              value={formatNumber(stats.totalProjects)}
              icon="solar:folder-linear"
              iconBgColor="bg-emerald-500/10"
              iconColor="text-emerald-500"
              footer={
                <>
                  <span className="text-[#1E293B] font-medium">
                    {formatNumber(stats.totalProjects)}
                  </span>
                  <span className="text-[#64748B]">active projects</span>
                </>
              }
            />
            <StatCard
              title="Total Tasks"
              value={formatNumber(stats.totalTasks)}
              icon="solar:clipboard-check-linear"
              iconBgColor="bg-purple-500/10"
              iconColor="text-purple-500"
              footer={
                <>
                  <span className="text-emerald-500 font-medium flex items-center">
                    <Icon
                      icon="solar:arrow-right-up-linear"
                      className="mr-0.5"
                    />
                    187
                  </span>
                  <span className="text-[#64748B]">completed this week</span>
                </>
              }
            />
            <StatCard
              title="Active Today"
              value={formatNumber(stats.activeUsers)}
              icon="solar:chart-square-linear"
              iconBgColor="bg-orange-500/10"
              iconColor="text-orange-500"
              footer={
                <span className="text-[#64748B]">
                  Users logged in past 24h
                </span>
              }
            />
          </>
        ) : null}
      </div>

      {/* Charts Grid — 2x2 matching HTML prototype */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Registration Trend — Line Chart */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm h-72 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-[#1E293B]">
              User Registration Trend
            </h3>
            <Icon
              icon="solar:menu-dots-linear"
              className="text-[#94A3B8] cursor-pointer"
            />
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Icon
                icon="solar:refresh-linear"
                width={24}
                className="text-[#4A90D9] animate-spin"
              />
            </div>
          ) : stats?.userRegistrationTrend?.length ? (
            <>
              <LineChartWithDots data={stats.userRegistrationTrend} />
              <div className="flex justify-between text-[10px] text-[#94A3B8] mt-2 px-1">
                {stats.userRegistrationTrend.map((t, i) => (
                  <span key={i}>{t.label}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[#94A3B8]">
              No data yet
            </div>
          )}
        </div>

        {/* Project Creation Trend — Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm h-72 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-[#1E293B]">
              Project Creation Trend
            </h3>
            <Icon
              icon="solar:menu-dots-linear"
              className="text-[#94A3B8] cursor-pointer"
            />
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Icon
                icon="solar:refresh-linear"
                width={24}
                className="text-emerald-500 animate-spin"
              />
            </div>
          ) : stats?.projectCreationTrend?.length ? (
            <>
              <MiniBarChart data={stats.projectCreationTrend} />
              <div className="flex justify-between text-[10px] text-[#94A3B8] mt-2 px-1">
                {stats.projectCreationTrend.map((t, i) => (
                  <span key={i}>{t.label}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[#94A3B8]">
              No data yet
            </div>
          )}
        </div>

        {/* Task Completion Rate — Area/Line Chart (Purple) */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm h-72 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-[#1E293B]">
              Task Completion Rate
            </h3>
            <Icon
              icon="solar:menu-dots-linear"
              className="text-[#94A3B8] cursor-pointer"
            />
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Icon
                icon="solar:refresh-linear"
                width={24}
                className="text-[#8B5CF6] animate-spin"
              />
            </div>
          ) : stats?.taskCreationTrend?.length ? (
            <>
              <AreaChart data={stats.taskCreationTrend} />
              <div className="flex justify-between text-[10px] text-[#94A3B8] mt-2 px-1">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[#94A3B8]">
              No data yet
            </div>
          )}
        </div>

        {/* Top 5 Most Active Projects — Progress Bars */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm h-72 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-[#1E293B]">
              Top 5 Most Active Projects
            </h3>
            <Icon
              icon="solar:menu-dots-linear"
              className="text-[#94A3B8] cursor-pointer"
            />
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Icon
                icon="solar:refresh-linear"
                width={24}
                className="text-[#F59E0B] animate-spin"
              />
            </div>
          ) : stats?.topProjects?.length ? (
            <div className="flex-1 flex flex-col justify-center gap-4">
              {stats.topProjects.map((project, i) => (
                <div key={project.id} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#1E293B]">
                      {project.name}
                    </span>
                    <span className="text-[#64748B]">
                      {project.completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] rounded-full h-2">
                    <div
                      className="bg-[#F59E0B] h-2 rounded-full"
                      style={{
                        width: `${project.completionPercentage}%`,
                        opacity: 1 - i * 0.1,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[#94A3B8]">
              No projects yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#1E293B]">
            Recent Activity
          </h3>
          <button className="text-[#64748B] hover:text-[#1E293B]">
            <Icon icon="solar:filter-linear" width={20} />
          </button>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center">
            <Icon
              icon="solar:refresh-linear"
              width={24}
              className="text-[#4A90D9] animate-spin"
            />
          </div>
        ) : stats?.recentActivity?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-[#64748B] font-medium border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 w-[60px]">Type</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {stats.recentActivity.map((activity) => {
                  const meta =
                    ACTION_TYPE_META[activity.actionType] || DEFAULT_META;
                  return (
                    <tr
                      key={activity.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div
                          className={`w-8 h-8 rounded-full ${meta.bg} ${meta.color} flex items-center justify-center`}
                        >
                          <Icon icon={meta.icon} width={16} />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-medium text-[#1E293B]">
                          {meta.label}
                        </span>
                        <span className="text-[#64748B] ml-2">
                          {activity.description}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-[#64748B] font-mono text-xs">
                        {formatRelativeTime(activity.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-[#94A3B8]">
            No activity recorded yet
          </div>
        )}
        {/* Footer Link */}
        <div className="p-4 border-t border-[#E5E7EB] bg-gray-50">
          <button className="w-full text-sm font-medium text-[#4A90D9] hover:text-[#3b82f6] flex items-center justify-center gap-1 transition-colors">
            View All Activity
            <Icon icon="solar:arrow-right-linear" width={16} />
          </button>
        </div>
      </div>

      <div className="h-8" />
    </>
  );
}
