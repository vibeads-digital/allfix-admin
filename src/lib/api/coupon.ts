import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export type Coupon = {
  id: number;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number;
  minimumAmount: number | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CouponUsageRow = {
  id: number;
  discountAmount: number;
  usedAt: string;
  subscriptionId: number;
  userId: number;
  userName: string | null;
  userEmail: string;
};

export type CreateCouponInput = {
  code: string;
  description?: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  minimumAmount?: number;
  validFrom: string;
  validUntil?: string;
  planIds?: number[];
};

export type CouponDetails = {
  id: number;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number;
  minimumAmount: number | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  planIds: number[];
};
export const getCoupons = (
  params: {
    limit?: number;
    offset?: number;
    status?: 'active' | 'inactive' | 'all';
  } = {},
) =>
  apiGet<{ coupons: Coupon[]; total: number }>(
    '/coupon',
    params as Record<string, unknown>,
  );

export const getCouponStats = () =>
  apiGet<{ activeCount: number; totalRedemptions: number }>('/coupon/stats');

export const createCoupon = (body: CreateCouponInput) =>
  apiPost<{ coupon: Coupon }>(
    '/coupon/create',
    body as Record<string, unknown>,
  );

export const updateCoupon = (
  id: number,
  body: Partial<Omit<CreateCouponInput, 'code'>>,
) =>
  apiPatch<{ coupon: Coupon }>(
    `/coupon/${id}/update`,
    body as Record<string, unknown>,
  );

export const setCouponStatus = (id: number, isActive: boolean) =>
  apiPatch<{ coupon: Coupon }>(`/coupon/${id}/status`, { isActive });

export const getCouponById = (id: number) =>
  apiGet<CouponDetails>(`/coupons/${id}`);

export const deleteCoupon = (id: number) => apiDelete(`/coupon/${id}`);

export const getCouponUsage = (
  id: number,
  params: { limit?: number; offset?: number } = {},
) =>
  apiGet<{ usage: CouponUsageRow[]; total: number }>(
    `/coupon/${id}/usage`,
    params as Record<string, unknown>,
  );
