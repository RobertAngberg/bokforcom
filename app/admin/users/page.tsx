import AdminLayout from "../components/AdminLayout";
import ImpersonateButton from "../components/ImpersonateButton";

async function getUsersData() {
  // Ensure admin access (you can add admin check here later)
  await import("../../_utils/session").then((m) => m.ensureSession());
  const { pool } = await import("../../_lib/db");

  try {
    // Hämta alla users med basic info
    const usersResult = await pool.query(`
      SELECT 
        id,
        email,
        name,
        "createdAt" as registered_date,
        "emailVerified" as email_verified
      FROM "user"
      ORDER BY "createdAt" DESC
    `);

    // Hämta analytics data för varje user (sista 30 dagarna)
    const userStatsResult = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_name = 'transaction_created' THEN 1 END) as transactions,
        COUNT(CASE WHEN event_name = 'invoice_created' THEN 1 END) as invoices,
        MAX(timestamp) as last_active
      FROM user_events 
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY user_id
    `);

    // Koppla ihop data
    const users = usersResult.rows.map((user) => {
      const stats = userStatsResult.rows.find((s) => s.user_id === user.id) || {
        total_events: 0,
        page_views: 0,
        transactions: 0,
        invoices: 0,
        last_active: null,
      };

      return {
        ...user,
        ...stats,
        last_active: stats.last_active || user.registered_date,
      };
    });

    return { success: true, users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export default async function UsersPage() {
  const usersResult = await getUsersData();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <div className="text-sm text-slate-400">
            {usersResult.success && usersResult.users
              ? `${usersResult.users.length} total users`
              : "Loading..."}
          </div>
        </div>

        {/* Error State */}
        {!usersResult.success && (
          <div className="bg-red-800 border border-red-600 rounded-lg p-4">
            <p className="text-white">Failed to load users: {usersResult.error}</p>
          </div>
        )}

        {/* Users Table */}
        {usersResult.success && usersResult.users && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Usage Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {usersResult.users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {user.name || "No name"}
                          </div>
                          <div className="text-sm text-slate-400">{user.email}</div>
                          <div className="text-xs text-slate-500">
                            Registered: {new Date(user.registered_date).toLocaleDateString("sv-SE")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{user.total_events} events</div>
                        <div className="text-xs text-slate-400">{user.page_views} page views</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-4 text-xs">
                          <span className="text-green-400">{user.transactions} transactions</span>
                          <span className="text-blue-400">{user.invoices} invoices</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.last_active
                          ? new Date(user.last_active).toLocaleDateString("sv-SE")
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-cyan-400 hover:text-cyan-300 mr-3">
                          View Details
                        </button>
                        <ImpersonateButton userId={user.id} userName={user.name || user.email} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {usersResult.success && usersResult.users && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-white">{usersResult.users.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">Active Users</h3>
              <p className="text-3xl font-bold text-white">
                {usersResult.users.filter((u) => u.total_events > 0).length}
              </p>
              <p className="text-sm text-slate-400">with activity in last 30 days</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">New Users</h3>
              <p className="text-3xl font-bold text-white">
                {
                  usersResult.users.filter((u) => {
                    const registered = new Date(u.registered_date);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return registered > thirtyDaysAgo;
                  }).length
                }
              </p>
              <p className="text-sm text-slate-400">in last 30 days</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
