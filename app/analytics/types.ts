// Analytics types
export interface UserEvent {
  id: number;
  user_id: string;
  event_name: string;
  properties: Record<string, unknown>;
  page_url: string | null;
  timestamp: Date;
}

export interface AnalyticsSummary {
  date: string;
  total_events: number;
  unique_users: number;
  page_views: number;
  transactions: number;
  invoices: number;
}

export interface PopularPage {
  page_url: string;
  view_count: number;
  unique_users: number;
}

export interface UserStats {
  user_id: string;
  email: string;
  name: string;
  registered_date: Date;
  last_active: Date;
  total_events: number;
  page_views: number;
  transactions: number;
  invoices: number;
}

export interface AdminAnalytics {
  summary: AnalyticsSummary[];
  popularPages: PopularPage[];
  userStats: UserStats[];
  activeUsers: number;
  totalUsers: number;
}
