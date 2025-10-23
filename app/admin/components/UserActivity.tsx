interface UserActivityProps {
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
}

export default function UserActivity({ userStats }: UserActivityProps) {
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
