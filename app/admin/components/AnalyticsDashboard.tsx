import { getAnalyticsData } from "../actions/analyticsActions";
import AdminLayout from "./AdminLayout";
import TestTrackingButton from "./TestTrackingButton";

// Inline components to avoid import issues
function AnalyticsCards({
  totalUsers,
  activeUsers,
  summary,
}: {
  totalUsers: number;
  activeUsers: number;
  summary: Array<{
    date: string;
    total_events: number;
    unique_users: number;
    page_views: number;
    transactions: number;
    invoices: number;
  }>;
}) {
  const totalEvents = summary.reduce((sum, day) => sum + day.total_events, 0);
  const totalTransactions = summary.reduce((sum, day) => sum + day.transactions, 0);
  const totalInvoices = summary.reduce((sum, day) => sum + day.invoices, 0);
  const totalPageViews = summary.reduce((sum, day) => sum + day.page_views, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Users</p>
            <p className="text-2xl font-bold text-white">{totalUsers}</p>
            <p className="text-xs text-slate-500">{activeUsers} active</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-600 rounded-lg">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">Page Views</p>
            <p className="text-2xl font-bold text-white">{totalPageViews}</p>
            <p className="text-xs text-slate-500">{totalEvents} total events</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-600 rounded-lg">
            <span className="text-xl">💰</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">Transactions</p>
            <p className="text-2xl font-bold text-white">{totalTransactions}</p>
            <p className="text-xs text-slate-500">last {summary.length} days</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 rounded-lg">
            <span className="text-xl">📄</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">Invoices</p>
            <p className="text-2xl font-bold text-white">{totalInvoices}</p>
            <p className="text-xs text-slate-500">last {summary.length} days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PopularPages({
  pages,
}: {
  pages: Array<{
    page_url: string;
    view_count: number;
    unique_users: number;
  }>;
}) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Popular Pages</h3>
      <div className="space-y-3">
        {pages.length === 0 ? (
          <div className="text-sm text-slate-400">Ingen data tillgänglig ännu...</div>
        ) : (
          pages.map((page, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-sm">#{index + 1}</span>
                <div>
                  <p className="text-white font-medium">{page.page_url}</p>
                  <p className="text-xs text-slate-400">{page.unique_users} unique users</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{page.view_count}</p>
                <p className="text-xs text-slate-400">views</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function UserActivity({
  userStats,
}: {
  userStats: Array<{
    user_id: string;
    email: string;
    name: string;
    registered_date: Date;
    last_active: Date;
    total_events: number;
    page_views: number;
    transactions: number;
    invoices: number;
  }>;
}) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Most Active Users</h3>
      <div className="space-y-3">
        {userStats.length === 0 ? (
          <div className="text-sm text-slate-400">Ingen data tillgänglig ännu...</div>
        ) : (
          userStats.map((user, index) => (
            <div key={user.user_id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-sm">#{index + 1}</span>
                <div>
                  <p className="text-white font-medium">{user.name || user.email}</p>
                  <p className="text-xs text-slate-400">
                    {user.transactions} transactions • {user.page_views} views
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{user.total_events}</p>
                <p className="text-xs text-slate-400">events</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface AnalyticsDashboardProps {
  days?: number;
}

export default async function AnalyticsDashboard({ days = 30 }: AnalyticsDashboardProps) {
  const analyticsResult = await getAnalyticsData(days);

  if (!analyticsResult.success) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <div className="bg-red-800 border border-red-600 rounded-lg p-4">
            <p className="text-white">Failed to load analytics: {analyticsResult.error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { summary, popularPages, userStats, activeUsers, totalUsers } = analyticsResult.data || {
    summary: [],
    popularPages: [],
    userStats: [],
    activeUsers: 0,
    totalUsers: 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <div className="flex items-center gap-4">
            <TestTrackingButton />
            <div className="text-sm text-slate-400">
              Last {days} days • {new Date().toLocaleDateString("sv-SE")}
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <AnalyticsCards totalUsers={totalUsers} activeUsers={activeUsers} summary={summary} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Pages */}
          <PopularPages pages={popularPages} />

          {/* User Activity */}
          <UserActivity userStats={userStats.slice(0, 10)} />
        </div>

        {/* Daily Summary Chart */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Activity</h3>
          <div className="space-y-2">
            {summary.slice(0, 7).map(
              (
                day: {
                  date: string;
                  unique_users: number;
                  page_views: number;
                  transactions: number;
                },
                index: number
              ) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{day.date}</span>
                  <div className="flex gap-4 text-slate-400">
                    <span>{day.unique_users} users</span>
                    <span>{day.page_views} views</span>
                    <span>{day.transactions} transactions</span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Debug Info */}
        <details className="bg-slate-800 rounded-lg border border-slate-700">
          <summary className="p-4 cursor-pointer text-white font-medium">
            Debug Data (Click to expand)
          </summary>
          <div className="p-4 border-t border-slate-700">
            <pre className="text-xs text-slate-400 overflow-auto">
              {JSON.stringify(
                { summary: summary.slice(0, 3), popularPages, userStats: userStats.slice(0, 3) },
                null,
                2
              )}
            </pre>
          </div>
        </details>
      </div>
    </AdminLayout>
  );
}
