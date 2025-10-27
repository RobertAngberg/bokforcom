"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { auth } from "../../_lib/better-auth";
import { headers } from "next/headers";

/**
 * Server action för att tracka user events
 */
export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
  pageUrl?: string
) {
  try {
    // Använd ensureSession för att få rätt userId (respekterar impersonation)
    const { userId } = await ensureSession();

    // Spara till databas med effective userId (den impersonerade användaren om applicerbart)
    const result = await pool.query(
      `INSERT INTO user_events (user_id, event_name, properties, page_url, timestamp) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id`,
      [userId, eventName, JSON.stringify(properties), pageUrl || null]
    );

    return { success: true, eventId: result.rows[0].id };
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return { success: false, error: "Failed to track event" };
  }
}

/**
 * Hämta analytics data för admin dashboard
 */
export async function getAnalyticsData(days = 30) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "No session" };
    }

    // TODO: Lägg till admin check här
    // if (session.user.id !== "ADMIN_USER_ID") {
    //   return { success: false, error: "Access denied" };
    // }

    const [summaryResult, popularPagesResult, userStatsResult, eventBreakdownResult] =
      await Promise.all([
        // Daily summary
        pool.query(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
          COUNT(CASE WHEN event_name IN ('transaction_saved', 'transaction_created') THEN 1 END) as transactions,
          COUNT(CASE WHEN event_name IN ('invoice_created', 'invoice_sent') THEN 1 END) as invoices
        FROM user_events 
        WHERE timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `),

        // Popular pages
        pool.query(`
        SELECT 
          page_url,
          COUNT(*) as view_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM user_events 
        WHERE event_name = 'page_view' 
          AND timestamp >= NOW() - INTERVAL '${days} days'
          AND page_url IS NOT NULL
        GROUP BY page_url
        ORDER BY view_count DESC
        LIMIT 10
      `),

        // User activity stats (from events only)
        pool.query(`
        SELECT 
          e.user_id,
          u.email as user_email,
          u.name as user_name,
          MIN(e.timestamp) as first_activity,
          MAX(e.timestamp) as last_active,
          COUNT(*) as total_events,
          COUNT(CASE WHEN e.event_name = 'page_view' THEN 1 END) as page_views,
          COUNT(CASE WHEN e.event_name IN ('transaction_saved', 'transaction_created') THEN 1 END) as transactions,
          COUNT(CASE WHEN e.event_name IN ('invoice_created', 'invoice_sent') THEN 1 END) as invoices,
          COUNT(DISTINCT DATE(e.timestamp)) as active_days
        FROM user_events e
        LEFT JOIN "user" u ON e.user_id = u.id
        WHERE e.timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY e.user_id, u.email, u.name
        ORDER BY total_events DESC
        LIMIT 20
      `), // Recent events with user info
        pool.query(`
        SELECT 
          e.id,
          e.event_name,
          e.user_id,
          e.timestamp,
          e.properties,
          u.email as user_email,
          u.name as user_name
        FROM user_events e
        LEFT JOIN "user" u ON e.user_id = u.id
        WHERE e.timestamp >= NOW() - INTERVAL '${days} days'
        ORDER BY e.timestamp DESC
        LIMIT 100
      `),
      ]);

    return {
      success: true,
      data: {
        summary: summaryResult.rows,
        popularPages: popularPagesResult.rows,
        userStats: userStatsResult.rows,
        recentEvents: eventBreakdownResult.rows,
        totalUsers: userStatsResult.rows.length,
        activeUsers: userStatsResult.rows.filter((u) => u.total_events > 0).length,
      },
    };
  } catch (error) {
    console.error("Analytics data error:", error);
    return { success: false, error: "Failed to fetch analytics" };
  }
}
