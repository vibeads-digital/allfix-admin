import { useState, useEffect, useRef } from 'react';
import { Plus, TicketPercent, Pencil, Trash2, Eye } from 'lucide-react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createCoupon,
  getCoupons,
  getCouponStats,
  setCouponStatus,
  updateCoupon,
  deleteCoupon,
  getCouponUsage,
  type Coupon,
} from '@/lib/api/coupon';
import { usePageSearch } from '@/store/topbar-search';
import { todayIstIso } from '@/lib/utils';

const COUPONS_KEY = ['coupons'] as const;
const COUPON_STATS_KEY = ['coupons', 'stats'] as const;

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percentage' as 'percentage' | 'flat',
  discountValue: '',
  maxUses: '',
  minimumAmount: '',
  validFrom: todayIstIso(),
  validUntil: '',
};

export function CouponsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  usePageSearch('Search coupons by code…', searchQuery, setSearchQuery);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const usageLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const LIMIT = 20;
  const USAGE_LIMIT = 20;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: COUPONS_KEY,
      queryFn: ({ pageParam = 0 }) =>
        getCoupons({
          status: 'all',
          limit: LIMIT,
          offset: pageParam as number,
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const totalLoaded = allPages.reduce(
          (sum, page) => sum + page.coupons.length,
          0,
        );
        return lastPage.coupons.length < LIMIT ? undefined : totalLoaded;
      },
    });

  // Aggregated by the backend across every coupon — summing the loaded page
  // would undercount once there's more than one page.
  const { data: statsData } = useQuery({
    queryKey: COUPON_STATS_KEY,
    queryFn: getCouponStats,
  });

  // Infinite scroll for coupons list
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // ----- Coupon usage (infinite scroll) -----
  const {
    data: usagePagesData,
    isLoading: isUsageLoading,
    fetchNextPage: fetchNextUsagePage,
    hasNextPage: hasNextUsagePage,
    isFetchingNextPage: isFetchingNextUsagePage,
  } = useInfiniteQuery({
    queryKey: ['coupon-usage', selectedCoupon?.id],
    queryFn: ({ pageParam = 0 }) =>
      getCouponUsage(selectedCoupon!.id, {
        limit: USAGE_LIMIT,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (sum, page) => sum + page.usage.length,
        0,
      );
      return lastPage.usage.length < USAGE_LIMIT ? undefined : totalLoaded;
    },
    enabled: !!selectedCoupon && usageDialogOpen,
  });

  const usageData = usagePagesData?.pages.flatMap((page) => page.usage) ?? [];

  // Infinite scroll for usage dialog
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextUsagePage &&
          !isFetchingNextUsagePage
        ) {
          fetchNextUsagePage();
        }
      },
      { threshold: 1 },
    );

    if (usageLoadMoreRef.current) {
      observer.observe(usageLoadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [
    fetchNextUsagePage,
    hasNextUsagePage,
    isFetchingNextUsagePage,
    usageDialogOpen,
  ]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: COUPONS_KEY });

  const formatDate = (date: string) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createCoupon({
        code: form.code,
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        minimumAmount: form.minimumAmount
          ? Number(form.minimumAmount)
          : undefined,
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: form.validUntil
          ? new Date(form.validUntil).toISOString()
          : undefined,
      }),
    onSuccess: () => {
      toast.success('Coupon created');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCoupon(editing!.id, {
        description: form.description || undefined,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        minimumAmount: form.minimumAmount
          ? Number(form.minimumAmount)
          : undefined,
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: form.validUntil
          ? new Date(form.validUntil).toISOString()
          : undefined,
      }),
    onSuccess: () => {
      toast.success('Coupon updated');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCoupon(id),
    onSuccess: () => {
      toast.success('Coupon deleted');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setCouponStatus(id, isActive),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description ?? '',
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      minimumAmount: coupon.minimumAmount ? String(coupon.minimumAmount) : '',
      validFrom: coupon.validFrom.slice(0, 10),
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openUsage = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setUsageDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const coupons = data?.pages.flatMap((page) => page.coupons) ?? [];
  const filteredCoupons = searchQuery
    ? coupons.filter((c) =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : coupons;
  const activeCount = statsData?.activeCount ?? 0;
  const totalRedemptions = statsData?.totalRedemptions ?? 0;
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <PageHeader
        title="Coupons & Promotions"
        description="Discounts, trial offers, and referral rewards"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            New coupon
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Active coupons', value: String(activeCount) },
          {
            label: 'Total redemptions',
            value: totalRedemptions.toLocaleString(),
          },
        ].map((s) => (
          <Card key={s.label} className="p-5 gap-2">
            <div className="flex items-center gap-2">
              <TicketPercent className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </Card>
        ))}
      </div>

      <SectionCard title="All coupons" description="Manage codes and limits">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Loading…
          </div>
        ) : filteredCoupons.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            title={searchQuery ? 'No matching coupons' : 'No coupons yet'}
            description={
              searchQuery
                ? 'Try a different code.'
                : 'Create one to get started.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="px-5 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Discount</th>
                    <th className="px-3 py-2 font-medium w-56">Usage</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 font-medium">Expires</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                    <th className="px-5 py-2 font-medium text-right w-px whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3 font-mono font-semibold">
                        {c.code}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground capitalize">
                        {c.discountType}
                      </td>
                      <td className="px-3 py-3 font-semibold text-primary">
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}%`
                          : `₹${c.discountValue}`}
                      </td>

                      <td className="px-3 py-3 w-56">
                        {c.maxUses ? (
                          <div className="space-y-2 max-w-[110px]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                Usage
                              </span>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {c.usedCount} / {c.maxUses}
                              </span>
                            </div>
                            <Progress
                              value={(c.usedCount / c.maxUses) * 100}
                              className="h-2"
                            />
                            <div className="text-[11px] text-muted-foreground text-right">
                              {Math.round((c.usedCount / c.maxUses) * 100)}%
                              used
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col max-w-[110px]">
                            <span className="font-semibold">
                              {c.usedCount} uses
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Unlimited usage
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{formatDate(c.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {c.validUntil ? formatDate(c.validUntil) : 'Never'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            status={c.isActive ? 'Active' : 'Paused'}
                          />
                          <Switch
                            checked={c.isActive}
                            onCheckedChange={(checked) =>
                              statusMutation.mutate({
                                id: c.id,
                                isActive: checked,
                              })
                            }
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            title="View"
                            onClick={() => openUsage(c)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Edit"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Delete"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => {
                              if (window.confirm('Delete this coupon?')) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              ref={loadMoreRef}
              className="py-4 text-center text-sm text-muted-foreground"
            >
              {isFetchingNextPage && <div>Loading more coupons...</div>}
            </div>
          </>
        )}
      </SectionCard>

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.code}` : 'New coupon'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div className="space-y-1.5">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="FAMILY10"
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional internal note"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Discount type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      discountType: v as 'percentage' | 'flat',
                    })
                  }
                  disabled={!!editing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discountValue">Discount value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="maxUses">Max uses (blank = unlimited)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={form.maxUses}
                  onChange={(e) =>
                    setForm({ ...form, maxUses: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minimumAmount">Minimum order amount</Label>
                <Input
                  id="minimumAmount"
                  type="number"
                  value={form.minimumAmount}
                  onChange={(e) =>
                    setForm({ ...form, minimumAmount: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="validFrom">Valid from</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={form.validFrom}
                  onChange={(e) =>
                    setForm({ ...form, validFrom: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="validUntil">Valid until (blank = never)</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm({ ...form, validUntil: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Create coupon'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Usage history dialog with infinite scroll */}
      <Dialog
        open={usageDialogOpen}
        onOpenChange={(open) => {
          setUsageDialogOpen(open);
          if (!open) setSelectedCoupon(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Usage History {selectedCoupon && `- ${selectedCoupon.code}`}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Discount</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>

              <tbody>
                {isUsageLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-4 text-muted-foreground"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : usageData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No usage found
                    </td>
                  </tr>
                ) : (
                  usageData.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2">{u.userName}</td>
                      <td className="py-2">{u.userEmail}</td>
                      <td className="py-2">₹{u.discountAmount}</td>
                      <td className="py-2">
                        {new Date(u.usedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div
              ref={usageLoadMoreRef}
              className="py-4 text-center text-sm text-muted-foreground"
            >
              {isFetchingNextUsagePage && <div>Loading more usage...</div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
