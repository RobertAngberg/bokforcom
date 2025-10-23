"use client";

interface UserStat {
  user_id: string;
  user_email: string;
  user_name: string | null;
  first_activity: string;
  last_active: string;
  total_events: number;
  page_views: number;
  transactions: number;
  invoices: number;
  active_days: number;
}

interface UserActivityTableProps {
  userStats: UserStat[];
  onUserClick: (userId: string) => void;
}

export default function UserActivityTable({ userStats, onUserClick }: UserActivityTableProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">📈 Användaraktivitet</h2>
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Användare
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Senast aktiv
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Events</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Sidvisningar
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Transaktioner
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                  Aktiva dagar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {userStats.slice(0, 10).map((stat) => (
                <tr key={stat.user_id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onUserClick(stat.user_id)}
                      className="text-white hover:text-slate-300 underline underline-offset-2 decoration-dotted cursor-pointer"
                    >
                      {stat.user_name || stat.user_email}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {new Date(stat.last_active).toLocaleDateString("sv-SE")}
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{stat.total_events}</td>
                  <td className="px-4 py-3 text-sm text-white">{stat.page_views}</td>
                  <td className="px-4 py-3 text-sm text-white">{stat.transactions}</td>
                  <td className="px-4 py-3 text-sm text-white">{stat.active_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
