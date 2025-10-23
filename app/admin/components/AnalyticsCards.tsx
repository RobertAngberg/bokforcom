interface AnalyticsCardsProps {
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
}

export default function AnalyticsCards({ totalUsers, activeUsers, summary }: AnalyticsCardsProps) {
  // Calculate totals from summary
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
