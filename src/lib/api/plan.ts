import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export type Device = 'mobile' | 'tablet' | 'desktop' | 'tv' | 'console';

export type Plan = {
  id: number;
  name: string;
  highlightText: string | null;
  description: string | null;
  index: number;
  default: boolean;
  planType: 'free' | 'paid';
  currency: string;
  currencySign: string;
  originalPrice: number | null;
  discount: number;
  price: number;
  billingCycle: string;
  durationInDays: number;
  trialDays: number;
  trialPrice: number | null;
  postTrialPlanId: number | null;
  maxScreens: number;
  videoQuality: 'sd' | 'hd' | 'fhd' | '2k' | '4k';
  hdrSupport: boolean;
  dolbyAtmosSupport: boolean;
  earlyAccessContent: boolean;
  supportedDevices: Device[];
  features: string[];
  isActive: boolean;
};

export type CreatePlanInput = {
  name: string;
  description?: string;
  highlightText?: string;
  index?: number;
  default?: boolean;
  isActive?: boolean;
  planType?: 'free' | 'paid';

  currency?: string;
  currencySign?: string;
  price: number;
  originalPrice?: number;
  discount?: number;

  billingCycle: string;
  durationInDays: number;

  trialDays?: number;
  trialPrice?: number;
  postTrialPlanId?: number;

  maxScreens?: number;

  videoQuality?: 'sd' | 'hd' | 'fhd' | '2k' | '4k';
  hdrSupport?: boolean;
  dolbyAtmosSupport?: boolean;
  earlyAccessContent?: boolean;

  supportedDevices?: Device[];
  features?: string[];
};

// Update payload: unlike create, clearable optional fields accept `null`
// so the PATCH can explicitly wipe a previous value (omitting the key
// leaves the existing DB value untouched — see plan.service.ts).
export type UpdatePlanInput = Partial<
  Omit<
    CreatePlanInput,
    'description' | 'highlightText' | 'originalPrice' | 'trialPrice' | 'postTrialPlanId'
  >
> & {
  description?: string | null;
  highlightText?: string | null;
  originalPrice?: number | null;
  trialPrice?: number | null;
  postTrialPlanId?: number | null;
};

export type GetPlansResponse = {
  plans: Plan[];
  total: number;
};

export type PlanStats = {
  planId: number;
  totalSubscriptions: number;
  byStatus: Record<string, number>;
  totalUsers: number;
  activeUsers: number;
  revenue: number;
};

// Get all plans
export const getPlans = (
  params: {
    limit?: number;
    offset?: number;
    status?: 'active' | 'inactive' | 'all';
  } = {},
) =>
  apiGet<GetPlansResponse>('/plan', {
    orderBy: 'index',
    order: 'asc',
    ...params,
  });

// Get plan by id
export const getPlanById = (id: number) =>
  apiGet<{ plan: Plan }>(`/plan/${id}`);

// Get plan stats
export const getPlanStats = (id: number) =>
  apiGet<PlanStats>(`/plan/${id}/stats`);

// Create plan
export const createPlan = (body: CreatePlanInput) =>
  apiPost<{ plan: Plan }>('/plan/create', body);

// Update plan
export const updatePlan = (id: number, body: UpdatePlanInput) =>
  apiPatch<{ plan: Plan }>(`/plan/${id}/update`, body);

// Activate / Deactivate
export const setPlanStatus = (id: number, isActive: boolean) =>
  apiPatch<{ plan: Plan }>(`/plan/${id}/status`, { isActive });

// Set default plan
export const setDefaultPlan = (id: number, isDefault: boolean) =>
  apiPatch<{ plan: Plan }>(`/plan/${id}/default`, { default: isDefault });

// Delete plan
export const deletePlan = (id: number) => apiDelete(`/plan/${id}/delete`);
