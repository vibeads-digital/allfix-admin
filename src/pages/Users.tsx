import { useState } from 'react';
import { ShieldOff, ShieldCheck, Eye, ArrowUpDown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePageSearch } from '@/store/topbar-search';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users as UsersIcon } from 'lucide-react';
import { cn, todayIstIso } from '@/lib/utils';
import {
  adminListUsers,
  setUserStatus,
  type AdminUser,
  type UserAccountStatus,
} from '@/lib/api/user';
import { getPlans } from '@/lib/api/plan';

const USERS_KEY = ['users', 'admin'] as const;
const STATUS_LABEL: Record<UserAccountStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
};

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'createdAt:desc', label: 'Recently joined' },
  { value: 'createdAt:asc', label: 'Oldest joined' },
  { value: 'fullname:asc', label: 'Name (A-Z)' },
  { value: 'fullname:desc', label: 'Name (Z-A)' },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatHours(seconds: number) {
  return `${Math.round(seconds / 3600)}h`;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [planId, setPlanId] = useState<number | 'all'>('all');
  const [status, setStatus] = useState<UserAccountStatus | 'all'>('all');
  // Unlike Payments/Subscriptions, this doesn't default to today — Users is
  // an all-time roster, not a day-by-day transaction log, so defaulting to
  // "today only" would hide almost everyone the moment the page opens.
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<AdminUser | null>(null);
  const pageSize = 10;
  usePageSearch('Search by name, email or mobile…', q, (v) => {
    setQ(v);
    setPage(1);
  });

  const [orderBy, order] = sort.split(':') as [
    'createdAt' | 'fullname',
    'asc' | 'desc',
  ];

  const { data, isLoading } = useQuery({
    queryKey: [...USERS_KEY, status, planId, dateFrom, dateTo, sort, q, page],
    queryFn: () =>
      adminListUsers({
        status,
        planId: planId === 'all' ? undefined : planId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        order,
        orderBy,
        search: q || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
  });

  const activeCountQuery = useQuery({
    queryKey: [...USERS_KEY, 'active-count'],
    queryFn: () => adminListUsers({ status: 'active', limit: 1 }),
  });

  const plansQuery = useQuery({
    queryKey: ['plans', 'all'],
    queryFn: () => getPlans({ status: 'active' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: UserAccountStatus }) =>
      setUserStatus(id, next),
    onSuccess: (_res, { next }) => {
      toast.success(next === 'suspended' ? 'User suspended' : 'User activated');
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      setActive((prev) => (prev ? { ...prev, accountStatus: next } : prev));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader
        title="Users"
        description={`${total} account${total === 1 ? '' : 's'} • ${activeCountQuery.data?.total ?? 0} active`}
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(planId)}
            onValueChange={(v) => {
              setPlanId(v === 'all' ? 'all' : Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {plansQuery.data?.plans.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as UserAccountStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-[170px]">
              <ArrowUpDown className="size-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-9 w-auto text-sm"
              aria-label="Joined from date"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              max={todayIstIso()}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-9 w-auto text-sm"
              aria-label="Joined to date"
            />
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">
          Loading…
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="No accounts match these filters."
        />
      ) : (
        <Card className="overflow-hidden p-0 gap-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3">User</th>
                  <th className="px-2 py-3">Plan</th>
                  <th className="px-2 py-3">Devices</th>
                  <th className="px-2 py-3">Watch hours</th>
                  <th className="px-2 py-3">Joined</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const name = u.fullname || u.email || u.phone || 'Unnamed';
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setActive(u)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-9">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {initials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{name}</div>
                            {u.email && (
                              <div className="text-xs text-muted-foreground truncate">
                                {u.email}
                              </div>
                            )}
                            {u.phone && (
                              <div className="text-xs text-muted-foreground truncate">
                                {u.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {u.planName ?? '—'}
                      </td>
                      <td className="px-2 py-3 tabular-nums">
                        {u.deviceCount}
                      </td>
                      <td className="px-2 py-3 text-muted-foreground tabular-nums">
                        {formatHours(u.watchSeconds)}
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        className="px-2 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={u.accountStatus}
                          onValueChange={(v) =>
                            statusMutation.mutate({
                              id: u.id,
                              next: v as UserAccountStatus,
                            })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              'h-7 w-[110px] text-xs',
                              u.accountStatus === 'active' &&
                                'border-success/30 bg-success/10 text-success',
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">
                              Suspended
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-7"
                            aria-label="View"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActive(u);
                            }}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {u.accountStatus === 'active' ? (
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              aria-label="Suspend"
                              disabled={statusMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                statusMutation.mutate({ id: u.id, next: 'suspended' });
                              }}
                            >
                              <ShieldOff className="size-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-7 text-success hover:text-success"
                              aria-label="Activate"
                              disabled={statusMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                statusMutation.mutate({ id: u.id, next: 'active' });
                              }}
                            >
                              <ShieldCheck className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Showing {users.length} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {active.fullname || active.email || active.phone}
                </DialogTitle>
                <DialogDescription>
                  {[active.email, active.phone].filter(Boolean).join(' • ')}
                  {' • '}#{active.id}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Plan" value={active.planName ?? '—'} />
                <Stat
                  label="Status"
                  value={<StatusBadge status={STATUS_LABEL[active.accountStatus]} />}
                />
                <Stat label="Devices" value={String(active.deviceCount)} />
                <Stat label="Watch hours" value={formatHours(active.watchSeconds)} />
                <Stat
                  label="Joined"
                  value={new Date(active.createdAt).toLocaleDateString()}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3 bg-muted/20">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
