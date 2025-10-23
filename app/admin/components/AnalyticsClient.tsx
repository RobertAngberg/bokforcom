"use client";

import { useRef, useState } from "react";
import UserActivityTable from "./UserActivityTable";

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

interface EventBreakdown {
  id: number;
  event_name: string;
  user_id: string;
  timestamp: string;
  properties: Record<string, unknown>;
  user_email: string;
  user_name: string | null;
}

interface AnalyticsClientProps {
  userStats: UserStat[];
  recentEvents: EventBreakdown[];
}

export default function AnalyticsClient({ userStats, recentEvents }: AnalyticsClientProps) {
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  const handleUserClick = (userId: string) => {
    setFilterUserId(userId);
    // Scroll to events section
    setTimeout(() => {
      eventsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const filteredEvents = filterUserId
    ? recentEvents.filter((e) => e.user_id === filterUserId)
    : recentEvents;

  return (
    <>
      {/* User Activity Table with clickable names */}
      {userStats && userStats.length > 0 && (
        <UserActivityTable userStats={userStats} onUserClick={handleUserClick} />
      )}

      {/* Events List (filtered) */}
      {recentEvents && recentEvents.length > 0 && (
        <div ref={eventsRef}>
          <div className="bg-slate-900 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">
                📋 Senaste Events {filterUserId ? `(filtrerade)` : `(${recentEvents.length})`}
              </h3>
              {filterUserId && (
                <button
                  onClick={() => setFilterUserId(null)}
                  className="text-sm px-3 py-1 bg-slate-700 text-white hover:bg-slate-600 rounded"
                >
                  ✕ Visa alla events
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-medium text-slate-400">
                      Tidpunkt
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-slate-400">
                      Event
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-slate-400">
                      Användare
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium text-slate-400">
                      Detaljer
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-800/50">
                      <td className="px-3 py-2 text-sm text-white">
                        {new Date(event.timestamp).toLocaleString("sv-SE", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2 text-sm text-white">{event.event_name}</td>
                      <td className="px-3 py-2 text-sm text-white">
                        {event.user_name || event.user_email}
                      </td>
                      <td className="px-3 py-2 text-sm text-white">
                        {event.properties && Object.keys(event.properties).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-white hover:text-slate-300">
                              Visa detaljer
                            </summary>
                            <pre className="mt-1 text-xs bg-slate-950 p-2 rounded overflow-auto max-w-md text-white">
                              {JSON.stringify(event.properties, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
