import { apiGet } from "./client";

export type DashboardMetrics = {
  totalUsers: number;
  activeSubscribers: number;
  revenueToday: number;
  monthlyRevenue: number;
  watchHours7d: number;
  contentCount: number;
  failedPayments30d: number;
  newSignups7d: number;
};

export type RevenueTrendPoint = { month: string; revenue: number; newSubscriptions: number };
export type PlanMixSlice = { name: string; value: number };
export type WatchHoursPoint = { day: string; hours: number };
export type TopContentRow = { id: number; title: string; type: "movie" | "series"; views: number; hours: number };
export type ActivityItem = { id: string; actor: string; action: string; target: string; time: string };

export type DashboardOverview = {
  metrics: DashboardMetrics;
  revenueTrend: RevenueTrendPoint[];
  planMix: PlanMixSlice[];
  watchHoursByDay: WatchHoursPoint[];
  topContent: TopContentRow[];
  recentActivity: ActivityItem[];
};

export const getDashboardOverview = () => apiGet<DashboardOverview>("/dashboard");
