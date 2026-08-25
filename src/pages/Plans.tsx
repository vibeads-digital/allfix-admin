import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  TrendingUp,
  Zap,
  Shield,
  Crown,
  Sparkles,
  Headphones,
  MonitorPlay,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import {
  createPlan,
  getPlans,
  setPlanStatus,
  updatePlan,
  deletePlan,
  setDefaultPlan,
  getPlanStats,
  type Plan,
  type PlanStats,
  type Device,
  type UpdatePlanInput,
} from '@/lib/api/plan';
import { usePageSearch } from '@/store/topbar-search';

// Page size for each infinite-scroll batch. 9 keeps the math clean for the
// xl:grid-cols-3 layout (exactly 3 full rows per page).
const PAGE_SIZE = 9;

const PLANS_KEY = (search: string) => ['plans', { search }] as const;

const DEVICE_OPTIONS = [
  'mobile',
  'tablet',
  'desktop',
  'tv',
  'console',
] as const;

const emptyForm = {
  // Basic
  name: '',
  description: '',
  highlightText: '',
  index: '0',
  default: false,
  isActive: true,
  planType: 'paid' as Plan['planType'],

  // Pricing
  currency: 'INR',
  currencySign: '₹',
  price: '',
  originalPrice: '',
  discount: '0',

  // Billing
  billingCycle: 'monthly',
  durationInDays: '30',

  // Trial
  trialDays: '0',
  trialPrice: '',
  postTrialPlanId: '',

  // Limits
  maxScreens: '1',

  // Quality / perks
  videoQuality: 'hd' as Plan['videoQuality'],
  hdrSupport: false,
  dolbyAtmosSupport: false,
  earlyAccessContent: false,

  // Devices & features
  supportedDevices: ['mobile'] as Device[],
  featuresText: '',
};

type PlanForm = typeof emptyForm;

/** Builds the API payload from form state, converting strings to numbers
 *  and dropping empty-optional fields so the backend's .refine() rules
 *  (e.g. discount requires originalPrice) aren't tripped by stray "". */
function buildPlanPayload(form: PlanForm) {
  return {
    name: form.name,
    description: form.description.trim() || undefined,
    highlightText: form.highlightText.trim() || undefined,
    index: Number(form.index) || 0,
    default: form.default,
    isActive: form.isActive,
    planType: form.planType,

    currency: form.currency,
    currencySign: form.currencySign,
    price: Number(form.price),
    originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
    discount: Number(form.discount) || 0,

    billingCycle: form.billingCycle,
    durationInDays: Number(form.durationInDays),

    trialDays: Number(form.trialDays) || 0,
    trialPrice: form.trialPrice ? Number(form.trialPrice) : undefined,
    postTrialPlanId: form.postTrialPlanId
      ? Number(form.postTrialPlanId)
      : undefined,

    maxScreens: Number(form.maxScreens) || 1,

    videoQuality: form.videoQuality,
    hdrSupport: form.hdrSupport,
    dolbyAtmosSupport: form.dolbyAtmosSupport,
    earlyAccessContent: form.earlyAccessContent,

    supportedDevices: form.supportedDevices,
    features: form.featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean),
  };
}

/** Builds the PATCH payload for editing an existing plan. Cleared optional
 *  fields must be sent as `null`, not `undefined` — JSON.stringify drops
 *  `undefined` keys entirely, so an omitted key leaves the plan's existing
 *  value untouched on the backend instead of clearing it (e.g. removing the
 *  "Original" price or highlight badge and saving had no effect). */
function buildUpdatePayload(form: PlanForm): UpdatePlanInput {
  return {
    ...buildPlanPayload(form),
    description: form.description.trim() || null,
    highlightText: form.highlightText.trim() || null,
    originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
    trialPrice: form.trialPrice ? Number(form.trialPrice) : null,
    postTrialPlanId: form.postTrialPlanId
      ? Number(form.postTrialPlanId)
      : null,
  };
}

/** Validates step 1 (basic + pricing + billing) before allowing "Next" */
function isStep1Valid(form: PlanForm) {
  return (
    form.name.trim().length > 0 &&
    form.price !== '' &&
    form.durationInDays !== ''
  );
}

/** Returns a subtle accent color per card index — light, professional palette */
function cardAccent(idx: number) {
  const accents = [
    { from: 'from-red-50', border: 'border-red-200', icon: 'text-red-500' },
    { from: 'from-gray-50', border: 'border-gray-200', icon: 'text-gray-500' },
    { from: 'from-red-50', border: 'border-gray-200', icon: 'text-gray-400' },
  ];
  return accents[idx % accents.length];
}

const PlanIcon = ({ idx }: { idx: number }) => {
  const icons = [
    <Zap className="size-4" />,
    <Crown className="size-4" />,
    <Shield className="size-4" />,
  ];
  return icons[idx % icons.length];
};

export function PlansPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [statsForPlan, setStatsForPlan] = useState<Plan | null>(null);
  usePageSearch('Search plans…', searchQuery, setSearchQuery);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: PLANS_KEY(searchQuery),
      queryFn: ({ pageParam }) =>
        getPlans({
          status: 'all',
          limit: PAGE_SIZE,
          offset: pageParam,
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const loaded = allPages.reduce((sum, p) => sum + p.plans.length, 0);
        return loaded < lastPage.total ? loaded : undefined;
      },
    });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['plans'] });

  const createMutation = useMutation({
    mutationFn: () => createPlan(buildPlanPayload(form)),
    onSuccess: () => {
      toast.success('Plan created');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => updatePlan(editing!.id, buildUpdatePayload(form)),
    onSuccess: () => {
      toast.success('Plan updated');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const defaultMutation = useMutation({
    mutationFn: ({ id, isDefault }: { id: number; isDefault: boolean }) =>
      setDefaultPlan(id, isDefault),
    onSuccess: () => {
      toast.success('Default plan updated');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statsMutation = useMutation({
    mutationFn: getPlanStats,
    onSuccess: (data) => {
      setStats(data);
      setStatsOpen(true);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      toast.success('Plan deleted');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setPlanStatus(id, isActive),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? '',
      highlightText: plan.highlightText ?? '',
      index: String(plan.index),
      default: plan.default,
      isActive: plan.isActive,
      planType: plan.planType,

      currency: plan.currency,
      currencySign: plan.currencySign,
      price: String(plan.price),
      originalPrice:
        plan.originalPrice != null ? String(plan.originalPrice) : '',
      discount: String(plan.discount),

      billingCycle: plan.billingCycle,
      durationInDays: String(plan.durationInDays),

      trialDays: String(plan.trialDays),
      trialPrice: plan.trialPrice != null ? String(plan.trialPrice) : '',
      postTrialPlanId:
        plan.postTrialPlanId != null ? String(plan.postTrialPlanId) : '',

      maxScreens: String(plan.maxScreens),

      videoQuality: plan.videoQuality,
      hdrSupport: plan.hdrSupport,
      dolbyAtmosSupport: plan.dolbyAtmosSupport,
      earlyAccessContent: plan.earlyAccessContent,

      supportedDevices: plan.supportedDevices,
      featuresText: plan.features.join('\n'),
    });
    setStep(1);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setStep(1);
  };

  // FIX: Navigation between steps and the final save no longer rely on
  // <form onSubmit> at all. Relying on form-submit semantics is what caused
  // the "Next click -> auto save" bug: any button inside a <form> (even one
  // with type="button") can, depending on the Button component's prop
  // forwarding and browser quirks, still trigger a submit event bubbling up
  // from a click. To eliminate this entire class of bug, step navigation and
  // the final create/update call are both wired directly to onClick handlers
  // below, with no <form> element and no onSubmit/type="submit" anywhere in
  // this dialog.
  const goToStep2 = () => {
    if (!isStep1Valid(form)) return;
    setStep(2);
  };

  const goToStep1 = () => setStep(1);

  const handleSave = () => {
    if (form.supportedDevices.length === 0) return;
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const plans = useMemo(
    () => data?.pages.flatMap((p) => p.plans) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;
  const saving = createMutation.isPending || updateMutation.isPending;

  // ── Infinite scroll sentinel ──────────────────
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      {/* ── Page Header ───────────────────────────── */}
      <div className="relative mb-8 rounded-2xl overflow-hidden bg-white border border-gray-200 px-8 py-7 shadow-sm">
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Pricing management
            </p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Plans &amp; Tiers
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {plans.length} of {total} plan{total !== 1 ? 's' : ''} loaded
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            className="bg-red-600 text-white hover:bg-red-700 gap-1.5 font-semibold shadow-none rounded-xl px-5 h-9"
          >
            <Plus className="size-3.5" />
            New plan
          </Button>
        </div>
      </div>

      {/* ── Loading ───────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="size-8 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading plans…</p>
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          title="No plans yet"
          description="Create a plan to get started."
        />
      ) : (
        <>
          {/* ── Cards Grid — 3 per row ──────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {plans.map((p, idx) => {
              const accent = cardAccent(idx);
              return (
                <div
                  key={p.id}
                  className={cn(
                    'group relative flex flex-col rounded-2xl border bg-white overflow-hidden transition-all duration-200',
                    'shadow-sm hover:shadow-md hover:-translate-y-0.5',
                    p.default
                      ? 'border-red-300 ring-1 ring-red-200'
                      : 'border-gray-200',
                  )}
                >
                  {/* ── Highlight Text Banner ── */}
                  {p.highlightText && (
                    <div className="flex items-center justify-center gap-1.5 bg-red-600 py-1.5 px-3">
                      <Sparkles className="size-3 text-white flex-shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                        {p.highlightText}
                      </span>
                      <Sparkles className="size-3 text-white flex-shrink-0" />
                    </div>
                  )}

                  {/* Top accent strip (only when no highlight banner) */}
                  {!p.highlightText && (
                    <div
                      className={cn(
                        'h-1 w-full',
                        p.default ? 'bg-red-500' : 'bg-gray-100',
                      )}
                    />
                  )}

                  <div className="relative flex flex-col gap-4 p-5 flex-1">
                    {/* ── Card Header ── */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'size-8 rounded-xl flex items-center justify-center bg-white border shadow-sm',
                            accent.border,
                            accent.icon,
                          )}
                        >
                          <PlanIcon idx={idx} />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                            {p.name}
                          </h3>
                          <p className="text-[11px] text-gray-500 capitalize">
                            {p.planType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-semibold bg-gray-50 text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-full">
                          #{p.index}
                        </span>
                        {p.default && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Description ── */}
                    {p.description && (
                      <p className="text-xs text-gray-500 leading-relaxed -mt-1 border-l-2 border-gray-200 pl-2.5">
                        {p.description}
                      </p>
                    )}

                    {/* ── Pricing ── */}
                    <div className="flex items-end gap-1.5 flex-wrap">
                      <div className="flex flex-col">
                        {p.originalPrice && (
                          <span className="text-xs line-through text-gray-400 leading-none mb-0.5">
                            {p.currencySign}
                            {p.originalPrice}
                          </span>
                        )}
                        <div className="flex items-end gap-1.5">
                          <span className="text-4xl font-extrabold text-gray-900 leading-none tracking-tight">
                            {p.currencySign}
                            {p.price}
                          </span>
                          <span className="text-xs text-gray-500 mb-1">
                            / {p.billingCycle.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      {p.discount > 0 && (
                        <span className="mb-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full self-end">
                          -{Math.round(p.discount)}% off
                        </span>
                      )}
                    </div>

                    {/* ── Trial info ── */}
                    {p.trialDays > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 -mt-1">
                        <Sparkles className="size-3 flex-shrink-0" />
                        <span className="font-medium">
                          {p.trialDays}-day free trial
                          {p.trialPrice
                            ? ` then ${p.currencySign}${p.trialPrice}`
                            : ''}
                        </span>
                      </div>
                    )}

                    {/* ── Badges row ── */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="secondary"
                        className="text-[11px] rounded-lg px-2 font-normal capitalize bg-gray-100 text-gray-600"
                      >
                        {p.billingCycle.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[11px] rounded-lg px-2 font-medium uppercase border-gray-200 text-gray-600"
                      >
                        {p.videoQuality}
                      </Badge>
                      {p.hdrSupport && (
                        <Badge className="text-[11px] rounded-lg px-2 font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-100">
                          HDR
                        </Badge>
                      )}
                      {p.dolbyAtmosSupport && (
                        <Badge className="text-[11px] rounded-lg px-2 font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-100 flex items-center gap-1">
                          <Headphones className="size-2.5" />
                          Dolby
                        </Badge>
                      )}
                    </div>

                    {/* ── Features ── */}
                    {p.features.length > 0 && (
                      <ul className="space-y-1.5">
                        {p.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-center gap-2 text-xs text-gray-600"
                          >
                            <span className="size-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Check className="size-2.5 text-gray-500" />
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* ── Spec grid ── */}
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1.5">
                      {[
                        { label: 'Screens', value: p.maxScreens },
                        {
                          label: 'Early access',
                          value: p.earlyAccessContent ? 'Yes' : 'No',
                        },
                        ...(p.trialDays > 0
                          ? [{ label: 'Trial', value: `${p.trialDays} days` }]
                          : []),
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex justify-between text-xs"
                        >
                          <span className="text-gray-500">{label}</span>
                          <span className="font-semibold text-gray-700">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* ── Devices ── */}
                    <div className="flex flex-wrap gap-1">
                      {p.supportedDevices.map((device) => (
                        <span
                          key={device}
                          className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-500 capitalize"
                        >
                          <MonitorPlay className="size-2.5" />
                          {device}
                        </span>
                      ))}
                    </div>

                    {/* ── Footer actions ── */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          type="button"
                          aria-label="Edit plan"
                          onClick={() => openEdit(p)}
                          className="size-7 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 flex items-center justify-center transition-colors"
                        >
                          <Pencil className="size-3" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          aria-label="Delete plan"
                          onClick={() => deleteMutation.mutate(p.id)}
                          className="size-7 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>

                        {/* Set Default */}
                        <button
                          type="button"
                          onClick={() =>
                            defaultMutation.mutate({
                              id: p.id,
                              isDefault: true,
                            })
                          }
                          className={cn(
                            'text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors',
                            p.default
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700',
                          )}
                        >
                          {p.default ? '✓ Default' : 'Set default'}
                        </button>

                        {/* Stats */}
                        <button
                          type="button"
                          aria-label="View stats"
                          onClick={() => {
                            setStatsForPlan(p);
                            statsMutation.mutate(p.id);
                          }}
                          className="size-7 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 flex items-center justify-center transition-colors"
                        >
                          <BarChart3 className="size-3" />
                        </button>
                      </div>

                      {/* Active toggle */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-[10px] font-semibold',
                            p.isActive ? 'text-emerald-600' : 'text-gray-400',
                          )}
                        >
                          {p.isActive ? 'Live' : 'Off'}
                        </span>
                        <Switch
                          checked={p.isActive}
                          onCheckedChange={(checked) =>
                            statusMutation.mutate({
                              id: p.id,
                              isActive: checked,
                            })
                          }
                          className="data-[state=checked]:bg-emerald-500 scale-90"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Infinite scroll sentinel + loading indicator ── */}
          <div
            ref={sentinelRef}
            className="flex items-center justify-center py-8"
          >
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading more plans…
              </div>
            )}
            {!hasNextPage && plans.length > 0 && (
              <p className="text-xs text-muted-foreground">
                You've reached the end — {total} plan{total !== 1 ? 's' : ''}{' '}
                total.
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Create / Edit Dialog — 2 step wizard, no scroll ──────────────── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              {editing ? `Edit — ${editing.name}` : 'Create new plan'}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 pb-1">
            <div
              className={cn(
                'flex items-center gap-2 text-xs font-semibold',
                step === 1 ? 'text-red-600' : 'text-gray-400',
              )}
            >
              <span
                className={cn(
                  'size-5 rounded-full flex items-center justify-center text-[11px]',
                  step === 1
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-500',
                )}
              >
                1
              </span>
              Plan details
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div
              className={cn(
                'flex items-center gap-2 text-xs font-semibold',
                step === 2 ? 'text-red-600' : 'text-gray-400',
              )}
            >
              <span
                className={cn(
                  'size-5 rounded-full flex items-center justify-center text-[11px]',
                  step === 2
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-500',
                )}
              >
                2
              </span>
              Perks &amp; features
            </div>
          </div>

          {/* No <form> element here on purpose — see handleSave/goToStep2 comments above.
              The onKeyDown guard below stops the Enter key inside any text input from
              doing anything implicit; navigation only ever happens via explicit button clicks. */}
          <div
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                (e.target as HTMLElement).tagName !== 'TEXTAREA'
              ) {
                e.preventDefault();
              }
            }}
            className="space-y-4 pt-1"
          >
            {/* ══════════════════ STEP 1 ══════════════════ */}
            {step === 1 && (
              <>
                {/* ── Basic info ───────────────────────── */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="plan-name"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      Plan name
                    </Label>
                    <Input
                      id="plan-name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g. Standard"
                      required
                      className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="description"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      Description
                    </Label>
                    <textarea
                      id="description"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-1 focus:ring-red-400 focus:border-red-400 resize-none"
                      placeholder="Short subtitle shown under the plan name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="highlightText"
                        className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        Highlight badge
                      </Label>
                      <Input
                        id="highlightText"
                        value={form.highlightText}
                        onChange={(e) =>
                          setForm({ ...form, highlightText: e.target.value })
                        }
                        placeholder="e.g. Most popular"
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Plan type
                      </Label>
                      <Select
                        value={form.planType}
                        onValueChange={(v) =>
                          setForm({ ...form, planType: v as Plan['planType'] })
                        }
                      >
                        <SelectTrigger
                          type="button"
                          className="rounded-xl focus:ring-red-400 focus:ring-1"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="index"
                        className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        Sort index
                      </Label>
                      <Input
                        id="index"
                        type="number"
                        value={form.index}
                        onChange={(e) =>
                          setForm({ ...form, index: e.target.value })
                        }
                        placeholder="0"
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <p className="text-[11px] text-gray-400 pb-2.5">
                        Lower numbers show first in the pricing list.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                      <Label
                        htmlFor="isActive"
                        className="text-xs font-medium text-gray-600"
                      >
                        Active
                      </Label>
                      <Switch
                        id="isActive"
                        checked={form.isActive}
                        onCheckedChange={(checked) =>
                          setForm({ ...form, isActive: checked })
                        }
                      />
                    </div>
                    <div className="flex-1 flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                      <Label
                        htmlFor="default"
                        className="text-xs font-medium text-gray-600"
                      >
                        Default
                      </Label>
                      <Switch
                        id="default"
                        checked={form.default}
                        onCheckedChange={(checked) =>
                          setForm({ ...form, default: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* ── Pricing & billing ─────────────────── */}
                <div className="space-y-3 pt-1 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 pt-3">
                    Pricing &amp; billing
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="price"
                        className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        Price
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: e.target.value })
                        }
                        placeholder="299"
                        required
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="originalPrice"
                        className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        Original
                      </Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={form.originalPrice}
                        onChange={(e) =>
                          setForm({ ...form, originalPrice: e.target.value })
                        }
                        placeholder="optional"
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="discount"
                        className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        Discount %
                      </Label>
                      <Input
                        id="discount"
                        type="number"
                        min={0}
                        max={100}
                        value={form.discount}
                        onChange={(e) =>
                          setForm({ ...form, discount: e.target.value })
                        }
                        disabled={!form.originalPrice}
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="billingCycle"
                        className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        Billing cycle
                      </Label>
                      <Input
                        id="billingCycle"
                        placeholder="e.g. Monthly, Weekly, 15 Days"
                        value={form.billingCycle}
                        onChange={(e) =>
                          setForm({ ...form, billingCycle: e.target.value })
                        }
                        required
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="durationInDays"
                        className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        Duration (days)
                      </Label>
                      <Input
                        id="durationInDays"
                        type="number"
                        value={form.durationInDays}
                        onChange={(e) =>
                          setForm({ ...form, durationInDays: e.target.value })
                        }
                        required
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════ STEP 2 ══════════════════ */}
            {step === 2 && (
              <>
                {/* ── Trial & limits ───────────────────── */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Trial &amp; limits
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Trial days
                      </Label>
                      <Input
                        type="number"
                        value={form.trialDays}
                        onChange={(e) =>
                          setForm({ ...form, trialDays: e.target.value })
                        }
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Trial price
                      </Label>
                      <Input
                        type="number"
                        value={form.trialPrice}
                        onChange={(e) =>
                          setForm({ ...form, trialPrice: e.target.value })
                        }
                        placeholder="optional"
                        disabled={Number(form.trialDays) <= 0}
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Max screens
                      </Label>
                      <Input
                        type="number"
                        value={form.maxScreens}
                        onChange={(e) =>
                          setForm({ ...form, maxScreens: e.target.value })
                        }
                        className="rounded-xl focus-visible:ring-red-400 focus-visible:ring-1"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Quality & perks ──────────────────── */}
                <div className="space-y-3 pt-1 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 pt-3">
                    Quality &amp; perks
                  </p>

                  <Select
                    value={form.videoQuality}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        videoQuality: v as Plan['videoQuality'],
                      })
                    }
                  >
                    <SelectTrigger
                      type="button"
                      className="rounded-xl focus:ring-red-400 focus:ring-1"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sd">SD</SelectItem>
                      <SelectItem value="hd">HD</SelectItem>
                      <SelectItem value="fhd">Full HD</SelectItem>
                      <SelectItem value="2k">2K</SelectItem>
                      <SelectItem value="4k">4K</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ['hdrSupport', 'HDR support'],
                        ['dolbyAtmosSupport', 'Dolby Atmos'],
                        ['earlyAccessContent', 'Early access'],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={form[key]}
                          onCheckedChange={(checked) =>
                            setForm({ ...form, [key]: Boolean(checked) })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Devices ──────────────────────────── */}
                <div className="space-y-3 pt-1 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 pt-3">
                    Supported devices
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {DEVICE_OPTIONS.map((device) => {
                      const checked = form.supportedDevices.includes(device);
                      return (
                        <label
                          key={device}
                          className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm capitalize cursor-pointer hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              setForm((f) => ({
                                ...f,
                                supportedDevices: isChecked
                                  ? [...f.supportedDevices, device]
                                  : f.supportedDevices.filter(
                                      (d) => d !== device,
                                    ),
                              }));
                            }}
                          />
                          {device}
                        </label>
                      );
                    })}
                  </div>
                  {form.supportedDevices.length === 0 && (
                    <p className="text-[11px] text-red-500">
                      At least one device must be selected.
                    </p>
                  )}
                </div>

                {/* ── Features ─────────────────────────── */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="features"
                    className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    Features{' '}
                    <span className="normal-case font-normal">
                      (one per line)
                    </span>
                  </Label>
                  <textarea
                    id="features"
                    value={form.featuresText}
                    onChange={(e) =>
                      setForm({ ...form, featuresText: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-1 focus:ring-red-400 focus:border-red-400 resize-none"
                    placeholder={'HD streaming\n2 devices\nDownloads'}
                  />
                </div>
              </>
            )}

            {/* ── Footer nav ───────────────────────────── */}
            <DialogFooter className="gap-2 pt-1">
              {step === 1 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    className="rounded-xl text-gray-500 border-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={!isStep1Valid(form)}
                    onClick={goToStep2}
                    className="bg-red-600 hover:bg-red-700 text-white shadow-none rounded-xl gap-1.5"
                  >
                    Next
                    <ArrowRight className="size-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToStep1}
                    className="rounded-xl text-gray-500 border-gray-200 gap-1.5"
                  >
                    <ArrowLeft className="size-3.5" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={saving || form.supportedDevices.length === 0}
                    onClick={handleSave}
                    className="bg-red-600 hover:bg-red-700 text-white shadow-none rounded-xl"
                  >
                    {saving
                      ? 'Saving…'
                      : editing
                        ? 'Save changes'
                        : 'Create plan'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Stats Dialog ──────────────────────────── */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="size-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight text-gray-900">
                  {statsForPlan?.name ?? 'Plan'} stats
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Subscription breakdown
                </p>
              </div>
            </div>
          </DialogHeader>

          {stats && (
            <div className="space-y-3 pt-1">
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-5 py-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Total subscriptions
                </span>
                <span className="text-2xl font-extrabold text-gray-900">
                  {stats.totalSubscriptions.toLocaleString()}
                </span>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {Object.entries(stats.byStatus).map(
                  ([status, count], i, arr) => (
                    <div
                      key={status}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 text-sm',
                        i < arr.length - 1 && 'border-b border-gray-100',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'size-2 rounded-full flex-shrink-0',
                            status === 'active'
                              ? 'bg-emerald-500'
                              : status === 'paused'
                                ? 'bg-amber-400'
                                : 'bg-red-500',
                          )}
                        />
                        <span className="capitalize text-gray-500">
                          {status}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {Number(count).toLocaleString()}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatsOpen(false)}
              className="w-full rounded-xl border-gray-200 text-gray-600"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
