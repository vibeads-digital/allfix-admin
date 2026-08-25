import { useState } from 'react';
import {
  Plus,
  ArrowUpDown,
  ArrowLeftRight,
  CalendarPlus,
  Search,
  BadgeCheck,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePageSearch } from '@/store/topbar-search';
import {
  adminListSubscriptions,
  getPlanDistribution,
  grantSubscription,
  extendSubscription,
  changeSubscriptionPlan,
  type AdminSubscription,
  type SubscriptionStatus,
} from '@/lib/api/subscription';
import { adminListUsers, type AdminUser } from '@/lib/api/user';
import { getPlans, type Plan } from '@/lib/api/plan';
import { todayIstIso } from '@/lib/utils';

const SUBSCRIPTIONS_KEY = ['subscriptions', 'admin'] as const;
const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: 'Trial',
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  expired: 'Archived',
  renewal_failed: 'Failed',
  pending: 'Pending',
};

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'createdAt:desc', label: 'Recently added' },
  { value: 'createdAt:asc', label: 'Oldest added' },
  { value: 'endAt:asc', label: 'Expiring soon' },
  { value: 'endAt:desc', label: 'Expiring last' },
];

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [planId, setPlanId] = useState<number | 'all'>('all');
  const [status, setStatus] = useState<SubscriptionStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState(todayIstIso);
  const [dateTo, setDateTo] = useState(todayIstIso);
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  usePageSearch('Search by name, email or mobile…', q, (v) => {
    setQ(v);
    setPage(1);
  });

  const [grantOpen, setGrantOpen] = useState(false);
  const [extending, setExtending] = useState<AdminSubscription | null>(null);
  const [changingPlan, setChangingPlan] = useState<AdminSubscription | null>(
    null,
  );

  const [orderBy, order] = sort.split(':') as ['createdAt' | 'endAt', 'asc' | 'desc'];

  const { data, isLoading } = useQuery({
    queryKey: [...SUBSCRIPTIONS_KEY, status, planId, dateFrom, dateTo, sort, q, page],
    queryFn: () =>
      adminListSubscriptions({
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

  const distributionQuery = useQuery({
    queryKey: ['subscriptions', 'plan-distribution', status, planId, dateFrom, dateTo, q],
    queryFn: () =>
      getPlanDistribution({
        status,
        planId: planId === 'all' ? undefined : planId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: q || undefined,
      }),
  });

  const plansQuery = useQuery({
    queryKey: ['plans', 'all'],
    queryFn: () => getPlans({ status: 'active' }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY });

  const extendMutation = useMutation({
    mutationFn: ({ id, extendDays }: { id: number; extendDays: number }) =>
      extendSubscription(id, extendDays),
    onSuccess: () => {
      toast.success('Subscription extended');
      invalidate();
      setExtending(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const changePlanMutation = useMutation({
    mutationFn: ({ id, planId }: { id: number; planId: number }) =>
      changeSubscriptionPlan(id, planId),
    onSuccess: () => {
      toast.success('Plan changed');
      invalidate();
      setChangingPlan(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const subscriptions = data?.subscriptions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description={`${total} subscription${total === 1 ? '' : 's'}`}
        actions={
          <Button size="sm" onClick={() => setGrantOpen(true)}>
            <Plus className="size-4 mr-2" />
            Grant subscription
          </Button>
        }
      />

      {!!distributionQuery.data?.distribution.length && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          {distributionQuery.data.distribution.map((d) => (
            <Card key={d.planId} className="p-3.5 gap-1">
              <div className="text-xs text-muted-foreground truncate">
                {d.planName}
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {d.count}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(planId)}
            onValueChange={(v) => {
              setPlanId(v === 'all' ? 'all' : Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px]">
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
              setStatus(v as SubscriptionStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
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
              aria-label="From date"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-9 w-auto text-sm"
              aria-label="To date"
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
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="No subscriptions found"
          description="No subscriptions match these filters."
        />
      ) : (
        <Card className="overflow-hidden p-0 gap-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3">User</th>
                  <th className="px-2 py-3">Plan</th>
                  <th className="px-2 py-3">Started</th>
                  <th className="px-2 py-3">Expires</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium truncate">
                        {s.userFullname || s.userEmail || s.userPhone}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.userEmail ?? s.userPhone}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {s.planName}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {new Date(s.startAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {new Date(s.endAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={STATUS_LABEL[s.status]} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChangingPlan(s)}
                        >
                          <ArrowLeftRight className="size-3.5 mr-1" />
                          Change plan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExtending(s)}
                        >
                          <CalendarPlus className="size-3.5 mr-1" />
                          Extend
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Showing {subscriptions.length} of {total}
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

      <GrantDialog
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        onGranted={invalidate}
      />

      <Dialog
        open={!!extending}
        onOpenChange={(o) => !o && setExtending(null)}
      >
        <DialogContent className="max-w-sm">
          {extending && (
            <ExtendForm
              subscription={extending}
              pending={extendMutation.isPending}
              onCancel={() => setExtending(null)}
              onSubmit={(extendDays) =>
                extendMutation.mutate({ id: extending.id, extendDays })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!changingPlan}
        onOpenChange={(o) => !o && setChangingPlan(null)}
      >
        <DialogContent className="max-w-sm">
          {changingPlan && (
            <ChangePlanForm
              subscription={changingPlan}
              plans={plansQuery.data?.plans ?? []}
              pending={changePlanMutation.isPending}
              onCancel={() => setChangingPlan(null)}
              onSubmit={(planId) =>
                changePlanMutation.mutate({ id: changingPlan.id, planId })
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ExtendForm({
  subscription,
  pending,
  onCancel,
  onSubmit,
}: {
  subscription: AdminSubscription;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (extendDays: number) => void;
}) {
  const [days, setDays] = useState('30');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(days);
        if (!n || n <= 0) {
          toast.error('Enter a positive number of days.');
          return;
        }
        onSubmit(n);
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>Extend subscription</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        {subscription.userFullname || subscription.userEmail} —{' '}
        {subscription.planName}. Currently expires{' '}
        {new Date(subscription.endAt).toLocaleDateString()}.
      </p>
      <div>
        <Label>Extend by (days)</Label>
        <Input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="mt-1.5"
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Extending…' : 'Extend'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ChangePlanForm({
  subscription,
  plans,
  pending,
  onCancel,
  onSubmit,
}: {
  subscription: AdminSubscription;
  plans: Plan[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (planId: number) => void;
}) {
  const [planId, setPlanId] = useState<number | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!planId) {
          toast.error('Pick a plan.');
          return;
        }
        onSubmit(planId);
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>Change plan</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        {subscription.userFullname || subscription.userEmail} — currently on{' '}
        {subscription.planName}.
      </p>
      <div>
        <Label>New plan</Label>
        <Select
          value={planId ? String(planId) : ''}
          onValueChange={(v) => setPlanId(Number(v))}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {plans
              .filter((p) => p.id !== subscription.planId)
              .map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Changing…' : 'Change plan'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function GrantDialog({
  open,
  onClose,
  onGranted,
}: {
  open: boolean;
  onClose: () => void;
  onGranted: () => void;
}) {
  const [userQuery, setUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [planId, setPlanId] = useState<number | null>(null);
  const [durationDays, setDurationDays] = useState('');

  const usersQuery = useQuery({
    queryKey: ['users', 'search', userQuery],
    queryFn: () => adminListUsers({ search: userQuery, limit: 5 }),
    enabled: userQuery.trim().length > 1 && !selectedUser,
  });

  const plansQuery = useQuery({
    queryKey: ['plans', 'all'],
    queryFn: () => getPlans({ status: 'active' }),
    enabled: open,
  });

  const plan = plansQuery.data?.plans.find((p) => p.id === planId);

  const reset = () => {
    setUserQuery('');
    setSelectedUser(null);
    setPlanId(null);
    setDurationDays('');
  };

  const grantMutation = useMutation({
    mutationFn: () =>
      grantSubscription({
        userId: selectedUser!.id,
        planId: planId!,
        durationDays: durationDays ? Number(durationDays) : undefined,
      }),
    onSuccess: () => {
      toast.success('Subscription granted');
      onGranted();
      reset();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Pick a user first.');
      return;
    }
    if (!planId) {
      toast.error('Pick a plan.');
      return;
    }
    grantMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Grant subscription</DialogTitle>
          </DialogHeader>

          <div>
            <Label>
              User <span className="text-destructive">*</span>
            </Label>
            {selectedUser ? (
              <div className="mt-1.5 flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {selectedUser.fullname || selectedUser.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedUser.email ?? selectedUser.phone}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative mt-1.5">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search by name, email or mobile…"
                  className="pl-9"
                />
                {userQuery.trim().length > 1 && (
                  <div className="mt-1 rounded-md border border-border max-h-48 overflow-y-auto">
                    {usersQuery.isLoading ? (
                      <p className="p-2 text-xs text-muted-foreground">
                        Searching…
                      </p>
                    ) : usersQuery.data?.users.length === 0 ? (
                      <p className="p-2 text-xs text-muted-foreground">
                        No users found.
                      </p>
                    ) : (
                      usersQuery.data?.users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setUserQuery('');
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b border-border/50 last:border-0"
                        >
                          <div className="font-medium truncate">
                            {u.fullname || u.email || u.phone}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {u.email ?? u.phone}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label>
              Plan <span className="text-destructive">*</span>
            </Label>
            <Select
              value={planId ? String(planId) : ''}
              onValueChange={(v) => {
                setPlanId(Number(v));
                const p = plansQuery.data?.plans.find((pl) => pl.id === Number(v));
                if (p) setDurationDays(String(p.durationInDays));
              }}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plansQuery.data?.plans.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Duration (days)</Label>
            <Input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder={plan ? String(plan.durationInDays) : 'Defaults to plan duration'}
              className="mt-1.5"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={grantMutation.isPending}>
              {grantMutation.isPending ? 'Granting…' : 'Grant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
