import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  IndianRupee,
  Wallet,
  Clock,
  Film,
  AlertTriangle,
  UserPlus,
  TrendingUp,
  Plus,
  Bell,
  Tag,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getDashboardOverview } from '@/lib/api/dashboard';
import { formatRelativeTime } from '@/lib/utils';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
};

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const num = (n: number) => n.toLocaleString('en-IN');

const QUICK_ACTIONS = [
  { label: 'Upload Movie', icon: Film, to: '/movies' },
  { label: 'New Coupon', icon: CreditCard, to: '/coupons' },
  { label: 'Push Alert', icon: Bell, to: '/notifications' },
  { label: 'Add Banner', icon: Tag, to: '/homepage' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: getDashboardOverview,
  });

  const firstName = admin?.fullname?.trim().split(' ')[0] ?? 'Admin';

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening on AllFLix today."
        actions={
          <Button size="sm" onClick={() => navigate('/notifications')}>
            <Plus className="size-4 mr-2" />
            New Campaign
          </Button>
        }
      />

      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground py-12 text-center">
          Loading dashboard…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="Total Users"
              value={num(data.metrics.totalUsers)}
              icon={Users}
              accent="primary"
            />
            <MetricCard
              label="Active Subscribers"
              value={num(data.metrics.activeSubscribers)}
              icon={CreditCard}
              accent="info"
            />
            <MetricCard
              label="Revenue Today"
              value={inr(data.metrics.revenueToday)}
              icon={IndianRupee}
              accent="success"
            />
            <MetricCard
              label="Monthly Revenue"
              value={inr(data.metrics.monthlyRevenue)}
              icon={Wallet}
              accent="primary"
            />
            <MetricCard
              label="Watch Hours (7d)"
              value={num(data.metrics.watchHours7d)}
              icon={Clock}
              accent="info"
            />
            <MetricCard
              label="Content Count"
              value={num(data.metrics.contentCount)}
              icon={Film}
              accent="success"
            />
            <MetricCard
              label="Failed Payments (30d)"
              value={num(data.metrics.failedPayments30d)}
              icon={AlertTriangle}
              accent="warning"
            />
            <MetricCard
              label="New Signups (7d)"
              value={num(data.metrics.newSignups7d)}
              icon={UserPlus}
              accent="warning"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <SectionCard
              title="Revenue & New Subscriptions"
              description="Last 12 months"
              className="xl:col-span-2"
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate('/payments')}
                >
                  <TrendingUp className="size-3.5 mr-1" />
                  Detail
                </Button>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueTrend}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="sub" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--chart-2)"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-2)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₹)"
                      stroke="var(--chart-1)"
                      fill="url(#rev)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="newSubscriptions"
                      name="New Subscriptions"
                      stroke="var(--chart-2)"
                      fill="url(#sub)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              title="Plan Mix"
              description="Active subscriptions by plan"
            >
              {data.planMix.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No active subscriptions yet"
                  description="Plan distribution will show up here."
                />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.planMix}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {data.planMix.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                            stroke="var(--card)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <SectionCard
              title="Watch Time"
              description="Hours, this week"
              className="xl:col-span-1"
            >
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.watchHoursByDay}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: 'var(--muted)' }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="var(--chart-1)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              title="Top Performing Content"
              description="By watch hours, last 30 days"
              className="xl:col-span-2"
            >
              {data.topContent.length === 0 ? (
                <EmptyState
                  icon={Film}
                  title="No watch activity yet"
                  description="Top titles will show up here once viewers start watching."
                />
              ) : (
                <div className="overflow-x-auto -mx-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="font-medium px-5 py-2">Title</th>
                        <th className="font-medium py-2">Type</th>
                        <th className="font-medium py-2 text-right">Views</th>
                        <th className="font-medium px-5 py-2 text-right">
                          Hours
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topContent.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-5 py-3 font-medium">{c.title}</td>
                          <td className="py-3 text-muted-foreground capitalize">
                            {c.type}
                          </td>
                          <td className="py-3 text-right tabular-nums">
                            {c.views.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                            {c.hours.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <SectionCard title="Quick Actions" className="xl:col-span-1">
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.to)}
                    className="flex flex-col items-start gap-2 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-colors text-left"
                  >
                    <a.icon className="size-4 text-primary" />
                    <span className="text-xs font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Activity"
              description="Across the platform"
              className="xl:col-span-2"
            >
              {data.recentActivity.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Nothing yet"
                  description="Signups, payments, and published titles will show up here."
                />
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((a) => (
                    <li key={a.id} className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary text-[10px] font-medium grid place-items-center shrink-0">
                        {a.actor
                          .split(' ')
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{a.actor}</span>{' '}
                          <span className="text-muted-foreground">
                            {a.action}
                          </span>{' '}
                          {a.target && (
                            <span className="font-medium">{a.target}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(a.time)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </>
  );
}
