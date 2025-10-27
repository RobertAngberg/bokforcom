import { getAnalyticsData } from "../actions/analyticsActions";
import { getAllUsers } from "../actions/userActions";
import MainLayout from "../../_components/MainLayout";
import ImpersonateButton from "./ImpersonateButton";
import AnalyticsClient from "./AnalyticsClient";

// Types
interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  emailVerified: boolean;
}

interface DaySummary {
  date: string;
  total_events: number;
  unique_users: number;
  page_views: number;
  transactions: number;
  invoices: number;
}

export default async function AdminDashboard() {
  // Fetch both analytics and user data
  const [analyticsResult, usersResult] = await Promise.all([
    getAnalyticsData(30),
    getAllUsers().catch(() => ({ success: false, users: [] as User[] })),
  ]);

  const analytics = analyticsResult.success ? analyticsResult.data : null;
  const users: User[] = usersResult.success ? usersResult.users : [];

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      </div>

      <div className="space-y-8">
        {/* Analytics Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Analytics (senaste 30 dagarna)
          </h2>

          {!analytics ? (
            <div className="bg-slate-900 rounded-lg p-6">
              <p className="text-slate-400">Kunde inte ladda analytics data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Analytics Cards */}
              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Totala Events</h3>
                <p className="text-2xl font-bold text-cyan-400">
                  {analytics.summary.reduce(
                    (sum: number, day: DaySummary) => sum + day.total_events,
                    0
                  )}
                </p>
              </div>

              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Unika Användare</h3>
                <p className="text-2xl font-bold text-green-400">
                  {Math.max(...analytics.summary.map((day: DaySummary) => day.unique_users), 0)}
                </p>
              </div>

              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Sidvisningar</h3>
                <p className="text-2xl font-bold text-blue-400">
                  {analytics.summary.reduce(
                    (sum: number, day: DaySummary) => sum + day.page_views,
                    0
                  )}
                </p>
              </div>

              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Transaktioner</h3>
                <p className="text-2xl font-bold text-yellow-400">
                  {analytics.summary.reduce(
                    (sum: number, day: DaySummary) => sum + day.transactions,
                    0
                  )}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Users Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            👥 Användarhantering ({users.length} användare)
          </h2>

          {users.length === 0 ? (
            <div className="bg-slate-900 rounded-lg p-6">
              <p className="text-slate-400">Inga användare hittades</p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                        Namn
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                        Registrerad
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                        Verifierad
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                        Åtgärder
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((user: User) => (
                      <tr key={user.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm text-white">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{user.name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.emailVerified
                                ? "bg-green-900 text-green-300"
                                : "bg-red-900 text-red-300"
                            }`}
                          >
                            {user.emailVerified ? "Ja" : "Nej"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <ImpersonateButton userId={user.id} userName={user.name || user.email} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Analytics Client - User Activity & Events with filtering */}
        {analytics?.userStats && analytics?.recentEvents && (
          <AnalyticsClient userStats={analytics.userStats} recentEvents={analytics.recentEvents} />
        )}
      </div>
    </MainLayout>
  );
}
